# Singular Systems — Complete Implementation Plan

## Goal

Transform Singular Systems from a partially-built prototype with multiple broken
features and overlapping systems into a complete, production-ready AI-assisted
custom PC builder store. The work eliminates legacy dead code, fixes all critical
and high-severity bugs documented in `fix.md`, and ships a clean AI architecture.

---

## Tech Stack

### Current (keep)

| Layer | Technology |
|---|---|
| Backend framework | Django 4.2 + Django REST Framework |
| Auth | JWT via `djangorestframework-simplejwt` (HttpOnly cookies) |
| Database | PostgreSQL |
| Frontend framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 |
| State management | Zustand |
| Animations | Framer Motion |
| HTTP client | Axios |
| Routing | React Router v7 |
| Containerization | Docker + Docker Compose |

### Add now

| Layer | Technology | Reason |
|---|---|---|
| Cache / SSE broker | **Redis** | Cache Gemini catalog payload (5 min TTL), rate-limit AI calls, Django cache backend |
| Background tasks | **Celery + Redis broker** | Guest session cleanup, async order processing |
| Fuzzy matching | **rapidfuzz** | Already present in seed command — keep for any future import tooling |
| AI | **Google Gemini (`google-genai`)** | Already integrated — extend for recommendation ranking |
| Validation | **django-environ** | Parse `DATABASE_URL` from Docker env cleanly |

### Future (do not build now)

| Technology | Trigger |
|---|---|
| Razorpay / Stripe | When payment flow is implemented (Phase 6) |
| Celery Beat | When scheduled cleanup needs to be persistent across restarts |
| Sentry | When going to production |
| CDN (Cloudflare / AWS CloudFront) | When product image volume grows |

---

## What to Delete

These exist in the codebase today and must be removed before any new work:

| Path | Reason |
|---|---|
| `backend/project/api/views.py` | TF-IDF/CSV system — dead, buggy, loads CSV at import time |
| `backend/project/api/buildsfinal2.csv` | Source data for dead TF-IDF system |
| `backend/project/api/recommendation_service.py` | Synergy-score DB recommender being replaced |
| `backend/project/recommmender/` (entire app) | Typo-named duplicate of `recommender/` |
| `backend/project/recommender/` (entire app) | Synergy model replaced by AI ranking |
| `backend/project/recommender/management/commands/seed_synergy.py` | Seeding dead synergy table |
| `backend/project/final_verdict.py` | Stale script |
| `backend/project/test_db.py` | Stale script |
| `backend/project/db.sqlite3` | Not the authoritative DB |
| `frontend/src/components/builder/AIDrawer.jsx` | Builder assist feature being dropped |
| `frontend/src/components/builder/PartList.jsx` | Likely dead — verify vs ComponentGrid |

---

## Architecture: AI Recommendation Engine (replaces TF-IDF + Synergy DB)

```
User on builder step (e.g., picking GPU)
         │
         ▼
 Layer 1 — Python compatibility filter (no AI)
 Gpu.objects.filter(stock__gt=0) + wattage headroom rule
 → returns QuerySet of ~N compatible GPUs
         │
         ▼
 Layer 2 — Gemini ranking (AI, structured output)
 Prompt: "From these N compatible GPUs, rank the top 3
          for a [gaming/editing] build with this CPU/MB.
          Return JSON: [{id, rank, reason}]"
 Result cached in Redis by session_id + step (5 min TTL)
         │
         ▼
 Layer 3 — Merge and return
 API response: compatible parts list with
   is_recommended, recommendation_rank, recommendation_reason
         │
         ▼
 Frontend: renders all compatible parts,
           highlights top-3 with badge + reason tooltip
```

The chatbot (`stream_chat`) is unchanged — it handles Q&A and full build suggestions.

---

## Phases

---

### Phase 1 — Database & App Cleanup (Foundation)

**Goal:** One clean DB schema, no duplicate apps, migrations in sync.

#### Backend

- Remove `recommmender/` app entirely, keep `recommender/` temporarily until migration squash
- After squash, remove `recommender/` app entirely (no models needed — AI replaces synergy)
- Remove `api/` app (TF-IDF dead code)
- Remove `api/` from `INSTALLED_APPS` and URL conf
- Remove `recommender` from `INSTALLED_APPS`
- Run `makemigrations --check` → zero drift target
- Add `django-environ`, parse `DATABASE_URL` in `settings.py`
- Fix `settings.py` `DATABASES` to read from `DATABASE_URL` env var (Docker compat)
- Fix production frontend `.env` — use `/api` relative path, not `localhost:8000`
- Add `django-redis` as cache backend; configure `CACHES` to use Redis
- Delete: `db.sqlite3`, `buildsfinal2.csv`, `final_verdict.py`, `test_db.py`
- Squash or clean all migrations from removed apps

#### Verification

- `docker compose up` → backend connects to PostgreSQL (not localhost fallback)
- `python manage.py migrate` from empty DB succeeds
- `python manage.py makemigrations --check` → no pending migrations

---

### Phase 2 — Authentication & Authorization

**Goal:** Secure auth, no data leaks, guest sessions work correctly.

> [!CAUTION]
> `fix.md` Topic 1 found a **Critical** bug: `BuildSessionSerializer` with `depth=1` leaks password hashes in API responses. This must be fixed before anything else ships.

#### Backend

- Replace `BuildSessionSerializer(depth=1)` with explicit nested read-only component
  serializers that never include `password`, `permissions`, or internal fields
- Add `/api/accounts/me/` endpoint returning safe user profile
- Add `claim-session` endpoint:
  - Verifies guest secret
  - Assigns session to `request.user`
  - Clears / rotates `session_secret`
  - Clears `session_expires_at`
  - Rejects claim if session already belongs to another user
- Enforce `session_expires_at` on every guest builder request
- Change all public catalog `ModelViewSet`s to `ReadOnlyModelViewSet`
  (staff-only writes via `IsAdminUser` permission)
- Make contact endpoint create-only for public; list/retrieve/update/delete for staff only
- Run Django password validators during signup; return field-level errors
- Add `signup` throttle class: `5/hour`
- Add `llm` throttle class: `20/hour` (AI endpoints)

#### Frontend

- On app startup: call `/accounts/me/` — do not trust `is_logged_in` from localStorage
- Add single Axios response interceptor: on 401 → attempt token refresh once → retry
- Preserve `{ from: location }` state through login redirect; resume original action after login
- Fix `AuthModal` signup payload to send `first_name` + `last_name` (not `username`)
- Logout: clear all private in-memory state; do not leave cart/build visible

---

### Phase 3 — Compatibility Engine & Builder Backend

**Goal:** Every builder step returns correct, stock-filtered, compatible parts from DB.

> [!IMPORTANT]
> `compatibility.py` has bugs: `ram.objects`, `psu.objects`, `case.objects` are lowercase (undefined). These crash RAM, PSU, and Case step requests right now.

#### Backend — Fix `CompatibilityEngine`

- Fix import references: `Ram.objects`, `Psu.objects`, `Case.objects`
- Add missing model fields required for case/GPU physical compatibility:
  - `Gpu.length_mm` (IntegerField, nullable)
  - `Case.max_gpu_length_mm` (IntegerField, nullable)
  - `Case.supported_form_factors` (JSONB, GIN indexed)
  - Generate and run migration
- Add `stock__gt=0` filter to every `get_compatible_*` method
- Implement `get_options(session, step)` unified method
- Implement `apply_selection(session, field, value)`:
  - Reject if `value` not in compatible queryset for that step
  - After applying, revalidate downstream components
  - Clear only newly incompatible selections (not all downstream)
  - Return structured `{"cleared_fields": ["ram", "psu"]}` list
- Implement `validate(session, require_complete=False)`:
  - When `require_complete=True` (checkout), require all 8 parts present
- Add `status == "building"` guard on all selection endpoints
- Add `BuildSession.status` choice `"ordered"` to model

#### Backend — Options API

- Return complete component data per card:
  `id, name, price, wattage, description, image, socket, ram_type, capacity_gb, form_factor`
  plus `is_recommended, recommendation_rank, recommendation_reason` (from Phase 5)
- Add DRF pagination: `PageNumberPagination`, 20 per page, return `count` + `next`

#### Backend — Prebuilts

- Replace hardcoded `atom-s`, `vector-g`, `apex-w` IDs in homepage with
  DB-backed `PrebuiltPC` objects (featured flag or top-3 by category)
- Add `stock` / `available` field to `PrebuiltPC`
- Add prebuilt ordering flow: prebuilt → cart → checkout (same path as custom build)

#### Frontend

- Fix `ComponentGrid` to support load-more / pagination (use `count` + `next` from API)
- Add explicit loading, error, empty, and retry states (not silent empty list on failure)
- Show toast when a downstream part was auto-cleared after compatibility change
- Restore build from backend on app startup (don't render stale localStorage)
- Use one source of truth for step index (store, not local state in `Builder.jsx`)
- Wire filter/info buttons in builder component UI (sort by price, wattage)

---

### Phase 4 — Cart & Session Persistence

**Goal:** Server-side cart, guest merge on login, cross-device restore.

#### Backend — New Models

```python
# Add to app0/models.py
class Cart(models.Model):
    id = UUIDField(primary_key=True, default=uuid4)
    user = ForeignKey(UserAccount, null=True, blank=True, on_delete=CASCADE)
    guest_token = CharField(max_length=128, null=True, blank=True, db_index=True)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

class CartItem(models.Model):
    id = UUIDField(primary_key=True, default=uuid4)
    cart = ForeignKey(Cart, on_delete=CASCADE, related_name='items')
    item_type = CharField(max_length=20)   # 'custom_build' | 'prebuilt'
    build_session = ForeignKey(BuildSession, null=True, blank=True, on_delete=CASCADE)
    prebuilt = ForeignKey(PrebuiltPC, null=True, blank=True, on_delete=CASCADE)
    price_at_add = IntegerField()
    added_at = DateTimeField(auto_now_add=True)
```

#### Backend — Cart APIs

- `GET /api/cart/` — return user's cart (authenticated) or guest cart (token)
- `POST /api/cart/items/` — add build session or prebuilt to cart
- `DELETE /api/cart/items/<id>/` — remove item
- `POST /api/cart/reprice/` — refresh prices and stock validity from DB
- Atomic login merge endpoint:
  - Claim guest build → assign to user
  - Merge guest cart into user server cart
  - Deduplicate identical sessions/prebuilts
  - Reprice every item
  - Rotate/clear guest credentials

#### Frontend

- On startup: call `/accounts/me/` → if authenticated, fetch server cart
- On startup: if unauthenticated, fetch/validate guest session from backend
- On login: trigger atomic merge, replace local cart with server cart
- On logout: clear private in-memory state; preserve server data for next login
- One canonical checkout flow: `Summary → Cart → Checkout` (remove competing flow)
- Use `build_session_id` consistently (not mixed `sessionId` / `customBuild.id`)
- Show loading/error state instead of ₹0 when repricing fails

---

### Phase 5 — AI Recommendation Engine

**Goal:** Gemini-powered `is_recommended` badges replacing TF-IDF and synergy DB.

> [!NOTE]
> This phase can only start after Phase 3 (compatibility engine fixed) because
> the ranking prompt receives only the already-filtered compatible queryset.

#### Backend — New `llm/recommendation.py`

```python
# Pseudocode — actual implementation will be cleaner

RANK_PROMPT = """
You are a PC hardware expert. Given a partial build and a list of compatible {part_type}s
from our store, rank the top 3 by best value-for-money and performance fit.

Current build: {build_summary}
Use case: {purpose}
Compatible {part_type}s (only pick from these IDs):
{parts_json}

Return ONLY this JSON, no other text:
{{"recommendations": [{{"id": "<id>", "rank": 1, "reason": "<15 words max>"}}]}}
"""

class AIRankingService:
    @classmethod
    def get_ranked_recommendations(cls, session, compatible_qs, part_type):
        # 1. Check Redis cache: key = f"rec:{session.id}:{part_type}:{session.updated_at}"
        # 2. On miss: serialize compatible_qs IDs + names + prices + key specs
        # 3. Call Gemini with structured output (JSON mode)
        # 4. Validate returned IDs exist in compatible_qs
        # 5. Cache result 5 minutes
        # 6. Return list of {id, rank, reason}
```

#### Backend — Options endpoint update

- After `get_compatible_*` returns queryset, call `AIRankingService.get_ranked_recommendations`
- Merge `recommendation_rank` and `recommendation_reason` into each item's serialized data
- If Gemini call fails or times out: return parts without recommendation fields (graceful degradation)
- Limit prompt: order compatible queryset by `performance_tier DESC` and `price ASC`, and send ONLY the top 10 to Gemini (reduces token bloat and guarantees mathematical superiority)
- Add `llm` throttle scope to recommendation endpoint

#### Backend — Chatbot safety (stream_chat improvements)

- Add strict system prompt section: explicit refusal policy for off-topic, sensitive,
  credential, medical, legal, financial, and prompt-injection requests
- Add server-side input validation before calling Gemini:
  - Max message length: 2000 chars
  - Max history messages: 20
  - Reject obviously off-topic payloads with a canned response (don't call Gemini)
- Allow guests to use chatbot (use build secret for auth on LLM endpoints)
- On Gemini error: return a safe error message string, not `str(e)` with stack detail
- Fix SSE frontend parser: buffer partial lines across chunk boundaries
- Log: latency, token count (if available), policy category, failure type

#### Frontend

- Remove `AIDrawer.jsx` and all references to builder assist
- Recommendation cards: show rank badge (🥇 🥈 🥉) + reason tooltip on hover
- Chatbot: show proper error state when API returns non-stream error
- Chatbot: allow guest users (pass build secret header)

---

### Phase 6 — Checkout, Orders & Payments

**Goal:** Atomic, idempotent checkout; correct pricing; address management.

> [!WARNING]
> `fix.md` Topic 5 found a **Critical** bug: stock is decremented before
> validating the shipping address. A failed checkout permanently reduces stock.

#### Backend — Separate proceed-to-buy from place-order

**Step 1 — `/builder/proceed-to-buy/` (existing, simplified)**

- Validate: auth, build ownership, `status == "building"`, completeness, compatibility
- Set `status = "ready_to_buy"`
- Return session summary — do NOT touch stock or create order

**Step 2 — `/orders/place/` (new)**

```python
with transaction.atomic():
    session = BuildSession.objects.select_for_update().get(...)
    # Validate: owner, status == ready_to_buy, completeness, compatibility
    # Validate: shipping address exists (snapshot it to JSON)
    # SORT component IDs to prevent deadlocks
    # Lock all components: ComponentBase.objects.select_for_update().filter(id__in=sorted_ids)
    # Recheck stock for every component
    # Recalculate total server-side (component sum + assembly + tax)
    # Create Order with locked total
    # Create OrderItems with price_at_purchase snapshots
    # Decrement stock atomically
    # Set session.status = "ordered"
    # Return order ID
# Any exception → full rollback
```

- Add idempotency key (UUID from frontend, stored on Order): duplicate key → return existing order
- Standardize currency: all DB values in **rupees** (integer); convert to paise only when calling payment gateway
- Return safe error codes (`"INSUFFICIENT_STOCK"`, `"ADDRESS_REQUIRED"`) — never raw `str(e)`

#### Backend — Address APIs

- `GET /api/accounts/addresses/` — list user's addresses
- `POST /api/accounts/addresses/` — create address
- `PATCH /api/accounts/addresses/<id>/` — update
- `DELETE /api/accounts/addresses/<id>/` — delete
- `POST /api/accounts/addresses/<id>/set-default/` — set default
- Ownership check on every operation

#### Backend — Pricing policy (single source of truth)

```python
ASSEMBLY_CHARGE = 350   # ₹
TAX_RATE = 0.08         # 8%

def calculate_order_total(session):
    components_total = session.total_price
    assembly = ASSEMBLY_CHARGE
    tax = int((components_total + assembly) * TAX_RATE)
    return components_total + assembly + tax
```

#### Frontend

- Add address management page/modal (CRUD)
- Checkout flow: show address selector → place order → order confirmation
- Display server-calculated total (components + assembly + tax) — not frontend-computed
- Show order confirmation page with order ID
- Handle `INSUFFICIENT_STOCK` and `ADDRESS_REQUIRED` error codes with actionable UI

#### Payment (stub for now)

- `Payment` model and `Order.payment_status` already exist
- Orders are created in `pending` payment status
- Add `POST /orders/<id>/mark-paid/` (staff only, for manual confirmation)
- Full Razorpay/Stripe integration is a future milestone

---

### Phase 7 — Deployment & Infrastructure

**Goal:** `docker compose up` works end-to-end; production config is correct.

#### Backend

- Add `django-environ`; replace manual `os.environ.get` DB config with `env.db("DATABASE_URL")`
- Add Redis service to `docker-compose.yml`
- Add Celery worker service to `docker-compose.yml`
- Configure `django-redis` as Django cache backend in `settings.py`
- Schedule guest session cleanup via Celery Beat (daily, `DELETE FROM buildsession WHERE session_expires_at < NOW() AND user_id IS NULL`)
- Remove `recommmender` from `INSTALLED_APPS` and `urls.py`
- Verify `makemigrations --check` passes from a clean DB

#### Frontend

- Remove hardcoded `http://localhost:8000` from `.env` and `vite.config.js`
- Production: use relative `/api/` path (proxied by Nginx)
- Development: use `VITE_API_URL=http://localhost:8000` from `.env.local`

#### Docker

```yaml
# services to add/update in docker-compose.yml
redis:
  image: redis:7-alpine
  ports: ["6379:6379"]

# Ensure backend web service uses ASGI (e.g., uvicorn project.asgi:application) to prevent SSE connection blocking.

celery:
  build: ./backend
  command: celery -A project worker -l info
  depends_on: [db, redis]

# backend service: add REDIS_URL env var
```

---

### Phase 8 — Testing & Quality Gates

**Goal:** All critical paths tested; no lint errors; completion gate passes.

#### Backend tests (pytest-django)

- **Auth:** guest browse, checkout 401 gate, session expiry, claim-and-rotate secret,
  cross-user access denial, catalog read-only, contact create-only
- **Builder:** every options type, socket/RAM/PSU/stock rules, incompatible selection rejection,
  selective downstream clearing, complete-build validation
- **AI:** 0–3 recommendations, all recommended items compatible + in-stock,
  LLM output validated, out-of-scope chatbot refusal, prompt-injection refusal
- **Cart/Session:** refresh restore, guest→user merge, cross-device restore, logout privacy
- **Checkout:** missing address, out of stock, concurrent purchase (race condition),
  transaction rollback on failure, idempotent order placement, price consistency

#### Frontend tests (Vitest + Playwright)

- Fix 26 ESLint errors (hook dependencies, `__dirname`, unused code)
- Vitest unit: component rendering, Zustand store actions
- Playwright E2E: browse prebuilt → custom build → login at checkout → order confirmation

#### Code cleanup

- Remove dead components: `AIDrawer.jsx`, any old builder summaries/navbars/footers
  that are no longer rendered
- Fix character encoding (₹ signs rendered as mojibake in several files)
- Delete `contact/tests.py` file (conflicts with `contact/tests/` package)

---

## Recommended Execution Order

| Phase | Depends on | Estimated scope |
|---|---|---|
| 1 — DB & App Cleanup | — | Small |
| 2 — Auth & Authorization | 1 | Medium |
| 3 — Compatibility Engine & Builder | 1, 2 | Large |
| 4 — Cart & Session Persistence | 2, 3 | Medium |
| 5 — AI Recommendation Engine | 3 | Medium |
| 6 — Checkout & Orders | 2, 3, 4 | Large |
| 7 — Deployment & Infrastructure | 1, all | Small |
| 8 — Testing & Quality Gates | all | Large |

---

## Resolved Design Decisions

1. **Chatbot for guests:** **Yes.** Guests can use the chatbot to reduce top-of-funnel friction. Throttled to 20/hour using `X-Session-Secret` or IP address as the cache key.
2. **Payment integration:** **Stubbed.** Use the `"pending"` payment status and build a staff-only `/api/orders/<id>/mark-paid/` endpoint to avoid blocking launch on Stripe/Razorpay API approval.
3. **Prebuilt stock model:** **Simple integer.** Prebuilt PCs are independent physical SKUs sitting on a shelf, not dynamically assembled from loose custom parts inventory.
4. **Recommendation prompt scope:** **Combined approach.** Pass both user purpose and budget so the AI returns highly specific reasoning micro-copy (e.g., *"Best value for 4K video editing within your budget due to high VRAM"*).
