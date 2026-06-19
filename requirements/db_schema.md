# Database Schema — Singular Systems

> **Status:** Finalized target schema as of 2026-06-16.
> Reflects current codebase (`app0/models.py`) + all additions agreed in planning.
> See [§11 Migration Delta](#11-migration-delta) for the exact changes vs current code.

---

## Abstract Base Classes

Django `abstract = True` models — never written to DB directly.
Every concrete model lists only its **unique** fields; base fields are inherited.

### `ComponentBase`

Inherited by all hardware component tables.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Auto-generated. Immutable. Used for all FK references and internal joins |
| `slug` | VARCHAR UNIQUE INDEX | Human-readable URL key e.g. `'ryzen-7-7800x3d'`. Mutable — renaming never breaks FKs |
| `name` | VARCHAR | |
| `price` | INT | Stored in ₹ (rupees) |
| `stock` | INT | Default `10` |
| `description` | TEXT | Sent to Gemini as recommendation context |
| `tdp` | INT | Default `0`. Thermal Design Power in watts — used in PSU sizing |
| `performance_tier` | INT NULL | Editorial score 1–10. Used for AI prompt ranking. Manually set per part. See note below |

> **UUID PK + slug:** The primary key is a UUID — immutable, never appears in URLs. The `slug` is the human-readable identifier used in API paths (`/api/components/cpu/ryzen-7-7800x3d/`) and display. Using slug-as-PK would require cascading FK updates across BuildSession, PrebuiltPC, and OrderItem every time a part name is corrected.

> **`performance_tier` vs benchmark_score:** Benchmark scores (Cinebench, 3DMark, etc.) are driver- and test-version-specific and change constantly. A `performance_tier` (1 = budget, 10 = flagship) is set once by you as an editorial decision and stays stable. When Gemini ranks GPUs for a "budget gaming build", you pass the pre-filtered list sorted descending by `performance_tier` — no LLM text-parsing needed.

> **Images:** `ComponentBase` does NOT include an `image` field. Images are handled via `app0_productimage` (see §7) to support multiple product photos per component. Use `is_primary = true` to designate the thumbnail.

> **TDP vs TGP:** TDP is the chip-level heat spec. For GPUs specifically, the PSU rule needs **TGP (Total Graphics Power)** — the actual board draw including VRAM, VRM losses, power connectors. GPU gets `tdp` (display only) **and** `tgp` (PSU calculation). All other components use `tdp` only.
>
> **PSU rule:** `psu.wattage >= (cpu.tdp + gpu.tgp + mb.tdp + (ram.tdp * ram_quantity) + primary_storage.tdp + secondary_storage.tdp + cooler.tdp) * 1.30`

### `TimestampedBase`

Inherited by session/order/cart models.

| Column | Type | Notes |
|---|---|---|
| `created_at` | TIMESTAMP | Auto set on create |
| `updated_at` | TIMESTAMP | Auto updated on every save |

### `UserSessionBase`

Inherited by models that can be owned by either a logged-in user or a guest.
Extends `TimestampedBase`.

| Column | Type | Notes |
|---|---|---|
| `user_id` | FK → `accounts_useraccount` NULL | Set for authenticated sessions; `null` for guests |

> The guest credential field is **not** in this base — it differs per model:
>
> - `BuildSession` uses `session_secret` (SHA-256 hashed or plain high-entropy UUIDv4 — verified on every mutation. Do not use Bcrypt to avoid CPU blocking on rapid builder clicks)
> - `Cart` uses `guest_token` (plain UUID — used as lookup key only)
> - `ChatSession` needs no guest credential (stateless per message)

---

## 1. Authentication & Users

### `accounts_useraccount`

Custom user model. Already implemented. Extends Django's `AbstractBaseUser`.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `email` | VARCHAR UNIQUE | Login identifier |
| `first_name` | VARCHAR | |
| `last_name` | VARCHAR | |
| `password` | VARCHAR | Django hashed |
| `is_active` | BOOLEAN | Default `true` |
| `is_staff` | BOOLEAN | Admin access |
| `created_at` | TIMESTAMP | |

---

## 2. Hardware Catalog

All tables below extend `ComponentBase`. Only **unique** fields are listed per table.

### `app0_cpu`

*Extends `ComponentBase`*

| Column | Type | Notes |
|---|---|---|
| `platform` | VARCHAR INDEX | `'intel'` or `'amd'` |
| `socket` | VARCHAR INDEX | e.g. `'LGA1700'`, `'AM5'` — CPU↔Motherboard and CPU↔Cooler compatibility |

**PSU contribution:** `cpu.tdp`

---

### `app0_motherboard`

*Extends `ComponentBase`*

| Column | Type | Notes |
|---|---|---|
| `platform` | VARCHAR INDEX | `'intel'` or `'amd'` |
| `socket` | VARCHAR INDEX | Must match `app0_cpu.socket` |
| `ram_type` | VARCHAR INDEX | `'DDR4'` or `'DDR5'` — must match `app0_ram.ram_type` |
| `ram_slots` | INT | Default `2`. Caps `BuildSession.ram_quantity`. Common values: `2`, `4` |
| `form_factor` | VARCHAR | `'ATX'`, `'mATX'`, `'ITX'` — must be in `app0_case.supported_form_factors` |
| `m2_slots_count` | INT | Default `2`. Number of M.2 slots — governs NVMe storage compatibility |
| `sata_ports_count` | INT | Default `4`. Number of SATA ports — governs 2.5"/3.5" storage compatibility |

**Storage slot rules:**

- If `primary_storage.interface == 'M.2'`: `motherboard.m2_slots_count >= 1`
- If `secondary_storage.interface == 'M.2'`: `motherboard.m2_slots_count >= 2` (both drives need a slot)
- If either storage uses `'SATA'`: `motherboard.sata_ports_count >= 1` (or `>= 2` if both are SATA)

**PSU contribution:** `motherboard.tdp`

---

### `app0_gpu`

*Extends `ComponentBase`*

| Column | Type | Notes |
|---|---|---|
| `tgp` | INT | **Total Graphics Power** — total board draw used in PSU rule |
| `length_mm` | INT NULL | Physical card length in mm. Must be `≤ app0_case.max_gpu_length_mm` |

> `tdp` (inherited) = GPU die thermal rating, shown on spec sheets (display only).
> `tgp` = actual system power draw. Always use `tgp` for the PSU rule.

**PSU contribution:** `gpu.tgp`

---

### `app0_ram`

*Extends `ComponentBase`*

| Column | Type | Notes |
|---|---|---|
| `ram_type` | VARCHAR INDEX | `'DDR4'` or `'DDR5'` — must match `app0_motherboard.ram_type` |
| `capacity_gb` | INT | Per-kit capacity e.g. `16` for a 16GB kit |

> `BuildSession.ram_quantity` (default `1`) multiplies this. A user choosing a 32GB kit × 2 gets 64GB total and `ram.price * 2` in `total_price`.

**PSU contribution:** `ram.tdp * BuildSession.ram_quantity`

---

### `app0_psu`

*Extends `ComponentBase`*

| Column | Type | Notes |
|---|---|---|
| `wattage` | INT INDEX | PSU output capacity. Rule: `wattage >= system_tdp * 1.30` |
| `efficiency_rating` | VARCHAR NULL | e.g. `'80+ Gold'`, `'80+ Platinum'` — display only |

> `tdp` (inherited) = PSU's own idle draw (~5–10W). `wattage` = output it can deliver. Different values.

---

### `app0_cooler`

*Extends `ComponentBase`*

| Column | Type | Notes |
|---|---|---|
| `cooler_type` | VARCHAR | `'air'` or `'aio'` |
| `supported_sockets` | JSONB **GIN indexed** | e.g. `["AM5", "LGA1700"]` — CPU↔Cooler socket compatibility |
| `height_mm` | INT NULL | **Air coolers only.** Must be `≤ app0_case.max_cooler_height_mm`. Null for AIOs |
| `radiator_size_mm` | INT NULL | **AIO only.** e.g. `120`, `240`, `280`, `360`. Must be in `app0_case.supported_radiator_sizes`. Null for air |

> **GIN index:** `supported_sockets` uses a GIN index (not B-tree). The compatibility rule uses `__contains` lookups (`supported_sockets__contains=["AM5"]`). PostgreSQL B-tree indexes cannot optimize containment checks on JSONB — only GIN can. Declared in Django `Meta.indexes` as `GinIndex(fields=['supported_sockets'])`.

**PSU contribution:** `cooler.tdp`

---

### `app0_storage`

*Extends `ComponentBase`*

| Column | Type | Notes |
|---|---|---|
| `storage_type` | VARCHAR | `'NVMe'`, `'SSD'`, `'HDD'` — user-facing label |
| `interface` | VARCHAR INDEX | `'M.2'`, `'SATA_2.5'`, `'SATA_3.5'` — used in motherboard slot compatibility rule |
| `capacity_gb` | INT | e.g. `1000` for 1TB |

**PSU contribution:** `storage.tdp` (applied once per drive — both primary and secondary if set)

---

### `app0_case`

*Extends `ComponentBase`*

| Column | Type | Notes |
|---|---|---|
| `supported_form_factors` | JSONB **GIN indexed** | e.g. `["ATX", "mATX", "ITX"]` — motherboard form factor must be in this list |
| `max_gpu_length_mm` | INT NULL | GPU physical fit: `gpu.length_mm ≤ this` |
| `max_cooler_height_mm` | INT NULL | Air cooler fit: `cooler.height_mm ≤ this` |
| `supported_radiator_sizes` | JSONB **GIN indexed** | e.g. `[120, 240, 360]` — AIO fit: `cooler.radiator_size_mm` must be in this list |

> **GIN indexes:** Both `supported_form_factors` and `supported_radiator_sizes` use GIN indexes. Standard B-tree indexes do not accelerate `__contains` lookups on JSONB arrays. As the catalog grows, unindexed JSONB containment queries will perform a full table scan. Declared in Django `Meta.indexes` as `GinIndex(fields=['supported_form_factors'])` and `GinIndex(fields=['supported_radiator_sizes'])`.

> `tdp` (inherited) = case fans' power draw (included in PSU calculation).

---

## 3. Product Images

### `app0_productimage`

Supports multiple images per component for e-commerce gallery display.
Replaces the single `image` field that was on `ComponentBase`.
Uses **Django's `GenericForeignKey`** (ContentTypes framework) for type-safe polymorphic relations.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `content_type_id` | FK → `django_content_type` | Points to the model class (e.g. `CPU`, `GPU`, `PrebuiltPC`) |
| `object_id` | UUID | The UUID PK of the target component instance |
| `content_object` | `GenericForeignKey('content_type', 'object_id')` | Django virtual field — not a DB column. Resolves to the actual component instance |
| `image` | ImageField | |
| `is_primary` | BOOLEAN | Default `false`. One per component should be `true` — used as the catalog thumbnail |
| `display_order` | INT | Default `0`. Lower = shown first in gallery |
| `alt_text` | VARCHAR NULL | Accessibility description of the image |

> **Why `GenericForeignKey`:** `ComponentBase` is abstract — it has no single DB table, so a standard FK is impossible. Django's ContentTypes framework is the established solution: `content_type_id` + `object_id` form the polymorphic FK, and Django manages cascading and integrity automatically. Do NOT write custom application-layer signals for this — ContentTypes handles it.
>
> **Implementation:** Each component model adds a `GenericRelation(ProductImage)` for reverse access and efficient cascading deletes. Composite index on `(content_type_id, object_id)` is required for query performance.

---

## 4. Build Session

### `app0_buildsession`

*Extends `UserSessionBase` (which extends `TimestampedBase`)*

Stores the full builder state for guests and authenticated users.
The UUID primary key doubles as the **shareable build link** key.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | `singularsystems.com/build/<id>` — publicly viewable (read-only) |
| `session_secret` | VARCHAR NULL | Bcrypt-hashed token for guest-owned write operations |
| `session_expires_at` | TIMESTAMP NULL | Celery cleanup uses this to purge old guest sessions |
| `platform` | VARCHAR NULL | `'intel'` or `'amd'` |
| `purpose` | VARCHAR NULL | `'gaming'`, `'work'`, `'editing'`, `'general'` — AI ranking context |
| `status` | VARCHAR | `'building'` \| `'ready_to_buy'` \| `'ordered'` \| `'archived'` |
| `cpu_id` | FK → `app0_cpu` NULL | Step 1 |
| `gpu_id` | FK → `app0_gpu` NULL | Step 2 |
| `motherboard_id` | FK → `app0_motherboard` NULL | Step 3 |
| `psu_id` | FK → `app0_psu` NULL | Step 4 |
| `ram_id` | FK → `app0_ram` NULL | Step 5 |
| `ram_quantity` | INT | Default `1`. Max capped by `motherboard.ram_slots`. Multiplies `ram.price` and `ram.tdp` |
| `primary_storage_id` | FK → `app0_storage` NULL | Step 6 — required |
| `secondary_storage_id` | FK → `app0_storage` NULL | Step 6b — optional |
| `cooler_id` | FK → `app0_cooler` NULL | Step 7 |
| `case_id` | FK → `app0_case` NULL | Step 8 — last, after all dimension data is known |

> **Why Case is last:** By the time the user reaches the Case step all three case filters can fire simultaneously — GPU length (Step 2), motherboard form factor (Step 3), cooler height/radiator (Step 7). Picking Case first would lock out most performance GPUs and coolers.

**Computed properties (Python `@property`, not stored columns):**

| Property | Formula |
|---|---|
| `total_price` | `cpu + gpu + mb + (ram * ram_quantity) + psu + primary_storage + secondary_storage + cooler + case` |
| `system_tdp` | `cpu.tdp + gpu.tgp + mb.tdp + (ram.tdp * ram_quantity) + primary_storage.tdp + secondary_storage.tdp + cooler.tdp` |
| `recommended_psu_wattage` | `ceil(system_tdp * 1.30 / 50) * 50` — rounded up to nearest 50W |
| `total_ram_gb` | `ram.capacity_gb * ram_quantity` |

---

## 5. Cart

Guest carts are server-side (token-based). Merged into user cart atomically on login.

### `app0_cart`

*Extends `UserSessionBase` (which extends `TimestampedBase`)*

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `guest_token` | VARCHAR INDEX NULL | Plain UUID generated on first browse; cleared after merge |

Constraint: exactly one of `user_id` (from `UserSessionBase`) / `guest_token` is set at any time.

**Celery cleanup task (nightly):**

```sql
DELETE FROM app0_cart
WHERE user_id IS NULL
  AND updated_at < NOW() - INTERVAL '7 days';
```

### `app0_cartitem`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `cart_id` | FK → `app0_cart` | |
| `item_type` | VARCHAR | `'custom_build'` or `'prebuilt'` |
| `build_session_id` | FK → `app0_buildsession` NULL | Set when `item_type = 'custom_build'` |
| `prebuilt_id` | FK → `app0_prebuiltpc` NULL | Set when `item_type = 'prebuilt'` |
| `price_at_add` | INT | Snapshot; re-validated at checkout |
| `added_at` | TIMESTAMP | |

Constraint: exactly one of `build_session_id` / `prebuilt_id` is set.

> **Out-of-stock validation (API behavior, not schema):**
> The cart retrieval endpoint (`GET /api/cart/`) must loop through the `BuildSession` components for every `custom_build` item and check `component.stock == 0`. If any component is out of stock, the item is returned with an `"errors": ["GPU is out of stock"]` field and the frontend disables the checkout button for that item. No new DB column is needed — `stock` already exists on every component.

---

## 6. Pre-built PCs

### `app0_prebuiltpc`

*Extends `TimestampedBase`*

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `name` | VARCHAR | |
| `description` | TEXT | |
| `category` | VARCHAR | `'gaming'` \| `'editing'` \| `'design'` |
| `platform` | VARCHAR | `'intel'` or `'amd'` |
| `price` | INT NULL | Override price; if `null`, computed from component sum |
| `is_featured` | BOOLEAN | Default `false` — controls homepage display |
| `cpu_id` | FK → `app0_cpu` NULL | |
| `gpu_id` | FK → `app0_gpu` NULL | |
| `motherboard_id` | FK → `app0_motherboard` NULL | |
| `psu_id` | FK → `app0_psu` NULL | |
| `ram_id` | FK → `app0_ram` NULL | |
| `ram_quantity` | INT | Default `1`. Same multiplier logic as BuildSession |
| `primary_storage_id` | FK → `app0_storage` NULL | |
| `secondary_storage_id` | FK → `app0_storage` NULL | |
| `cooler_id` | FK → `app0_cooler` NULL | |
| `case_id` | FK → `app0_case` NULL | |

> **No `stock` column on PrebuiltPC.** Stock is a computed `@property`:
>
> ```python
> @property
> def stock(self) -> int:
>     stocks = []
>     components = [self.cpu, self.gpu, self.motherboard, self.psu, 
>                   self.primary_storage, self.secondary_storage, 
>                   self.cooler, self.case]
>     for c in components:
>         if c is not None:
>             stocks.append(c.stock)
>     if self.ram is not None:
>         stocks.append(self.ram.stock // self.ram_quantity)
>         
>     return min(stocks) if stocks else 0
> ```
>
> **Why:** A prebuilt uses real component inventory. If the RTX 5080 has 3 units in stock and 5 prebuilts use it, only 3 prebuilts can actually be sold — not 15. A hardcoded `stock = 10` column would silently allow overselling. The `@property` always reflects true availability.
>
> **Performance:** In list views, use `select_related` for all component FKs to avoid N+1 queries when computing stock across the catalog.

---

## 7. Orders & Payments

### `app0_useraddress`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | FK → `accounts_useraccount` | |
| `full_name` | VARCHAR | Recipient name for delivery |
| `phone` | VARCHAR | Delivery contact number |
| `address_line1` | TEXT | |
| `address_line2` | TEXT NULL | |
| `city` | VARCHAR | |
| `state` | VARCHAR | |
| `postal_code` | VARCHAR | |
| `country` | VARCHAR | Default `'India'` |
| `is_default` | BOOLEAN | Default `false` |
| `created_at` | TIMESTAMP | |

### `app0_order`

*Extends `TimestampedBase`*

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | FK → `accounts_useraccount` | Required — no guest orders |
| `build_session_id` | FK → `app0_buildsession` NULL | Set for custom build orders. Must be FK, not OneToOne, so shared builds can be ordered multiple times. |
| `prebuilt_id` | FK → `app0_prebuiltpc` NULL | Set for prebuilt orders |
| `shipping_address_snapshot` | JSONB | Required. Immutable snapshot of the address at checkout (Name, Street, City, State, ZIP, Phone) to prevent historical order mutation if user edits profile. |
| `components_total` | INT | Sum of part prices locked at order time |
| `assembly_charge` | INT | Locked at order time |
| `tax_amount` | INT | Locked at order time |
| `total_price` | INT | `components_total + assembly_charge + tax_amount` |
| `idempotency_key` | VARCHAR UNIQUE NULL | Client UUID; prevents duplicate orders on retry |
| `status` | VARCHAR | `'pending'` \| `'confirmed'` \| `'shipped'` \| `'delivered'` \| `'cancelled'` |
| `payment_status` | VARCHAR | `'pending'` \| `'paid'` \| `'failed'` \| `'refunded'` |

### `app0_orderitem`

Immutable snapshot — values never change after order is placed.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `order_id` | FK → `app0_order` | |
| `component_type` | VARCHAR | e.g. `'cpu'`, `'gpu'`, `'prebuilt'` |
| `component_id` | VARCHAR | Hardware or prebuilt PK at time of purchase |
| `component_name` | VARCHAR | Name snapshot — preserved even if part is renamed/deleted |
| `quantity` | INT | Default `1`. Set to `ram_quantity` for RAM line items |
| `price_at_purchase` | INT | Unit price locked at purchase — multiply by `quantity` for line total |

### `app0_payment`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `order_id` | FK → `app0_order` | |
| `transaction_reference` | VARCHAR UNIQUE | Gateway payment ID (e.g. Razorpay `pay_xxxxx`) |
| `payment_method` | VARCHAR | `'UPI'`, `'Card'`, `'NetBanking'` |
| `amount` | INT | Amount in **paise** (1 ₹ = 100 paise — gateway standard) |
| `gateway_response` | JSONB | Full raw webhook payload for audit |
| `created_at` | TIMESTAMP | |

---

## 8. AI & Chatbot

### `llm_chatsession`

*Extends `UserSessionBase` (which extends `TimestampedBase`)*

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `build_session_id` | FK → `app0_buildsession` NULL | Linked build context for in-builder chatbot |

### `llm_chatmessage`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `chat_session_id` | FK → `llm_chatsession` | |
| `role` | VARCHAR | `'user'` or `'assistant'` |
| `content` | TEXT | |
| `created_at` | TIMESTAMP | |

---

## 9. Build Step Order

```
Platform → CPU → GPU → Motherboard → PSU → RAM → Primary Storage → Secondary Storage → Cooler → Case
  (0)      (1)   (2)      (3)        (4)   (5)        (6)               (6b optional)    (7)     (8)
```

Step 6b (Secondary Storage) is shown as an optional step with a "Skip" button.
Case is Step 8 (last) so all physical dimension filters fire simultaneously:

- From Step 2: `gpu.length_mm` → `case.max_gpu_length_mm`
- From Step 3: `motherboard.form_factor` → `case.supported_form_factors`
- From Step 7: `cooler.height_mm` or `cooler.radiator_size_mm` → case clearance

---

## 10. Compatibility Rules Reference

All rules enforced server-side in `app0/builder/compatibility.py`.
Fields with nullable/empty defaults degrade gracefully — if a field is not populated, that check is skipped rather than blocking.

| Rule | Formula | Null behavior |
|---|---|---|
| Platform gating | `cpu.platform == session.platform` | Always enforced |
| CPU ↔ Motherboard | `cpu.socket == motherboard.socket` | Always enforced |
| Motherboard ↔ RAM | `motherboard.ram_type == ram.ram_type` | Always enforced |
| RAM quantity cap | `ram_quantity <= motherboard.ram_slots` | Always enforced |
| CPU ↔ Cooler | `cpu.socket in cooler.supported_sockets` | Skipped if `supported_sockets == []` |
| PSU sizing | `psu.wattage >= session.system_tdp * 1.30` | Skipped if any component has `tdp = 0` |
| Primary Storage ↔ Motherboard | `mb.m2_slots_count >= 1` if `storage.interface == 'M.2'`; `mb.sata_ports_count >= 1` if SATA | Skipped if `m2_slots_count == 0` (not yet set) |
| Dual M.2 | `mb.m2_slots_count >= 2` if both primary and secondary are M.2 | Skipped if slots not set |
| Stock gate | `component.stock > 0` | Always enforced on every query |
| GPU ↔ Case (length) | `gpu.length_mm <= case.max_gpu_length_mm` | Skipped if either is `null` |
| Mobo ↔ Case (form factor) | `motherboard.form_factor in case.supported_form_factors` | Skipped if list is `[]` |
| Air Cooler ↔ Case (height) | `cooler.height_mm <= case.max_cooler_height_mm` | Skipped if either is `null` |
| AIO ↔ Case (radiator) | `cooler.radiator_size_mm in case.supported_radiator_sizes` | Skipped if either is `[]` |

### Case filtering implementation

```python
# app0/builder/compatibility.py — get_compatible_cases(session)

queryset = Case.objects.filter(stock__gt=0)

if session.gpu and session.gpu.length_mm:
    queryset = queryset.filter(max_gpu_length_mm__gte=session.gpu.length_mm)

if session.motherboard and session.motherboard.form_factor:
    queryset = queryset.filter(
        supported_form_factors__contains=[session.motherboard.form_factor]
    )

if session.cooler:
    if session.cooler.cooler_type == 'air' and session.cooler.height_mm:
        queryset = queryset.filter(max_cooler_height_mm__gte=session.cooler.height_mm)
    elif session.cooler.cooler_type == 'aio' and session.cooler.radiator_size_mm:
        queryset = queryset.filter(
            supported_radiator_sizes__contains=[session.cooler.radiator_size_mm]
        )

return queryset
```

---

## 11. Migration Delta

Exact changes from current `app0/models.py`. All are non-breaking nullable/default additions.

| Table | Change | Data entry needed? |
|---|---|---|
| `ComponentBase` | Add `performance_tier INT NULL` | Yes — set 1–10 per component |
| `ComponentBase` | Remove `image ImageField` | Migrate to `app0_productimage` |
| `app0_motherboard` | Add `ram_slots INT default 2` | Yes — 2 or 4 per board |
| `app0_motherboard` | Add `m2_slots_count INT default 2` | Yes — per board spec |
| `app0_motherboard` | Add `sata_ports_count INT default 4` | Yes — per board spec |
| `app0_gpu` | Add `tgp INT default 0` | Yes — fill TGP per GPU |
| `app0_gpu` | Add `length_mm INT NULL` | Yes — per GPU |
| `app0_cooler` | Add `cooler_type VARCHAR default 'air'` | Yes |
| `app0_cooler` | Add `supported_sockets JSONB default []` | Yes |
| `app0_cooler` | Add `height_mm INT NULL` | Yes — air coolers |
| `app0_cooler` | Add `radiator_size_mm INT NULL` | Yes — AIOs |
| `app0_storage` | Add `interface VARCHAR default 'M.2'` | Yes — per drive |
| `app0_storage` | Add `capacity_gb INT default 0` | Yes |
| `app0_psu` | Add `efficiency_rating VARCHAR NULL` | Optional |
| `app0_case` | Add `supported_form_factors JSONB default []` | Yes |
| `app0_case` | Add `max_gpu_length_mm INT NULL` | Yes |
| `app0_case` | Add `max_cooler_height_mm INT NULL` | Yes |
| `app0_case` | Add `supported_radiator_sizes JSONB default []` | Yes |
| `app0_buildsession` | Replace `storage_id` → `primary_storage_id` + `secondary_storage_id` | Migrate existing FK |
| `app0_buildsession` | Add `ram_quantity INT default 1` | ✅ Auto-set |
| `app0_buildsession` | Add `'ordered'` to `status` choices | ✅ No migration |
| `app0_prebuiltpc` | Add `stock INT default 10` | ✅ Auto-set |
| `app0_prebuiltpc` | Add `is_featured BOOLEAN default false` | ✅ Auto-set |
| `app0_prebuiltpc` | Replace `storage_id` → `primary_storage_id` + `secondary_storage_id` | Manual |
| `app0_prebuiltpc` | Add `ram_quantity INT default 1` | Manual |
| `app0_order` | Add `components_total`, `assembly_charge`, `tax_amount` | Compute from existing |
| `app0_order` | Add `idempotency_key VARCHAR UNIQUE NULL` | ✅ Auto-set on new orders |
| `app0_orderitem` | Add `component_name VARCHAR` | Fill from component FK |
| `app0_orderitem` | Add `quantity INT default 1` | ✅ Auto-set |
| `app0_productimage` | **New table** | Migrate existing component images |
| `app0_cart` | **New table** | None |
| `app0_cartitem` | **New table** | None |
| `llm_chatsession` | **New table** | None |
| `llm_chatmessage` | **New table** | None |
| `recommender_*` | **Delete entire app** | None — dead code |

---

## 12. Entity Relationship Summary

```
accounts_useraccount 1───* app0_useraddress
accounts_useraccount 1───* app0_buildsession  (via UserSessionBase, nullable)
accounts_useraccount 1───1 app0_cart          (via UserSessionBase, nullable; guests via guest_token)
accounts_useraccount 1───* app0_order
accounts_useraccount 1───* llm_chatsession    (via UserSessionBase, nullable)

app0_buildsession ──FK──> app0_cpu, app0_gpu, app0_motherboard,
                           app0_ram, app0_psu,
                           app0_storage (x2: primary + secondary),
                           app0_cooler, app0_case

app0_cart 1───* app0_cartitem
app0_cartitem ──FK──> app0_buildsession  (nullable)
app0_cartitem ──FK──> app0_prebuiltpc    (nullable)

app0_order ──FK──> app0_buildsession  (nullable)
app0_order ──FK──> app0_prebuiltpc    (nullable)
app0_order ──FK──> app0_useraddress
app0_order 1───* app0_orderitem
app0_order 1───* app0_payment

app0_prebuiltpc ──FK──> app0_cpu, app0_gpu, app0_motherboard,
                         app0_ram, app0_psu,
                         app0_storage (x2: primary + secondary),
                         app0_cooler, app0_case

app0_productimage ──(component_type + component_id)──> any ComponentBase subclass
                                                        or app0_prebuiltpc

llm_chatsession 1───* llm_chatmessage
llm_chatsession ──FK──> app0_buildsession (nullable)
```
