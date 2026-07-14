# Prd-maker by Noone-Dev 🚀

Prd-maker by Noone-Dev adalah sebuah website premium, modern, dan sangat interaktif yang dirancang untuk membantu para Product Manager, Founder Startup, dan Developer membuat draf **Product Requirement Document (PRD)** berkualitas dunia hanya dalam hitungan detik.

Website ini ditenagai oleh **Kilo Gateway AI (Universal Inference API)** secara gratis dan cepat dengan optimasi performa penuh.

---

## ✨ Fitur Unggulan

- **Sistem AI Cerdas**: Menggunakan AI Kilo Gateway (`kilo-auto/free` dan `openrouter/free` sebagai fallback otomatis) untuk menghasilkan spesifikasi produk yang sangat detail, mulai dari Executive Summary, User Journey, Functional Requirements, Database Schema, API Design, hingga Launch Roadmap dan Key Metrics (KPIs).
- **Desain UI/UX Premium**: Tampilan Dark-Mode futuristik dengan aksen warna indigo/violet yang responsif dan sangat memanjakan mata.
- **Draf Cepat (Template Contoh)**: Tombol "Gunakan Contoh" untuk mencoba aplikasi secara instan dengan satu klik.
- **Live Markdown Render**: Hasil draf PRD dirender secara langsung menggunakan `marked.js` lengkap dengan gaya tabel, list, blockquote, dan code-block yang modern.
- **Aksi Cepat**: Dilengkapi fitur salin (copy to clipboard) dan unduh draf PRD dalam format file Markdown (`.md`) mentah.
- **Sangat Ringan**: Kode bersih, bebas dari Puppeteer/Chromium, serta dioptimalkan untuk performa tinggi.

---

## 🛠️ Cara Menjalankan Secara Lokal

1. **Clone Repositori**:
   ```bash
   git clone <url-repositori-anda>
   cd <nama-folder-repositori>
   ```

2. **Instal Dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi API Key**:
   Buat file `.env` di direktori utama, lalu masukkan Kilo API Key Anda:
   ```env
   KILO_API_KEY=masukkan_api_key_kilo_anda_disini
   PORT=3000
   ```

4. **Jalankan Aplikasi**:
   ```bash
   npm start
   ```
   Buka browser dan buka alamat: `http://localhost:3000`.

---

## ☁️ Cara Deploy ke Render (100% GRATIS)

Layanan Render sangat direkomendasikan karena sepenuhnya gratis, tanpa kartu kredit, dan terintegrasi otomatis dengan repositori Git Anda.

1. Hubungkan akun **Render** Anda ke repositori GitHub/GitLab tempat kode ini berada.
2. Klik tombol **"New +"** lalu pilih **"Web Service"**.
3. Pilih repositori **Prd-maker** Anda.
4. Render akan secara otomatis membaca konfigurasi dari file `render.yaml` di repositori ini:
   - **Name**: `prd-maker`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. **Tambahkan Environment Variable**:
   Pada menu konfigurasi Render, masuk ke tab **Environment** dan tambahkan:
   - `KILO_API_KEY` = `<Masukkan API Key Kilo Anda>`
6. Klik **"Create Web Service"**.
7. Selesai! Website Anda akan langsung aktif dengan tautan publik ber-HTTPS gratis secara otomatis (misalnya `https://prd-maker.onrender.com`).

---

Dibuat dengan 💜 oleh **Noone-Dev**
