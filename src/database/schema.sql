-- src/database/schema.sql
CREATE TABLE IF NOT EXISTS carts (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS cart_items (id TEXT PRIMARY KEY, cart_id TEXT REFERENCES carts(id), product_id TEXT NOT NULL, product_name TEXT NOT NULL, quantity INTEGER DEFAULT 1, unit_price REAL NOT NULL, total_price REAL NOT NULL, FOREIGN KEY(cart_id) REFERENCES carts(id));
