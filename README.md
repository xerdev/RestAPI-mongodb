# APK Shop API (MongoDB)

API sederhana untuk mengelola user, bot, produk, kategori, transaksi, dan statistik pada proyek APK Shop. Server menggunakan `Express` dan `MongoDB` (via `mongoose`). Dokumentasi ini menjelaskan instalasi, konfigurasi, dan semua endpoint yang tersedia di `app.js`.

**Status:** siap dipakai (development)

**File utama:** `app.js`

**Prerequisites**
- **Node.js**: versi modern (>=16 direkomendasikan).
- **MongoDB**: MongoDB lokal atau URI MongoDB Atlas.

**Instalasi**
 - Buka PowerShell dan pindah ke direktori proyek:

```
cd 'c:\Users\xerch\Documents\VibeCoding\API\mongoDB-APKShop'
```

 - Install dependency:

```
npm install
```

**Skrip npm**
- `npm run dev` — jalankan server dengan `nodemon` (development).
- `npm start` — jalankan server dengan `node app.js` (production).

**Variabel lingkungan**
- `MONGODB_URL` atau `MONGO_URL`: URI koneksi MongoDB. Jika tidak di-set, aplikasi mencoba `mongodb://127.0.0.1:27017`.
- `PORT`: port server (default `3000`).

Contoh set variable di PowerShell sebelum menjalankan:

```
$env:MONGODB_URL = 'mongodb://127.0.0.1:27017'
npm run dev
```

**Ringkasan arsitektur**
- `app.js` — mendefinisikan semua route/endpoint HTTP (GET) dan middleware sederhana.
- `database.js` — koneksi MongoDB, skema Mongoose, dan fungsi CRUD yang dipanggil oleh `app.js`.

**Format request**
- Semua endpoint di `app.js` menggunakan metode `GET` dengan parameter query string.
- Parameter numerik/boolean akan diparsing otomatis oleh helper `parseParam`.
- Untuk array, beberapa endpoint menerima JSON array (sebagai string) atau comma-separated list.

================================================================================

**Endpoints**

Catatan: untuk semua contoh gunakan base URL: `http://localhost:3000`

**Root**
- `GET /` : Cek server berjalan.

User Routes (manajemen user)
- `GET /api/user/register` : Registrasi user baru.
  - Query: `id` (Number), `name` (String)
  - Contoh: `GET /api/user/register?id=123&name=Rudi`

- `GET /api/user/check` : Cek apakah user ada.
  - Query: `id`
  - Contoh: `GET /api/user/check?id=123`

- `GET /api/user/detail` : Ambil detail user.
  - Query: `id`

- `GET /api/user/edit-balance` : Tambah/kurangi saldo user.
  - Query: `id`, `amount` (angka, bisa negatif)
  - Contoh: `GET /api/user/edit-balance?id=123&amount=5000`

- `GET /api/user/edit-role` : Ubah role user.
  - Query: `id`, `role` (contoh: `member` atau `admin`)

- `GET /api/user/all` : Ambil semua user (admin view).

- `GET /api/user/delete` : Hapus user.
  - Query: `userId`

- `GET /api/user/telegram` : Ambil daftar user yang terdaftar sebagai Telegram.

- `GET /api/user/add-transaction` : Tambah counters transaksi user.
  - Query: `userId`, `totalTransaksi`, `totalMembeli`, `nominal`

Bot Routes (manajemen bot)
- `GET /api/bot/check` : Cek apakah bot terdaftar.
  - Query: `id`

- `GET /api/bot/create` : Buat entitas bot baru.
  - Query: `id`, `name`

- `GET /api/bot/detail` : Ambil detail bot.
  - Query: `id`

Category & Product Routes
- `GET /api/category/list` : Ambil list kategori untuk `botId`.
  - Query: `botId`

- `GET /api/category/add` : Tambah kategori.
  - Query: `botId`, `categoryName`, `productIds` (JSON array string atau comma-separated)

- `GET /api/category/update` : Update category product list.
  - Query: `botId`, `categoryName`, `productIds`

- `GET /api/category/delete` : Hapus kategori.
  - Query: `botId`, `categoryName`

Product View (layout/list view)
- `GET /api/product/view/create` : Buat view produk (title).
  - Query: `botId`, `title`

- `GET /api/product/view/add` : Tambah accounts ke product view.
  - Query: `botId`, `title`, `accounts` (JSON array string atau comma-separated)

Product Management
- `GET /api/product/list` : Ambil daftar produk (ringkasan) untuk `botId`.
  - Query: `botId`

- `GET /api/product/detail` : Ambil detail produk.
  - Query: `botId`, `productId`

- `GET /api/product/add` : Tambah produk baru.
  - Query: `botId`, `productData` (JSON string, contoh: `{"id":"p1","name":"Test","price":1000}`)

- `GET /api/product/delete` : Hapus produk.
  - Query: `botId`, `productId`

Product Editing
- `GET /api/product/edit/name` : Ubah nama produk.
  - Query: `botId`, `productId`, `newName`

- `GET /api/product/edit/price` : Ubah harga produk.
  - Query: `botId`, `productId`, `newPrice`

- `GET /api/product/edit/desc` : Ubah deskripsi produk.
  - Query: `botId`, `productId`, `newDesc`

- `GET /api/product/edit/snk` : Ubah SNK produk.
  - Query: `botId`, `productId`, `newSnk`

- `GET /api/product/edit/id` : Ubah product ID.
  - Query: `botId`, `oldId`, `newId`

Stock Management
- `GET /api/product/stock/add` : Tambah akun ke stok produk.
  - Query: `botId`, `productId`, `accounts` (JSON array string atau comma-separated)

- `GET /api/product/account` : Ambil sejumlah account dari produk tanpa menghapus.
  - Query: `botId`, `productId`, `total`

- `GET /api/product/take` : Ambil (remove) sejumlah account dari stok produk.
  - Query: `botId`, `productId`, `total`

- `GET /api/product/sold/add` : Tambah jumlah terjual untuk produk.
  - Query: `botId`, `productId`, `totalTerjual`

Transactions
- `GET /api/transaction/record-sale` : Catat transaksi penjualan (update statistik internal).
  - Query: `botId`, `productCode`, `quantity`, `finalPrice`

- `GET /api/transaction/add-history` : Masukkan riwayat transaksi ke koleksi `Transaction`.
  - Query: `userId`, `botId`, `productId`, `productName`, `quantity`, `price`, `accounts` (array), `status`, `paymentMethod`, `snk`, `reffId`

- `GET /api/transaction/user-history` : Ambil riwayat transaksi user.
  - Query: `userId`, `limit`, `skip`

- `GET /api/transaction/bot-history` : Ambil riwayat transaksi global untuk bot.
  - Query: `botId`, `limit`, `skip`

- `GET /api/transaction/all` : Ambil semua transaksi untuk admin (limit 100).
  - Query: `botId`

Stats
- `GET /api/stats/admin` : Statistik admin (jumlah user, transaksi, produk, revenue, produk terjual).
  - Query: `botId`

- `GET /api/stats/public` : Statistik publik (revenue & produk terjual) tanpa auth.
  - Query: `botId`

- `GET /api/stats/total-transaction` : Statistik total transaksi (pcs & revenue) berdasarkan transaksi.
  - Query: `botId`

- `GET /api/stats/add-bot-trx` : Tambah statistik trx bot (increment counters).
  - Query: `botId`, `totalTransaksi`, `totalNominal`

- `GET /api/stats/revenue` : Hitung total revenue (dari collection Transaction).

- `GET /api/stats/revenue-date` : Hitung revenue di antara dua tanggal.
  - Query: `start`, `end` (ISO date strings)

- `GET /api/stats/total-pcs` : Total pcs terjual (dari Transaction)

- `GET /api/stats/pcs-per-product` : Jumlah pcs per produk (aggregation)

- `GET /api/stats/pcs-sold-product` : Jumlah pcs terjual untuk sebuah `productId`.
  - Query: `productId`

================================================================================

Contoh pemanggilan (cURL)

```
curl "http://localhost:3000/api/product/list?botId=8323651234"

curl "http://localhost:3000/api/product/add?botId=8323651234&productData=%7B%22id%22%3A%22p1%22%2C%22name%22%3A%22Test%22%2C%22price%22%3A1000%7D"
```

Contoh penggunaan array via query string (comma separated):

```
GET /api/category/add?botId=8323651234&categoryName=Games&productIds=p1,p2,p3

atau JSON array encoded:
GET /api/category/add?botId=8323651234&categoryName=Games&productIds=%5B%22p1%22%2C%22p2%22%5D
```

Best practices & catatan
- Sebaiknya gunakan HTTPS dan otentikasi untuk endpoint yang mengubah data (sekarang belum ada auth).
- Banyak endpoint menggunakan `GET` untuk operasi yang biasanya `POST/PUT/DELETE` — hati-hati ketika men-deploy di production.
- Pastikan `MONGODB_URL` diset saat menjalankan server di environment non-lokal.

Kontribusi
- Silakan buka issue atau PR untuk perbaikan dokumentasi atau penambahan fitur.

Lisensi
- MIT
