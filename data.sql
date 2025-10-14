DROP DATABASE IF EXISTS tokopedia;
CREATE DATABASE tokopedia;


\c tokopedia;


-- 1. ENUM TYPE
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('BUYER', 'SELLER');

DROP TYPE IF EXISTS order_status CASCADE;
CREATE TYPE order_status AS ENUM ('waiting_approval', 'approved', 'rejected', 'on_delivery', 'received');


-- 2. TABEL USERS
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    balance INT DEFAULT 0 CHECK (balance >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- 3. TABEL STORES
-- user_id harus SELLER, 1 user hanya boleh punya 1 store
DROP TABLE IF EXISTS stores CASCADE;
CREATE TABLE stores (
    store_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    store_name VARCHAR(255) NOT NULL UNIQUE,
    store_description TEXT,
    store_logo_path TEXT,
    balance INT NOT NULL DEFAULT 0 CHECK (balance >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_store_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- function untuk ngecek user_id di stores itu role-nya SELLER
CREATE OR REPLACE FUNCTION check_user_is_seller()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM users u
        WHERE u.user_id = NEW.user_id AND u.role = 'SELLER'
    ) THEN
        RAISE EXCEPTION 'user_id % harus memiliki role SELLER', NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_user_is_seller
BEFORE INSERT OR UPDATE ON stores
FOR EACH ROW
EXECUTE FUNCTION check_user_is_seller();


-- 4. TABEL PRODUCTS
DROP TABLE IF EXISTS products CASCADE;
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    store_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    price INT NOT NULL CHECK (price >= 0),
    stock INT NOT NULL CHECK (stock >= 0),
    main_image_path TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP DEFAULT NULL,
    CONSTRAINT fk_product_store FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE
);


-- 5. TABEL CART_ITEMS
-- hanya buyer yang boleh punya cart
DROP TABLE IF EXISTS cart_items CASCADE;
CREATE TABLE cart_items (
    cart_item_id SERIAL PRIMARY KEY,
    buyer_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_cart_buyer FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    UNIQUE (buyer_id, product_id)
);

-- function untuk ngecek buyer_id di cart_items itu role-nya BUYER
CREATE OR REPLACE FUNCTION check_buyer_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM users u
        WHERE u.user_id = NEW.buyer_id AND u.role = 'BUYER'
    ) THEN
        RAISE EXCEPTION 'buyer_id % harus memiliki role BUYER', NEW.buyer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_buyer_role_cart
BEFORE INSERT OR UPDATE ON cart_items
FOR EACH ROW
EXECUTE FUNCTION check_buyer_role();


-- 6. TABEL CATEGORY
-- Data ini perlu di-seed manual, tidak ada CRUD dari aplikasi
DROP TABLE IF EXISTS categories CASCADE;
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);


-- 7. TABEL CATEGORY_ITEM
DROP TABLE IF EXISTS category_items CASCADE;
CREATE TABLE category_items (
    category_id INT NOT NULL,
    product_id INT NOT NULL,
    PRIMARY KEY (category_id, product_id),
    CONSTRAINT fk_catitem_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE,
    CONSTRAINT fk_catitem_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);


-- 8. TABEL ORDERS
-- buyer_id harus BUYER, store_id adalah SELLER
DROP TABLE IF EXISTS orders CASCADE;
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    buyer_id INT NOT NULL,
    store_id INT NOT NULL,
    total_price INT NOT NULL CHECK (total_price >= 0),
    shipping_address TEXT NOT NULL,
    status order_status NOT NULL DEFAULT 'waiting_approval',
    reject_reason TEXT DEFAULT NULL,
    confirmed_at TIMESTAMP DEFAULT NULL,
    delivery_time TIMESTAMP DEFAULT NULL,
    received_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_order_buyer FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_order_store FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE
);

CREATE TRIGGER trg_check_buyer_role_orders
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION check_buyer_role();

CREATE OR REPLACE FUNCTION check_confirmation_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.received_at IS NOT NULL AND OLD.received_at IS NULL THEN
        IF CURRENT_TIMESTAMP < OLD.delivery_time THEN
            RAISE EXCEPTION 'Konfirmasi hanya bisa dilakukan setelah delivery_time (%).', OLD.delivery_time;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_confirmation_time
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION check_confirmation_time();


-- 9. TABEL ORDER_ITEMS
DROP TABLE IF EXISTS order_items CASCADE;
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_order INT NOT NULL CHECK (price_at_order >= 0),
    subtotal INT NOT NULL CHECK (subtotal >= 0),
    CONSTRAINT fk_orderitem_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_orderitem_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);
