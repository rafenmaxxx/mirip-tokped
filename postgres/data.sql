-- 1. ENUM TYPE
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('BUYER', 'SELLER', 'ADMIN');
SET TIMEZONE = 'Asia/Jakarta';
DROP TYPE IF EXISTS order_status CASCADE;
CREATE TYPE order_status AS ENUM ('waiting_approval', 'approved', 'rejected', 'on_delivery', 'received');
DROP TYPE IF EXISTS auction_status CASCADE;
CREATE TYPE auction_status AS ENUM ('scheduled', 'active', 'ended', 'cancelled');
DROP TYPE IF EXISTS message_type CASCADE;
CREATE TYPE message_type AS ENUM ('text', 'image', 'item_preview');
DROP TYPE IF EXISTS feature_name CASCADE;
CREATE type feature_name AS ENUM ('checkout_enabled', 'chat_enabled', 'auction_enabled');

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

-- 10. TABEL AUCTIONS
DROP TABLE IF EXISTS auctions CASCADE;
CREATE TABLE auctions (
    auction_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    starting_price INT NOT NULL CHECK (starting_price >= 0),
    current_price INT NOT NULL CHECK (current_price >= 0),
    min_increment INT NOT NULL CHECK (min_increment > 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status_auction auction_status NOT NULL DEFAULT 'scheduled',
    winner_id INT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_auction_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    CONSTRAINT fk_auction_winner FOREIGN KEY (winner_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 11. TABEL AUCTION_BIDS
DROP TABLE IF EXISTS auction_bids CASCADE;
CREATE TABLE auction_bids (
    bid_id SERIAL PRIMARY KEY,
    auction_id INT NOT NULL,
    bidder_id INT NOT NULL,
    bid_amount INT NOT NULL CHECK (bid_amount > 0),
    bid_time TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_bid_auction FOREIGN KEY (auction_id) REFERENCES auctions(auction_id) ON DELETE CASCADE,
    CONSTRAINT fk_bid_bidder FOREIGN KEY (bidder_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 12. TABEL CHAT_ROOM
DROP TABLE IF EXISTS chat_room CASCADE;
CREATE TABLE chat_room (
    store_id INT NOT NULL,
    buyer_id INT NOT NULL,
    last_message_at TIMESTAMP DEFAULT NULL,      
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_chat_buyer FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_store FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE,
    UNIQUE (buyer_id, store_id)
);

-- 13. TABEL CHAT_MESSAGES
DROP TABLE IF EXISTS chat_messages CASCADE;
CREATE TABLE chat_messages (
    message_id SERIAL PRIMARY KEY,
    store_id INT NOT NULL,
    buyer_id INT NOT NULL,
    sender_id INT NOT NULL,
    message_type message_type NOT NULL,
    content TEXT NOT NULL,
    product_id INT DEFAULT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_message_buyer FOREIGN KEY (buyer_id) REFERENCES chat_room(buyer_id) ON DELETE CASCADE,
    CONSTRAINT fk_message_store FOREIGN KEY (store_id) REFERENCES chat_room(store_id) ON DELETE CASCADE
);

-- 14. TABEL PUSH_SUBSCRIPTIONS
DROP TABLE IF EXISTS push_subscriptions CASCADE;
CREATE TABLE push_subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    endpoints TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_subscription_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 15. TABEL PUSH_PREFERENCES
DROP TABLE IF EXISTS push_preferences CASCADE;
CREATE TABLE push_preferences (
    user_id INT PRIMARY KEY,
    chat_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    auction_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    order_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_preference_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 16. TABEL USER_FEATURE_ACCESS
DROP TABLE IF EXISTS user_feature_access CASCADE;
CREATE TABLE user_feature_access (
    access_id SERIAL PRIMARY KEY,
    user_id INT,
    feature_name feature_name NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    reason TEXT DEFAULT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_feature_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
-- SEEDER DATA TOKOPEDIA 

-- USERS
INSERT INTO users (email, password, role, name, address, balance) VALUES
    ('seller1@mail.com', 'pw1', 'SELLER', 'Seller 1', 'Jl. Mawar No.1', 1000000),
    ('seller2@mail.com', 'pw2', 'SELLER', 'Seller 2', 'Jl. Melati No.2', 800000),
    ('seller3@mail.com', 'pw3', 'SELLER', 'Seller 3', 'Jl. Anggrek No.3', 900000),
    ('seller4@mail.com', 'pw4', 'SELLER', 'Seller 4', 'Jl. Kenanga No.4', 750000),
    ('seller5@mail.com', 'pw5', 'SELLER', 'Seller 5', 'Jl. Dahlia No.5', 500000),

    ('buyer1@mail.com', 'pw6', 'BUYER', 'Buyer 1', 'Jl. Cempaka No.6', 400000),
    ('buyer2@mail.com', 'pw7', 'BUYER', 'Buyer 2', 'Jl. Flamboyan No.7', 600000),
    ('buyer3@mail.com', 'pw8', 'BUYER', 'Buyer 3', 'Jl. Teratai No.8', 300000),
    ('buyer4@mail.com', 'pw9', 'BUYER', 'Buyer 4', 'Jl. Sakura No.9', 250000),
    ('buyer5@mail.com', 'pw10', 'BUYER', 'Buyer 5', 'Jl. Melur No.10', 1000000),
    ('admin@mail.com', 'adminpw', 'ADMIN', 'Admin', 'Jl. Admin No.1', 0);

-- STORES
INSERT INTO stores (user_id, store_name, store_description, store_logo_path, balance) VALUES
    (1, 'Toko Gadget', 'Menjual produk gadget', '/data/store/store1.png', 100000),
    (2, 'Toko Fashion', 'Menjual produk fashion', '/data/store/store2.png', 200000),
    (3, 'Toko Buku', 'Menjual buku dan alat tulis', '/data/store/store3.png', 150000),
    (4, 'Toko Olahraga', 'Peralatan olahraga lengkap', '/data/store/store4.png', 120000),
    (5, 'Toko Rumah Tangga', 'Perlengkapan rumah tangga', '/data/store/store5.png', 80000);

-- CATEGORIES
INSERT INTO categories (name) VALUES
    ('Elektronik'),
    ('Fashion'),
    ('Buku & Alat Tulis'),
    ('Olahraga'),
    ('Rumah Tangga');

-- PRODUCTS
INSERT INTO products (store_id, product_name, description, price, stock, main_image_path) VALUES
    (1, 'Smartphone X1', 'Gadget terbaru', 3000000, 15, '/data/products/smartphone_x1.png'),
    (1, 'Headphone Pro', 'Headphone wireless', 500000, 30, '/data/products/headphone.png'),
    (1, 'Smartphone X2', 'Gadget terbaru', 3000000, 15, '/data/products/smartphone_x1.png'),
    (1, 'Headphone Pro1', 'Headphone wireless', 500000, 30, '/data/products/headphone.png'),
    (1, 'Smartphone X3', 'Gadget terbaru', 3000000, 15, '/data/products/smartphone_x1.png'),
    (1, 'Headphone Pro2', 'Headphone wireless', 500000, 30, '/data/products/headphone.png'),

    (2, 'Kaos Trendy', 'Kaos modis untuk anak muda', 75000, 100, '/data/products/kaos.png'),
    (2, 'Celana Jeans', 'Jeans slim fit', 150000, 80, '/data/products/jeans.png'),

    (3, 'Novel Fantasi', 'Buku fiksi populer', 60000, 50, '/data/products/novel.png'),
    (3, 'Buku Tulis Premium', 'Buku catatan berkualitas', 25000, 200, '/data/products/book.png'),

    (4, 'Sepatu Lari', 'Sepatu sport ringan', 400000, 40, '/data/products/shoes.png'),
    (4, 'Matras Yoga', 'Matras anti slip', 200000, 25, '/data/products/yoga_mat.png'),

    (5, 'Panci Anti Lengket', 'Panci dapur premium', 180000, 30, '/data/products/panci.png'),
    (5, 'Vacuum Cleaner Mini', 'Penyedot debu portabel', 500000, 10, '/data/products/vacuum.png');

-- CATEGORY_ITEMS
INSERT INTO category_items (category_id, product_id) VALUES
    (1, 1), (1, 2),
    (2, 3), (2, 4),
    (3, 5), (3, 6),
    (4, 7), (4, 8),
    (5, 9), (5, 10);

-- CART_ITEMS
INSERT INTO cart_items (buyer_id, product_id, quantity) VALUES
    (6, 1, 1), (6, 3, 2),
    (7, 4, 1), (7, 5, 1),
    (8, 2, 1), (8, 6, 5),
    (9, 7, 1), (9, 9, 1),
    (10, 8, 2), (10, 10, 1);

-- ORDERS
INSERT INTO orders (buyer_id, store_id, total_price, shipping_address, status) VALUES
    (6, 1, 3000000, 'Jl. Cempaka No.6', 'approved'),
    (6, 2, 150000, 'Jl. Cempaka No.6', 'waiting_approval'),
    (7, 2, 75000, 'Jl. Flamboyan No.7', 'approved'),
    (7, 3, 60000, 'Jl. Flamboyan No.7', 'on_delivery'),
    (8, 1, 500000, 'Jl. Teratai No.8', 'rejected'),
    (8, 3, 125000, 'Jl. Teratai No.8', 'approved'),
    (9, 4, 400000, 'Jl. Sakura No.9', 'received'),
    (9, 5, 180000, 'Jl. Sakura No.9', 'approved'),
    (10, 4, 400000, 'Jl. Melur No.10', 'on_delivery'),
    (10, 5, 500000, 'Jl. Melur No.10', 'waiting_approval');

-- 8. ORDER_ITEMS
INSERT INTO order_items (order_id, product_id, quantity, price_at_order, subtotal) VALUES
    (1, 1, 1, 3000000, 3000000),
    (2, 4, 1, 150000, 150000),
    (3, 3, 1, 75000, 75000),
    (4, 5, 1, 60000, 60000),
    (5, 2, 1, 500000, 500000),
    (6, 6, 5, 25000, 125000),
    (7, 7, 1, 400000, 400000),
    (8, 9, 1, 180000, 180000),
    (9, 7, 1, 400000, 400000),
    (10, 10, 1, 500000, 500000);

-- 9. AUCTIONS
INSERT INTO auctions (product_id, starting_price, current_price, min_increment, quantity, start_time, end_time, status_auction, winner_id) VALUES
(1, 100000, 150000, 5000, 1, NOW() - INTERVAL '2 days', NOW() + INTERVAL '3 days', 'active', NULL),
(2, 200000, 200000, 10000, 2, NOW() + INTERVAL '1 day', NOW() + INTERVAL '5 days', 'scheduled', NULL),
(3, 50000, 80000, 2000, 1, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day', 'ended', 8),
(4, 150000, 180000, 5000, 1, NOW() - INTERVAL '1 day', NOW() + INTERVAL '2 days', 'active', NULL),
(5, 300000, 300000, 15000, 1, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 hour', 'cancelled', NULL);

-- 10. AUCTION_BIDS
INSERT INTO auction_bids (auction_id, bidder_id, bid_amount, bid_time) VALUES
-- Bids untuk auction 1 (active)
(1, 6, 105000, NOW() - INTERVAL '1 day 23 hours'),
(1, 7, 110000, NOW() - INTERVAL '1 day 20 hours'),
(1, 6, 120000, NOW() - INTERVAL '1 day 15 hours'),
(1, 9, 130000, NOW() - INTERVAL '1 day 10 hours'),
(1, 8, 150000, NOW() - INTERVAL '1 day 5 hours'),

-- Bids untuk auction 3 (ended, winner_id = 8)
(3, 6, 55000, NOW() - INTERVAL '4 days'),
(3, 7, 60000, NOW() - INTERVAL '3 days 20 hours'),
(3, 8, 70000, NOW() - INTERVAL '3 days 15 hours'),
(3, 6, 75000, NOW() - INTERVAL '3 days 10 hours'),
(3, 8, 80000, NOW() - INTERVAL '3 days 5 hours'),

-- Bids untuk auction 4 (active)
(4, 10, 155000, NOW() - INTERVAL '20 hours'),
(4, 7, 165000, NOW() - INTERVAL '15 hours'),
(4, 10, 180000, NOW() - INTERVAL '10 hours');

-- 11. CHAT_ROOM
INSERT INTO chat_room (store_id, buyer_id, last_message_at, created_at, updated_at) VALUES
(1, 6, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 hour'),
(1, 7, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '8 days', NOW() - INTERVAL '5 hours'),
(2, 8, NOW() - INTERVAL '2 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 days'),
(2, 9, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '5 days', NOW() - INTERVAL '30 minutes'),
(3, 10, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '7 days', NOW() - INTERVAL '3 hours');

-- 12. CHAT_MESSAGES
INSERT INTO chat_messages (store_id, buyer_id, sender_id, message_type, content, product_id, is_read, created_at) VALUES
-- Chat antara store 1 dan buyer 6
(1, 6, 6, 'text', 'Halo, produk ini masih ready?', NULL, TRUE, NOW() - INTERVAL '10 days'),
(1, 6, 1, 'text', 'Halo! Ya masih ready kak', NULL, TRUE, NOW() - INTERVAL '10 days' + INTERVAL '5 minutes'),
(1, 6, 6, 'item_preview', 'Bagaimana dengan produk ini?', 3, TRUE, NOW() - INTERVAL '9 days'),
(1, 6, 1, 'text', 'Produk itu juga tersedia, harga 250rb', NULL, TRUE, NOW() - INTERVAL '9 days' + INTERVAL '10 minutes'),
(1, 6, 6, 'text', 'Oke sip, nanti saya order ya', NULL, FALSE, NOW() - INTERVAL '1 hour'),

-- Chat antara store 1 dan buyer 7
(1, 7, 7, 'text', 'Min, bisa nego ga harganya?', NULL, TRUE, NOW() - INTERVAL '8 days'),
(1, 7, 1, 'text', 'Maaf kak harga sudah nett', NULL, TRUE, NOW() - INTERVAL '8 days' + INTERVAL '3 minutes'),
(1, 7, 7, 'image', '/uploads/chat/img_buyer7_001.jpg', NULL, FALSE, NOW() - INTERVAL '5 hours'),

-- Chat antara store 2 dan buyer 8
(2, 8, 8, 'text', 'Ada varian warna lain?', NULL, TRUE, NOW() - INTERVAL '15 days'),
(2, 8, 8, 'text', 'Halo min?', NULL, FALSE, NOW() - INTERVAL '2 days'),

-- Chat antara store 2 dan buyer 9
(2, 9, 9, 'text', 'Pengiriman ke luar kota bisa?', NULL, TRUE, NOW() - INTERVAL '5 days'),
(2, 9, 2, 'text', 'Bisa kak, kemana tujuannya?', NULL, TRUE, NOW() - INTERVAL '5 days' + INTERVAL '2 minutes'),
(2, 9, 9, 'text', 'Ke Surabaya min', NULL, TRUE, NOW() - INTERVAL '4 days'),
(2, 9, 2, 'text', 'Oke bisa, ongkir sekitar 25rb', NULL, FALSE, NOW() - INTERVAL '30 minutes'),

-- Chat antara store 3 dan buyer 10
(3, 10, 10, 'item_preview', 'Produk ini masih ada ga?', 2, TRUE, NOW() - INTERVAL '7 days'),
(3, 10, 3, 'text', 'Masih ada kak, stok tinggal 2 pcs', NULL, TRUE, NOW() - INTERVAL '7 days' + INTERVAL '1 minute'),
(3, 10, 10, 'text', 'Mantap, saya ambil 1 ya', NULL, FALSE, NOW() - INTERVAL '3 hours');

-- 13. PUSH_SUBSCRIPTIONS
INSERT INTO push_subscriptions (user_id, endpoints, p256dh_key, auth_key, created_at) VALUES
(6, 'https://fcm.googleapis.com/fcm/send/abc123def456', 'BNxWkj8M9RzN...p256dh_key_user6', 'auth_secret_key_user6', NOW() - INTERVAL '30 days'),
(7, 'https://fcm.googleapis.com/fcm/send/ghi789jkl012', 'BKpLmn1Q2StU...p256dh_key_user7', 'auth_secret_key_user7', NOW() - INTERVAL '20 days'),
(8, 'https://fcm.googleapis.com/fcm/send/mno345pqr678', 'BMvWxy3V4ZaB...p256dh_key_user8', 'auth_secret_key_user8', NOW() - INTERVAL '15 days'),
(9, 'https://fcm.googleapis.com/fcm/send/stu901vwx234', 'BQcDef5G6HiJ...p256dh_key_user9', 'auth_secret_key_user9', NOW() - INTERVAL '10 days'),
(10, 'https://fcm.googleapis.com/fcm/send/yza567bcd890', 'BReFgh7I8JkL...p256dh_key_user10', 'auth_secret_key_user10', NOW() - INTERVAL '5 days');

-- 14. PUSH_PREFERENCES
INSERT INTO push_preferences (user_id, chat_enabled, auction_enabled, order_enabled, updated_at) VALUES
(6, TRUE, TRUE, TRUE, NOW() - INTERVAL '30 days'),
(7, TRUE, FALSE, TRUE, NOW() - INTERVAL '20 days'), -- User 7 disable auction notifications
(8, FALSE, TRUE, TRUE, NOW() - INTERVAL '15 days'), -- User 8 disable chat notifications
(9, TRUE, TRUE, FALSE, NOW() - INTERVAL '10 days'), -- User 9 disable order notifications
(10, TRUE, TRUE, TRUE, NOW() - INTERVAL '5 days');

-- 15. USER_FEATURE_ACCESS
INSERT INTO user_feature_access (user_id, feature_name, is_enabled, reason, updated_at) VALUES
-- Global settings
(NULL, 'checkout_enabled', TRUE, NULL, NOW()),
(NULL, 'chat_enabled', TRUE, NULL, NOW()),
(NULL, 'auction_enabled', TRUE, NULL, NOW()),

-- Specific user restrictions (buyers)
(8, 'chat_enabled', FALSE, 'Spam reported by multiple users', NOW() - INTERVAL '5 days'),
(9, 'auction_enabled', FALSE, 'Failed payment on previous auction win', NOW() - INTERVAL '3 days');
