# Aplikasi Web E-Commerce Mirip-Tokped

## Deskripsi Aplikasi

Aplikasi web e-commerce ini merupakan platform jual beli online yang menyediakan fitur pencarian produk, pengelolaan keranjang belanja, pemesanan, serta interaksi real-time melalui chat dan sistem auction. Arsitektur aplikasi menggunakan kombinasi PHP Native (MVC), Node.js, dan React SPA, yang saling terhubung melalui Nginx sebagai reverse proxy.

Pada sisi server tradisional, PHP Native dengan pola MVC menangani seluruh fitur e-commerce inti seperti autentikasi buyer/seller, manajemen produk, keranjang, checkout, dan riwayat pesanan. Sementara itu, fitur yang membutuhkan interaksi real-time—seperti chat, auction (bidding, timer, announcement), dan admin dashboard—dibangun menggunakan React (JSX) dan berkomunikasi dengan Node.js WebSocket Server. Halaman interaktif (auction, chat, admin) dijalankan sebagai React Single Page Application. Semua data disimpan menggunakan PostgreSQL yang diakses oleh PHP maupun Node.js.

### Teknologi yang Digunakan

**Client-side:**
- HTML5 murni untuk struktur halaman
- CSS3 murni untuk styling
- JavaScript vanilla untuk interaktivitas
- Implementasi request menggunakan basic form handling dan AJAX
- Quill.js untuk rich text editor
- React + JSX
- Vite sebagai build too react
- Socket.io-client untuk WebSocket

**Server-side:**
#### PHP Backend
- PHP murni (native PHP)
- Arsitektur MVC 
- Implementasi RESTful API dengan HTTP method (GET, POST, PUT, DELETE)
- Routing system custom untuk manajemen URL

#### Node.js
- Express.js untuk REST API Admin
- Socket.io untuk WebSocket server
- JWT-based authentication untuk admin

**Web Server Layer:**
### Nginx
- Reverse proxy untuk request client
- Static file server untuk React build
- WebSocket proxy untuk koneksi real-time

**Database:**
- Postgre untuk database

### Fitur Utama Aplikasi
#### Untuk Pembeli
- Sistem autentikasi (Login & Register sebagai Buyer)
- Halaman home dengan fitur pencarian dan filter produk
- Katalog produk dengan detail informasi lengkap
- Informasi detail toko (store)
- Keranjang belanja (shopping cart)
- Sistem checkout dan pembayaran
- Riwayat order/pembelian
- Halaman profil pengguna
- Halaman lelang dan detail lelang
- Halaman chat dengan penjual
- Pengaturan notifikasi

#### Untuk Penjual
- Sistem autentikasi (Login & Register sebagai Seller)
- Dashboard seller untuk overview toko
- Manajemen produk (tambah, edit, hapus)
- Manajemen order dari pembeli
- Rich text editor untuk deskripsi produk
- Halaman manajemen lelang dan detail lelang
- Halaman chat dengan pembeli

#### Untuk Admin
- Manajemen pengguna
- Manajemen feature flags
- Manajemen global feature flags

## Daftar Requirement

### Software Requirements
- PHP >= 8.0
- PostgreSQL >= 12
- Docker & Docker Compose 
- Node.js >= 18.x
- Nginx >= 1.20

### Browser Requirements
- Google Chrome (versi terbaru)
- Mozilla Firefox (versi terbaru)
- Safari (versi terbaru)
- Microsoft Edge (versi terbaru)
- JavaScript harus diaktifkan

### Docker Requirements
- Docker Engine >= 20.10
- Docker Compose >= 2.0

## Cara Instalasi

### Metode : Docker Installation

1. Clone repository ini
```bash
git clone https://github.com/Labpro-22/milestone-1-tugas-besar-if-3110-web-based-development-k01-11.git
cd milestone-1-tugas-besar-if-3110-web-based-development-k01-11
```

2. Build dengan docker
```bash
docker-compose up --build
```

## Cara Menjalankan Server

### Metode : Docker

```bash
docker-compose up -d
```

Akses aplikasi melalui browser di `http://localhost:80`


## Tangkapan Layar

### 1. Halaman Login
![Halaman Login](docs/image.png)
*Halaman login untuk pengguna masuk ke sistem*

### 2. Halaman Register Choice
![Halaman Register Choice](docs/image-1.png)
*Halaman registrasi pengguna baru*

### 3. Halaman Register Buyer
![Halaman Register Buyer](docs/image-2.png)
*Halaman registrasi pembeli baru*

### 4. Halaman Register Seller
![Halaman Register Seller](docs/image-3.png)
*Halaman registrasi penjual baru*

### 5. Halaman Home/Landing Page
![Halaman Home](docs/image-4.png)
*Halaman utama dengan fitur pencarian dan filter*

### 6. Halaman Detail Produk
![Halaman Detail Produk](docs/image-5.png)
*Halaman detail informasi produk*

### 7. Halaman Detail Store
![Halaman Detail Produk](docs/image-6.png)
*Halaman detail informasi produk*

### 8. Halaman Keranjang Belanja
![Halaman Cart](docs/image-7.png)
*Halaman keranjang belanja pengguna*

### 9. Halaman Checkout
![Halaman Checkout](docs/image-8.png)
*Halaman proses checkout dan pembayaran*

### 10. Halaman Riwayat Order
![Halaman Riwayat](docs/image-9.png)
*Halaman riwayat order pengguna*

### 11. Halaman Profile
![Halaman Profile](docs/image-10.png)
*Halaman profil pembeli*

### 12. Halaman Dashboard Seller
![Halaman Dashboard Admin](docs/image-12.png)
*Dashboard penjual untuk manajemen toko*

### 13. Halaman Product Manajement
![Halaman Product Manajemen](docs/image-13.png)
*Halaman penjual untuk manajemen produk*

### 14. Halaman Add Product
![Halaman Edit Product](docs/image-14.png)
*Halaman penjual untuk menambah produk*

### 15. Halaman Edit Product
![Halaman Edit Product](docs/image-15.png)
*Halaman penjual untuk mengedit produk*

### 16. Halaman Order Manajemen
![Halaman Order Manajemen](docs/image-16.png)
*Halaman penjual untuk manajemen order*

### 17. Halaman Auction List
![Halaman Auction List]()
*Halaman pembeli untuk melihat lelang*

### 18. Halaman Auction Detail
![Halaman Auction Detail]()
*Halaman pembeli dan penjual untuk melihat detail lelang*

### 19. Halaman Auction Manage
![Halaman Auction Manage]()
*Halaman penjual untuk manajemen lelang*

### 20. Halaman Admin Dashboard
![Halaman Admin]()
*Halaman admin untuk manajemen pengguna dan feature flags*

### 21. Halaman Chat
![Halaman Chat]()
*Halaman pembeli dan penjual untuk berinteraksi*

## Pembagian Tugas

### Server-side
- Login: 13523073, 13523025, 13523031
- Register: 13523073,13523025
- Product Management: 13523031
- Cart Management: 13523073,13523025
- Checkout : 13523073,13523025
- Order Management: 13523073, 13523025,13523031
- User Profile: 13523025
- Database : 13523073, 13523025
- API Routes: 13523073, 13523025, 13523031
- Websocket Server:
- Push Notification:
- Sistem Auction:
- Sistem Chat:
- Admin Authentication:

### Client-side
- Login Page: 13523073,13523025
- Register Page: 13523073,13523025
- Home Page: 13523073
- Product Detail: 13523031
- Store Detail: 13523073,13523025
- Shopping Cart: 13523025
- Checkout Page: 13523025
- Order History: 13523073,13523025
- User Profile Page: 13523025
- Seller Dashboard: 13523031
- Product Management: 13523031
- Add Product: 13523031, 13523073
- Edit Product: 13523031 13523073
- Order Management: 13523031
- Responsive Design: 13523031
- UI/UX Design: 13523031
- Admin Dashboard :
- Chat :
- Auction List:
- Auction Detail:
- Auction Manage

### Additional Tasks
- Docker Configuration: 13523073
- NginxConfiguration:
