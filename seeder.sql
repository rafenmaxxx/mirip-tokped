-- SEEDER DATA TOKOPEDIA 

-- haput data initiate
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM cart_items;
DELETE FROM category_items;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM stores;
DELETE FROM users;

-- matikan trigger sementara
SET session_replication_role = replica;

-- hapus semua tabel (urutan bebas)
TRUNCATE TABLE order_items, orders, cart_items, category_items, products, categories, stores, users RESTART IDENTITY;

-- nyalakan trigger lagi
SET session_replication_role = DEFAULT;


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
    ('buyer5@mail.com', 'pw10', 'BUYER', 'Buyer 5', 'Jl. Melur No.10', 1000000);

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
