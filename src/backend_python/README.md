# Canonical Backend — FastAPI (Python)

All four slices now live in this single FastAPI app on `:8000`. The earlier
Node prototype at `src/backend/` was deleted in commit `819ce7b` (Member C's
tickets migration); the dev-time polyglot split (`:8000` + `:3001`) is
historical and any reference to it elsewhere in the docs describes the
original architecture, not the shipped one.

## Slices mounted under `/api/v1`

| Owner | Slice | Routes |
|---|---|---|
| Member A | Cart, Catalog | `/cart/*`, `/catalog/*`, `/products` |
| Member B | Payment | `/payment/process`, `/payment/methods/*` |
| Member C | Tickets | `/tickets`, `/tickets/triage`, `/tickets/{id}/status` |
| Member D | Auth, Orders, Inventory | `/auth/*`, `/orders/*`, `/inventory/*` |
| shared | Events | `/events/payment.success` and other cross-slice webhooks |

## Quick start (SQLite — no Docker)

```bash
cd src/backend_python

python -m venv .venv
.venv\Scripts\activate                # Windows
# source .venv/bin/activate           # macOS/Linux
pip install -r requirements.txt

copy .env.example .env                # Windows
# cp .env.example .env                # macOS/Linux
# Edit .env — set JWT_SECRET to 32+ random chars

python -m scripts.seed                # demo data
uvicorn app.main:app --reload --port 8000
```

Open **http://localhost:8000/docs** for Swagger UI.

## Quick start (PostgreSQL via Docker)

```bash
docker compose up -d                  # postgres on :5432
# In .env:  DATABASE_URL=postgresql+psycopg2://cos:cos@localhost:5432/cos
python -m scripts.seed
uvicorn app.main:app --reload --port 8000
```

## Demo credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `admin123` |
| Customer | `alice@example.com` | `Sup3rPass!` |

## Tests

```bash
pytest                                # full suite
pytest tests/test_auth.py -v
pytest tests/test_orders.py -v
pytest -k transition                  # just the matrix tests
```

Every test gets a fresh in-memory SQLite DB — no fixtures to clean up, no flakiness.

## API surface

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | public | Create customer account |
| `POST` | `/api/v1/auth/login` | public | Return Bearer JWT |
| `GET`  | `/api/v1/orders` | admin | Paginated list (supports `?status=`) |
| `GET`  | `/api/v1/orders/{id}` | admin | Full order detail |
| `PATCH`| `/api/v1/orders/{id}/status` | admin | Manual status transition |
| `GET`  | `/api/v1/inventory` | admin | Products with `low_stock` flag |
| `PATCH`| `/api/v1/inventory/{id}` | admin | Update stock quantity |
| `POST` | `/api/v1/events/payment.success` | webhook | Receive Member B's events |
| `GET`  | `/health` | public | Service heartbeat |

## Project layout

```
src/backend_python/
├── app/
│   ├── main.py                 # FastAPI app, lifespan, CORS
│   ├── settings.py             # Pydantic settings (.env)
│   ├── db.py                   # SQLAlchemy engine + session + Base
│   ├── models.py               # All ORM models in one file
│   ├── schemas.py              # All Pydantic schemas in one file
│   ├── security.py             # bcrypt + JWT
│   ├── dependencies.py         # get_current_user, require_admin, etc.
│   ├── exceptions.py           # DomainError + global handlers
│   ├── scheduler.py            # APScheduler for sweep
│   ├── routers/
│   │   ├── auth.py             # POST /auth/register, /auth/login
│   │   ├── orders.py           # GET/PATCH /orders ...
│   │   ├── inventory.py        # GET/PATCH /inventory ...
│   │   └── events.py           # POST /events/payment.success
│   └── services/
│       ├── auth_service.py     # register, login, lockout
│       ├── orders_service.py   # transition matrix + paginated find
│       ├── inventory_service.py
│       └── sweep_service.py    # cron + payment.success handler
├── scripts/
│   └── seed.py                 # demo data (idempotent)
├── tests/
│   ├── conftest.py             # fresh in-memory DB per test
│   ├── test_auth.py
│   └── test_orders.py          # orders + inventory + sweep
├── requirements.txt
├── docker-compose.yml
├── pytest.ini
├── .env.example
└── README.md
```

## Phase 1 / 2 / 3 traceability

Every line of this code traces to a doc:

| Code element | Spec source |
|---|---|
| `/auth/register`, `/auth/login` | `docs/requirements/member_d_auth_phase2_design.md` §1 Stories AU-1, AU-2 |
| JWT `{sub, role, exp, iat}` HS256 24h | Auth Phase 2 §4.1 Surface 3 (locks Member C's pending question) |
| Lockout 5×/15min | Auth Phase 2 NFR-AU6 |
| Generic "Invalid credentials" | Auth Phase 2 NFR-AU7 (byte-identical wrong email vs wrong password) |
| Transition matrix in `orders_service._LEGAL` | Orders Phase 2 §3.2.2 |
| Stock bounds 0..100,000 | Orders Phase 2 §3.4.2 + HR-4 |
| `low_stock = stock < 5` | Orders Phase 2 Story D-4 |
| Sweep + paid-stale-confirms-not-cancels | Orders Phase 1 HR-8 + Phase 2 SSD-D6 |
| `payment.success` event contract | Orders Phase 2 §5.4 |
| Audit log `actor = "system"` on cron transitions | Orders Phase 1 NFR-D3 |
| Idempotency on `idempotency_key` | Orders Phase 1 NFR-D5 |

## Cross-slice integration status

| Slice | Their port | Our integration | Status |
|---|---|---|---|
| Member A — Checkout | `:3001` | Frontend hits both ports; we don't talk to A directly | Loose coupling |
| Member B — Payment | `:3001` | They POST `/api/v1/events/payment.success` to us | Webhook contract live |
| Member C — Tickets+Auth | TBD | We issue our own JWTs. If C ships their own auth slice later, sharing `JWT_SECRET` makes both interoperable. | JWT contract locks compat |
| Catalog | — | Mirrored in our `products` table (RFC-D001 sandbox) | Temporary mirror |

## Spec adjustments from the v1 attempt

- **Flat module layout** — `routers/`, `services/`, `schemas.py` instead of per-feature subpackages.
- **Global exception handlers** — services raise `DomainError`; routes don't try/except.
- **`response_model_exclude_none`** — cleaner JSON.
- **Parametrized tests** — `@pytest.mark.parametrize` for the transition matrix.
- **`StaticPool`** in the test engine — fixes SQLite + FastAPI threadpool isolation.
- **`admin_headers` fixture** — one-liner setup for any admin-only test.

## Next turn

React pages on top of this backend:
- `src/frontend/src/features/auth/` — Login + Register
- `src/frontend/src/features/orders/` — Order list, detail, status update
- `src/frontend/src/features/inventory/` — Inventory + stock update
- Shared `axios` client pointing at `http://localhost:8000/api/v1`
