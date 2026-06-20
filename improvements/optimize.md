This file contains all the optimization needed in the app after the app is finished developing.

---

## Optimization: Redis-Based Session Management

Moving session state from PostgreSQL to Redis prevents database bloat from abandoned carts and reduces transaction overhead, resulting in sub-millisecond latency for the builder UI.

### 1. Guest Sessions (Pure Redis)

Window shoppers generate high volumes of ephemeral data. Writing this to a relational database requires heavy background cleanup tasks.

* **Strategy:** Store guest build and cart state entirely in Redis.
* **Key/Value:** Use the `guest_token` (UUID) as the key. Store the state as a JSON string.
* **Auto-Cleanup:** Apply a strict 7-day Time-To-Live (TTL). Redis will handle data destruction automatically.
* *Example command:* `SETEX guest:session:<uuid> 604800 "{...}"`


* **Benefit:** Eliminates PostgreSQL writes for unauthenticated users and removes the need for a nightly Celery janitor task.

### 2. Authenticated User Sessions (Write-Behind Pattern)

Registered users require data durability, but synchronous DB writes on every component swap cause UI lag.

* **Strategy:** Active editing reads/writes exclusively to Redis. Sync to PostgreSQL only at specific checkpoints.
* **Sync Triggers:**
1. User explicitly clicks a "Save Build" button.
2. User proceeds to the Checkout step.
3. A debounced background API call triggers after 30 seconds of user inactivity.



### 3. Django Implementation Specification

Use `django-redis` to manage explicit keys rather than the default session middleware to maintain absolute control over the nested JSON data structures.

```python
from django.core.cache import cache

# Set state with a 7-day timeout (604800 seconds)
cache.set(f'guest_build_{guest_token}', build_json_data, timeout=604800)

# Retrieve state
current_build = cache.get(f'guest_build_{guest_token}')

```

### 4. Infrastructure Requirement (Mitigating Volatility)

Because Redis operates in-memory, a container crash will instantly wipe all active guest sessions.

* **Action:** Ensure Redis is configured with basic **RDB (Snapshotting)** or **AOF (Append Only File)** in `docker-compose.yml` to allow recent state recovery upon container restart.