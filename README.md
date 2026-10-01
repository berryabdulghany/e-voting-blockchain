# E-Voting Blockchain

Aplikasi **e-voting pemilihan ketua organisasi mahasiswa** berbasis blockchain Ethereum. Suara dicatat langsung di smart contract, jadi tidak bisa diubah atau dihapus oleh siapa pun, termasuk admin. Hasilnya bisa dipantau secara real-time.

> Tugas besar mata kuliah **Blockchain** (UAS Semester 7), Program Studi Teknik Informatika, Universitas Komputer Indonesia (UNIKOM), 2026.

## Fitur

**Pemilih (Voter)**
- Login dengan NIM + password, wallet terhubung lewat MetaMask
- Melihat daftar kandidat (foto, nama, organisasi, visi & misi)
- Memberikan suara — satu wallet hanya bisa memilih satu kali (*one-account-one-vote*), divalidasi oleh smart contract
- Suara hanya diterima dalam rentang jadwal voting

**Admin**
- Dashboard ringkasan pemilihan
- Menambah kandidat (tersimpan on-chain)
- Mengatur jadwal mulai & selesai voting
- Tabel data kandidat dan grafik perolehan suara sementara (doughnut chart)

## Arsitektur

Sistem memakai arsitektur hibrida **off-chain + on-chain**:

```
 Browser (HTML/JS + MetaMask)
   │
   ├── Login ───────────► FastAPI (port 8000) ──► MySQL  (kredensial pemilih, JWT)
   │
   ├── Halaman ─────────► Express  (port 8080)   (menyajikan halaman, cek JWT)
   │
   └── Vote / Kandidat ─► Smart Contract Voting.sol @ Ganache (port 7545)
```

| Komponen | Teknologi |
|---|---|
| Smart contract | Solidity 0.5.15, Truffle |
| Blockchain lokal | Ganache |
| Wallet | MetaMask |
| Frontend & web server | HTML, CSS, jQuery, Web3.js, Express, Browserify |
| API autentikasi | Python, FastAPI, PyJWT |
| Database off-chain | MySQL |

## Struktur Folder

```
├── contracts/          # Smart contract (Voting.sol, Migrations.sol)
├── migrations/         # Script deploy Truffle
├── Database_API/       # FastAPI: login + JWT, serta file foto kandidat (public/)
│   └── database.sql    # Skema tabel voters + akun contoh
├── src/
│   ├── html/           # login, index (voter), admin
│   ├── css/
│   └── js/             # app.js (logika DApp), login.js
├── index.js            # Express server
└── truffle-config.js
```

## Cara Menjalankan

### Prasyarat
- [Node.js](https://nodejs.org/) dan npm
- [Truffle](https://trufflesuite.com/) (`npm install -g truffle`)
- [Ganache](https://trufflesuite.com/ganache/)
- Python 3.10+
- MySQL (misalnya lewat XAMPP)
- Ekstensi browser [MetaMask](https://metamask.io/)

### 1. Install dependency
```bash
npm install
pip install -r Database_API/requirements.txt
```

### 2. Siapkan database
Import `Database_API/database.sql` lewat phpMyAdmin, atau:
```bash
mysql -u root -p < Database_API/database.sql
```

### 3. Atur environment variable
Salin file contoh lalu isi nilainya. `SECRET_KEY` di kedua file **harus sama**.
```bash
cp .env.example .env
cp Database_API/.env.example Database_API/.env
```

### 4. Jalankan Ganache & deploy smart contract
Buka Ganache (RPC `127.0.0.1:7545`, network id `5777`), lalu:
```bash
truffle migrate --reset
```

### 5. Build bundle frontend
```bash
npm run build
```

### 6. Hubungkan MetaMask ke Ganache
- Tambah network: RPC URL `http://127.0.0.1:7545`, Chain ID `1337`
- Import akun Ganache memakai private key-nya. **Akun pertama** (yang men-deploy contract) adalah admin di smart contract.

### 7. Jalankan server
Di dua terminal terpisah:
```bash
cd Database_API && uvicorn main:app --reload --port 8000
```
```bash
npm start
```
Foto kandidat disimpan di `Database_API/public/`; saat menambah kandidat, isi kolom foto dengan nama file-nya (misalnya `Paslon_1.jpg`). Repo ini hanya berisi avatar placeholder.

Buka **http://localhost:8080**, hubungkan MetaMask, lalu login dengan akun contoh:

| Role | ID | Password |
|---|---|---|
| Admin | `admin01` | `admin123` |
| Voter | `10120001` | `voter123` |

## Smart Contract

Fungsi utama di [`contracts/Voting.sol`](contracts/Voting.sol):

| Fungsi | Akses | Keterangan |
|---|---|---|
| `addCandidate(name, organization, vision, photo)` | Admin | Menambah kandidat |
| `setDates(start, end)` | Admin | Mengatur jadwal voting (Unix timestamp) |
| `vote(candidateID)` | Semua | Memberi suara; ditolak jika di luar jadwal atau wallet sudah memilih |
| `getCandidate(id)` / `getCountCandidates()` | Semua | Membaca data kandidat & jumlah suara |
| `checkVote()` | Semua | Cek apakah wallet pemanggil sudah memilih |

## Keterbatasan

Project ini dibuat untuk keperluan akademik dan **belum siap produksi**:
- Password disimpan tanpa hashing dan dikirim lewat query string
- Token JWT dikirim lewat URL
- Hanya diuji di jaringan lokal Ganache

Saran pengembangan: deploy ke Layer 2 (Polygon/Optimism), hashing password, Decentralized Identity (DID), Zero-Knowledge Proof untuk kerahasiaan suara, dan audit keamanan smart contract.

## Kredit

Dikembangkan dari project open-source [Krish-Depani/Decentralized-Voting-System](https://github.com/Krish-Depani/Decentralized-Voting-System) (MIT License), lalu disesuaikan untuk kebutuhan pemilihan ketua organisasi mahasiswa: data kandidat (organisasi, visi & misi, foto), dashboard admin, grafik perolehan suara, dan antarmuka berbahasa Indonesia.

## Lisensi

[MIT](LICENSE)
