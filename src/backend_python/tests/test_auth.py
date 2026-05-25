"""Auth tests — covers Phase 2 §1 Gherkin scenarios AU-1 through AU-5."""


def test_register_happy_path(client):
    r = client.post("/api/v1/auth/register", json={
        "email": "alice@example.com", "password": "S3curePass!",
    })
    assert r.status_code == 201
    body = r.json()
    assert body["email"] == "alice@example.com"
    assert body["role"] == "customer"
    # NFR-AU11 — password fields never in response
    assert "password" not in body and "password_hash" not in body


def test_register_rejects_bad_email(client):
    r = client.post("/api/v1/auth/register", json={
        "email": "not-an-email", "password": "S3curePass!",
    })
    assert r.status_code == 422


def test_register_rejects_short_password(client):
    r = client.post("/api/v1/auth/register", json={
        "email": "alice@example.com", "password": "abc",
    })
    assert r.status_code == 422


def test_register_rejects_duplicate(client):
    payload = {"email": "alice@example.com", "password": "S3curePass!"}
    assert client.post("/api/v1/auth/register", json=payload).status_code == 201
    assert client.post("/api/v1/auth/register", json=payload).status_code == 409


def test_login_happy_returns_jwt(client):
    client.post("/api/v1/auth/register", json={
        "email": "alice@example.com", "password": "S3curePass!",
    })
    r = client.post("/api/v1/auth/login", json={
        "email": "alice@example.com", "password": "S3curePass!",
    })
    assert r.status_code == 200
    body = r.json()
    assert body["token"]
    assert body["user"] == {"id": body["user"]["id"], "email": "alice@example.com", "role": "customer"}


def test_login_wrong_email_byte_identical_to_wrong_password(client):
    """NFR-AU7 — user-enumeration defense. Both errors must be byte-identical."""
    client.post("/api/v1/auth/register", json={
        "email": "alice@example.com", "password": "S3curePass!",
    })
    r1 = client.post("/api/v1/auth/login", json={
        "email": "alice@example.com", "password": "wrong",
    })
    r2 = client.post("/api/v1/auth/login", json={
        "email": "ghost@example.com", "password": "anything-1234",
    })
    assert r1.status_code == 401 == r2.status_code
    assert r1.json() == r2.json()


def test_login_lockout_after_5_failures(client):
    client.post("/api/v1/auth/register", json={
        "email": "alice@example.com", "password": "S3curePass!",
    })
    for _ in range(5):
        client.post("/api/v1/auth/login", json={
            "email": "alice@example.com", "password": "wrong",
        })
    # 6th attempt — even correct password fails with 423
    r = client.post("/api/v1/auth/login", json={
        "email": "alice@example.com", "password": "S3curePass!",
    })
    assert r.status_code == 423


def test_admin_route_requires_auth(client):
    r = client.get("/api/v1/orders")
    assert r.status_code == 401


def test_admin_route_rejects_customer(client):
    client.post("/api/v1/auth/register", json={
        "email": "alice@example.com", "password": "S3curePass!",
    })
    login = client.post("/api/v1/auth/login", json={
        "email": "alice@example.com", "password": "S3curePass!",
    }).json()
    r = client.get("/api/v1/inventory", headers={"Authorization": f"Bearer {login['token']}"})
    assert r.status_code == 403


def test_admin_route_rejects_invalid_token(client):
    r = client.get("/api/v1/orders", headers={"Authorization": "Bearer not-a-real-jwt"})
    assert r.status_code == 401


def test_admin_route_rejects_malformed_header(client):
    r = client.get("/api/v1/orders", headers={"Authorization": "Token abc"})
    assert r.status_code == 401
