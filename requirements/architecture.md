# Backend Architecture — Singular Systems

> **Status:** Finalized as of 2026-06-16.
> Covers Django/DRF backend only. Frontend architecture is separate.
> Aligns with `db_schema.md` and decisions made in planning.

---

## 1. Architectural Principles

Before the diagrams: the core decisions that shape every layer.

| Decision | Choice | Reason |
|---|---|---|
| Compatibility engine | **Deterministic Python rules** | Correctness > flexibility. Hardware compatibility is binary, not probabilistic. LLMs must never determine if a GPU fits a case |
| Recommendation engine | **SQL filter → Gemini ranking** | Filter compatible parts by SQL first; send the shortlist (~10 parts) to Gemini for ranking and explanation. No vector DB, no RAG |
| Guest state | **Server-side sessions** | Shareable build links, abandoned-build analytics, server-side price validation. Cookie-stored `guest_token` |
| Async work | **Celery + Redis** | Guest session cleanup, order confirmation emails. Cart stock check is **synchronous** in `CartService.validate()` — see §10 |
| AI streaming | **SSE via `StreamingHttpResponse`** | Chatbot responses stream token-by-token to the React client |
| No JSONB for scalars | **Explicit typed columns** | Faster `__gte`/`__lte` ORM filters; type-safe; proper indexing |
| No RAG / pgvector | **Not needed** | Catalog is small and structured. SQL already does retrieval. Gemini reasons from the spec data you send it |

---

## 2. High-Level System Topology

```
┌───────────────────────────────────────┐
│           React SPA (Vite)            │
│  Zustand · Axios · Framer Motion      │
└────────────────┬──────────────────────┘
                 │  REST (JSON) + SSE (chatbot stream)
                 ▼
┌───────────────────────────────────────┐
│         Django REST Framework         │
│              API Gateway              │
│   JWT Auth · DRF Views · Serializers  │
└──────┬──────────────┬─────────────────┘
       │              │
       ▼              ▼
┌─────────────┐  ┌───────────────────────────────────────────────┐
│  PostgreSQL │  │              Service Layer                     │
│  (Primary)  │  │                                               │
│             │  │  CompatibilityEngine  RecommendationService   │
│  app0_*     │  │  CartService          BuildScoringEngine      │
│  accounts_* │  │  OrderService         ChatService             │
│  llm_*      │  └────────────────────────────┬──────────────────┘
└──────┬──────┘                               │
       │                               ┌──────▼──────┐
       │                               │  Gemini API │
       │                               │  (google-   │
       │                               │   genai)    │
       │                               └─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────────────────────┐
│    Redis    │────▶│  Celery Worker               │
│  (Cache +   │     │  - Guest session cleanup     │
│   Broker)   │     │  - Order confirmation email  │
└─────────────┘     └─────────────────────────────┘
```

---

## 3. Django App Structure

```
backend/project/
├── project/
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py             # Root URL conf
│   ├── celery.py           # Celery app config
│   └── wsgi.py / asgi.py
│
├── accounts/               # Auth — UserAccount model, JWT views
│   ├── models.py           # Custom AbstractBaseUser
│   ├── serializers.py
│   ├── views.py            # register, login, token refresh, profile
│   └── urls.py
│
├── app0/                   # Core domain — hardware catalog + builder
│   ├── models.py           # All component models + BuildSession + Order*
│   ├── admin.py            # Django admin registrations
│   ├── serializers.py      # Component serializers, BuildSession serializer
│   ├── views/
│   │   ├── components.py   # CPU/GPU/MB etc. list views
│   │   ├── builder.py      # BuildSession CRUD + step application
│   │   ├── cart.py         # Cart + CartItem views
│   │   ├── orders.py       # Order creation + status
│   │   └── prebuilt.py     # PrebuiltPC list/detail
│   ├── services/           # Business logic — never in views
│   │   ├── compatibility.py    # CompatibilityEngine
│   │   ├── recommendation.py   # RecommendationService (Gemini ranking)
│   │   ├── build_scoring.py    # BuildScoringEngine
│   │   ├── cart_service.py     # CartService (merge, validate, reprice)
│   │   └── order_service.py    # OrderService (atomic creation)
│   ├── tasks.py            # Celery tasks (cleanup, email)
│   └── urls.py
│
├── llm/                    # AI chatbot
│   ├── models.py           # ChatSession, ChatMessage
│   ├── serializers.py
│   ├── views.py            # ChatSession CRUD, message stream endpoint
│   ├── services/
│   │   └── chat_service.py # Prompt builder, Gemini streaming call
│   └── urls.py
│
└── manage.py
```

---

## 4. Service Layer — Responsibilities

Views are thin. All logic lives in `services/`. Services are pure Python classes — no HTTP, no serializers.

### `CompatibilityEngine`

Location: `app0/services/compatibility.py`

Single responsibility: given a `BuildSession`, return a filtered queryset of compatible parts for the next step.

```
Input:  BuildSession (with selected parts so far)
Output: Queryset[ComponentType] — only compatible, in-stock parts

Rules enforced (in order):
1. Platform gating        cpu.platform == session.platform
2. Socket match           cpu.socket == motherboard.socket
3. RAM type match         motherboard.ram_type == ram.ram_type
4. RAM slot cap           ram_quantity <= motherboard.ram_slots
5. CPU↔Cooler socket      cpu.socket in cooler.supported_sockets
6. Storage M.2 slot       if storage.interface == 'M.2': mb.m2_slots_count >= needed
7. Storage SATA port       if storage.interface == 'SATA': mb.sata_ports_count >= needed
8. PSU sizing             psu.wattage >= session.system_tdp * 1.30
9. GPU↔Case length        gpu.length_mm <= case.max_gpu_length_mm
10. Mobo↔Case form factor  motherboard.form_factor in case.supported_form_factors
11. Cooler↔Case height     cooler.height_mm <= case.max_cooler_height_mm (air)
                           cooler.radiator_size_mm in case.supported_radiator_sizes (AIO)
12. Stock gate             component.stock > 0 (on every query)
```

Nullable field behavior: if either field in a dimensional rule is `null`/`[]`, that check is skipped. Parts are not excluded by default.
*Special Case for TDP:* Components with missing/null `tdp` default to `0` and are added to the `system_tdp` sum; a missing TDP does NOT skip the PSU sizing rule entirely. Upstream validation applies: if a new downstream component pushes `system_tdp` over the current PSU limit, the PSU is dropped to `null`.

---

### `RecommendationService`

Location: `app0/services/recommendation.py`

Picks up after `CompatibilityEngine` has filtered. Takes the compatible queryset, applies a Gemini ranking call, and returns the top 3 with explanations.

```
Input:  compatible_queryset, session (purpose, budget, selected parts)
Output: List[{part_id, part_name, reason_text}] — top 3

Flow:
1. Sort compatible parts by performance_tier DESC, price ASC
2. Take top 10 (cap prompt size)
3. Build structured prompt:
   "User is building a {purpose} PC with {budget} budget.
    Already selected: {cpu}, {gpu}, ...
    Rate these {component_type} options (best first) with a one-line reason:
    [{name, price, performance_tier, key_specs...}, ...]"
4. Call Gemini (gemini-2.0-flash), expect JSON array response
5. Return top 3 with reason_text
6. Cache result in Redis (TTL 5 min, key: hash of session state + component type)
```

Fallback: if Gemini call fails or times out, return top 3 sorted by `(performance_tier DESC, price ASC)` with no `reason_text`. Builder does not break.

---

### `BuildScoringEngine`

Location: `app0/services/build_scoring.py`

Pure Python, no AI, no DB writes. Called after any part selection to return live scores.

```
Input:  BuildSession (partial or complete)
Output: BuildScore {
    overall_score     INT (0–100)
    gaming_score      INT (0–100)
    productivity_score INT (0–100)
    upgrade_score     INT (0–100)
    power_score       INT (0–100)   -- PSU headroom
    balance_score     INT (0–100)   -- CPU/GPU tier mismatch penalty
    warnings          List[str]
}

Scoring factors:
- gaming_score:      weighted average of gpu.performance_tier (60%) + cpu.performance_tier (30%) + total_ram_gb (10%)
- productivity_score: cpu.performance_tier (50%) + total_ram_gb (30%) + storage tier (20%)
- upgrade_score:     socket generation score (AM5/LGA1800 = high) + ram_type score (DDR5 = high) + psu headroom
- power_score:       (psu.wattage - system_tdp) / psu.wattage * 100
- balance_score:     penalty when |cpu.performance_tier - gpu.performance_tier| > 3
- warnings:          e.g. "PSU headroom is under 20%" / "CPU and GPU are mismatched tiers"
```

---

### `CartService`

Location: `app0/services/cart_service.py`

Handles all cart state transitions.

```
Methods:
- get_or_create(request)          → Cart  (user or guest)
- add_item(cart, session/prebuilt) → CartItem
- remove_item(cart, item_id)       → None
- merge_guest_cart(guest_token, user) → Cart  (on login — atomic)
- validate(cart)                   → List[CartValidationError]
  - Checks: component.stock > 0 for every part in every build session
  - Checks: price_at_add still matches current price (warns, does not block)
- reprice(cart)                    → Cart  (updates price_at_add snapshots)
```

The `validate()` method is called on every `GET /api/cart/` response. Errors are returned alongside items — the frontend disables checkout for any item with errors.

---

### `OrderService`

Location: `app0/services/order_service.py`

Atomic order creation. Wraps everything in a DB transaction.

```
Input:  user, cart_item, shipping_address_id, idempotency_key
Output: Order

Flow (inside db.transaction.atomic):
1. Sort all component IDs alphanumerically to prevent PostgreSQL deadlocks during concurrent checkouts.
2. Lock all required components using `Product.objects.select_for_update().filter(id__in=sorted_ids)`
3. Re-validate all locked components (stock > 0) and prices (no stale snapshots)
4. Calculate components_total, assembly_charge, tax_amount, total_price
5. Create Order row (saving the shipping_address_snapshot)
6. Create OrderItem rows (with quantity for RAM, component_name snapshot)
7. Set BuildSession.status = 'ordered'
8. Decrement stock on each component (atomic F() expression)
9. Enqueue Celery task: send_order_confirmation_email.delay(order.id)
10. Return Order

On any failure → full rollback, raise OrderCreationError with reason
```

---

### `ChatService`

Location: `llm/services/chat_service.py`

Builds Gemini prompts, manages Tool Calling, and streams responses.

```
Methods:
- get_or_create_session(request, build_session_id)
- build_context_prompt(chat_session)
  - Appends current build state if linked to a BuildSession
  - Appends last 10 messages as conversation history
  - Does NOT append catalog data — Gemini fetches it on demand via tools
- stream_response(prompt, tools) → Generator[str]  (SSE token stream)
- handle_tool_call(tool_name, tool_args) → str  (executes tool, returns result)
- save_message(session, role, content)
```

**Tool Calling Flow** — replaces catalog context stuffing:

```
User: "What is the best GPU under ₹50,000?"

1. Django sends message to Gemini with tool definition:
   search_inventory(category: str, max_price: int = None, min_tier: int = None)

2. Gemini outputs a tool call (not final text):
   { "tool": "search_inventory", "args": { "category": "gpu", "max_price": 50000 } }

3. Django intercepts, runs:
   GPU.objects.filter(price__lte=50000, stock__gt=0)
               .order_by('-performance_tier')[:5]
   Returns structured JSON: [{name, price, performance_tier, tgp, description}, ...]

4. Django sends tool result back to Gemini.

5. Gemini streams final answer to user via SSE:
   "For under ₹50,000, the RTX 4060 Ti is your best option..."
```

> **Why Tool Calling, not context stuffing:** Appending the catalog summary to every message wastes tokens and increases per-call latency and cost. Gemini only fetches inventory data when a user question actually requires it. Prompts stay lean regardless of catalog size.

Available tools exposed to Gemini:

| Tool | Args | What it does |
|---|---|---|
| `search_inventory` | `category`, `max_price`, `min_tier` | Returns top 5 parts filtered by price + tier |
| `get_build_summary` | `session_id` | Returns current build parts + total price + score |
| `check_compatibility` | `component_type`, `component_id` | Returns whether a part is compatible with current session |

System prompt injected on every call:

```
You are a PC building assistant for Singular Systems, an Indian PC store.
Prices are in Indian Rupees (₹). You help users choose components, understand
compatibility, and recommend builds. Use the search_inventory tool to look up
parts — never guess prices or specs. Only recommend parts that exist in our catalog.
```

---

## 5. API Surface

All routes prefixed with `/api/`.

### Auth (`/api/auth/`)

| Method | Path | Description |
|---|---|---|
| POST | `/register/` | Create account |
| POST | `/login/` | Returns JWT access + refresh tokens |
| POST | `/token/refresh/` | Refresh access token |
| GET/PUT | `/profile/` | Get/update user profile |
| GET/POST | `/addresses/` | List/create shipping addresses |
| PUT/DELETE | `/addresses/<id>/` | Update/delete address |

### Builder (`/api/builder/`)

| Method | Path | Description |
|---|---|---|
| POST | `/sessions/` | Create new BuildSession (guest or auth) |
| GET | `/sessions/<id>/` | Get session state (public read-only — shareable link) |
| POST | `/sessions/<id>/select/` | Apply a part selection, returns compatible next parts + recommendations + build score |
| DELETE | `/sessions/<id>/parts/<type>/` | Remove a selected part |
| POST | `/sessions/<id>/clone/` | Clone a session (for "try this build") |

### Components (`/api/components/`)

| Method | Path | Description |
|---|---|---|
| GET | `/cpu/` | List CPUs (platform filter) |
| GET | `/gpu/` | List GPUs |
| GET | `/motherboard/` | List motherboards |
| GET | `/ram/` | List RAM |
| GET | `/psu/` | List PSUs |
| GET | `/cooler/` | List coolers |
| GET | `/storage/` | List storage |
| GET | `/case/` | List cases |

### Cart (`/api/cart/`)

| Method | Path | Description |
|---|---|---|
| GET | `/` | Fetch cart + validation errors |
| POST | `/items/` | Add item to cart |
| DELETE | `/items/<id>/` | Remove item from cart |
| POST | `/reprice/` | Re-validate prices against current DB |

### Pre-built (`/api/prebuilt/`)

| Method | Path | Description |
|---|---|---|
| GET | `/` | List all prebuilts (category/platform filter) |
| GET | `/<id>/` | Prebuilt detail |
| POST | `/<id>/add-to-cart/` | Add prebuilt directly to cart |

### Orders (`/api/orders/`)

| Method | Path | Description |
|---|---|---|
| POST | `/` | Place order (auth required) |
| GET | `/` | Order history |
| GET | `/<id>/` | Order detail |

### AI Chatbot (`/api/chat/`)

| Method | Path | Description |
|---|---|---|
| POST | `/sessions/` | Create chat session (optionally linked to a BuildSession) |
| GET | `/sessions/<id>/messages/` | Fetch message history |
| POST | `/sessions/<id>/messages/` | Send message — returns SSE stream |

---

## 6. Request Lifecycle — Builder Step

The most complex flow: user selects a CPU, backend filters compatible motherboards, recommends top 3, returns build score.

```
POST /api/builder/sessions/<id>/select/
Body: { "component_type": "cpu", "component_id": "ryzen-7-7800x3d" }
Auth: JWT or X-Session-Secret header (guest)

  ↓ BuildSessionView.post()
  ↓ Verify ownership (JWT user or bcrypt secret match)
  ↓ Apply selection → session.cpu = CPU.objects.get(id)
  ↓ session.save()

  ↓ CompatibilityEngine(session).get_compatible("motherboard")
    → Motherboard.objects.filter(
        socket=cpu.socket,
        platform=session.platform,
        stock__gt=0
      )

  ↓ RecommendationService(session, compatible_queryset).get_top3()
    → Sort by performance_tier DESC, take top 10
    → Gemini API call (cached 5 min)
    → Returns [{id, name, reason}] top 3

  ↓ BuildScoringEngine(session).score()
    → Returns {gaming_score, power_score, warnings, ...}

Response 200:
{
  "session": { ...updated session state... },
  "compatible_parts": [ ...filtered motherboard list... ],
  "recommended": [
    { "id": "msi-b650-tomahawk", "name": "MSI B650 Tomahawk", "reason": "Best value AM5 board for gaming at this price point" },
    ...
  ],
  "build_score": {
    "gaming_score": 87,
    "power_score": 92,
    "balance_score": 90,
    "warnings": []
  }
}
```

---

## 7. Request Lifecycle — Cart Validation

```
GET /api/cart/
Auth: JWT or X-Guest-Token cookie

  ↓ CartService.get_or_create(request)
  ↓ CartService.validate(cart)
    → For each CartItem where item_type == 'custom_build':
        loop through session.cpu, .gpu, .motherboard, ...
        if component.stock == 0:
          add error: "RTX 5080 in this build is out of stock"
    → For each CartItem where item_type == 'prebuilt':
        if prebuilt.stock == 0:
          add error: "This prebuilt is out of stock"

Response 200:
{
  "items": [
    {
      "id": "...",
      "item_type": "custom_build",
      "build_session": { ...session summary... },
      "price_at_add": 125000,
      "current_price": 128000,    ← if price changed, warn but don't block
      "errors": [],               ← empty = checkout allowed
      "warnings": ["Price has changed since you added this build"]
    }
  ],
  "checkout_blocked": false
}
```

---

## 8. Authentication & Guest Flow

```
Guest user visits site
  ↓ No token present
  ↓ POST /api/builder/sessions/ → creates BuildSession with session_secret
  ↓ Backend returns { session_id, session_secret }
  ↓ Frontend stores session_secret in localStorage
  ↓ All subsequent builder requests include: X-Session-Secret: <secret>

User registers / logs in
  ↓ POST /api/auth/login/ with { guest_token? }
  ↓ CartService.merge_guest_cart(guest_token, user)  (atomic)
  ↓ BuildSession.user_id = user.id (if unowned session exists)
  ↓ Returns JWT access + refresh tokens
  ↓ Frontend drops session_secret, switches to Bearer JWT

All order endpoints require JWT. Guest cannot place orders.
```

---

## 9. Caching Strategy (Redis)

| Cache key | TTL | Cached value | Invalidated on |
|---|---|---|---|
| `rec:{session_state_hash}:{component_type}` | 5 min | Gemini recommendation result | Part selection change |
| `compatible:{session_id}:{component_type}` | 2 min | Compatible parts queryset (serialized) | Part selection change |
| `catalog:prebuilt:featured` | 10 min | Featured prebuilt list | Admin update |
| `component:{type}:list` | 10 min | Full component list per type | Admin update |

Redis is also used as the Celery broker.

---

## 10. Celery Tasks

| Task | Trigger | What it does |
|---|---|---|
| `cleanup_guest_sessions` | Nightly cron (00:00) | Deletes `BuildSession` + `Cart` rows where `user_id IS NULL AND updated_at < 7 days ago` |
| `send_order_confirmation_email` | On order creation | Sends email receipt with order summary |

> **No `recheck_cart_stock` Celery task.** Cart stock validation is **synchronous** inside `CartService.validate()` during every `GET /api/cart/` request. Checking the `stock` integer of 8 components via indexed UUID lookups takes < 5ms on PostgreSQL. Offloading this to Celery would cause a race condition: the API returns "all clear," then a websocket fires 2 seconds later with "out of stock" — a confusing UX that requires a websocket just to fix a problem that didn't need to be async. Only use Celery for genuinely heavy work: email delivery, PDF invoice generation, nightly cleanup.

---

## 11. Docker Service Layout

```
docker-compose.yml
├── db          PostgreSQL 16
├── redis       Redis 7 (cache + Celery broker)
├── backend     Django (Uvicorn/Daphne ASGI in prod, runserver in dev — Required for non-blocking SSE)
├── worker      Celery worker (same image as backend)
├── beat        Celery beat scheduler (nightly cleanup cron)
└── frontend    React (Vite dev server in dev, Nginx in prod)
```

---

## 12. Technology Decisions — Quick Reference

| Layer | Technology | Version |
|---|---|---|
| Backend framework | Django + DRF | Django 5.x, DRF 3.15 |
| Database | PostgreSQL | 16 |
| Cache / broker | Redis | 7 |
| Async tasks | Celery | 5.x |
| AI model | `gemini-2.0-flash` | via `google-genai` SDK |
| AI streaming | Django `StreamingHttpResponse` (SSE) | — |
| Auth | JWT via `djangorestframework-simplejwt` | — |
| Password hashing (guest secrets) | `bcrypt` via `django-bcrypt` | — |
| Frontend | React 18 + Vite | — |
| State management | Zustand | — |
| HTTP client | Axios (with interceptors) | — |
| Animations | Framer Motion | — |
| Containerization | Docker + Docker Compose | — |
| No RAG | ❌ pgvector not used | Dropped — catalog is structured SQL data |
| No embeddings | ❌ Vector DB not used | Gemini reasons from spec data in prompt |
