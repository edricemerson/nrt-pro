# NRTPRO Tools

Ecommerce + panel admin untuk katalog perkakas NRTPRO. Frontend Next.js (App Router) +
React + TypeScript + Tailwind. Backend Golang + PostgreSQL (Supabase) menyusul.

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # produksi
npm run typecheck
```

## Halaman

| Route | Isi |
| --- | --- |
| `/` | Katalog: pencarian, filter kategori, urut harga, tambah ke keranjang |
| `/product/[slug]` | Detail barang: foto, spesifikasi, stok, deskripsi |
| `/cart` | Keranjang |
| `/checkout` | Data penerima, ongkir, metode bayar, buat pesanan |
| `/order/[id]` | Konfirmasi pesanan + instruksi transfer |
| `/admin/products` | Daftar produk: **quick edit stok**, **quick edit harga**, tombol Edit |
| `/admin/products/new` | Tambah produk |
| `/admin/products/[id]` | Edit foto, deskripsi, kategori, harga, stok, hapus produk |
| `/admin/finance` | Pesanan masuk, barang dipesan + jumlahnya, total masuk rekening |

Quick edit: klik angka stok atau harga di tabel produk. Enter simpan, Esc batal.

## Struktur

```
src/
  app/
    (shop)/            halaman untuk pembeli
    admin/             panel admin (layout sendiri, sidebar)
  components/          UI yang dipakai ulang
  lib/
    types.ts           tipe domain + rencana skema tabel PostgreSQL
    api.ts             SATU-SATUNYA tempat akses data
    mock-db.ts         mock localStorage (dibuang saat backend siap)
    finance.ts         perhitungan biaya dan uang masuk rekening
    categories.ts      11 kategori hasil klasifikasi price list
    format.ts          format rupiah, tanggal, slug
  data/
    products.ts        103 produk dari price list 05 Juli 2026
    orders.ts          22 pesanan contoh untuk halaman keuangan
```

## Data

Semua data sekarang disimpan di `localStorage` browser lewat `src/lib/mock-db.ts`,
di-seed dari `src/data/`. Jadi edit stok, harga, produk baru, dan pesanan tetap
tersimpan saat refresh. Untuk reset ke data awal, panggil `resetDemoData()` dari
`src/lib/api.ts` atau hapus key `nrtpro.*` di localStorage.

Uang selalu disimpan sebagai integer rupiah (tanpa desimal).

## Menyambung ke backend Golang

`src/lib/api.ts` adalah satu-satunya file yang tahu data datang dari mana. Setiap
fungsi sudah diberi komentar endpoint yang dituju. Ganti isinya dengan `fetch`,
biarkan signature-nya sama, dan tidak ada satu pun halaman yang perlu diubah.

```ts
export async function listProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/api/products`, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat produk");
  return res.json();
}
```

Set `NEXT_PUBLIC_API_URL` di `.env.local` (lihat `.env.example`), lalu hapus
`src/lib/mock-db.ts` dan `src/data/`.

Skema tabel yang diasumsikan ada di komentar paling atas `src/lib/types.ts`
(`products`, `categories`, `orders`, `order_items`, `settings`).

Catatan untuk backend:

- `POST /api/orders` harus mengurangi stok di transaksi yang sama.
- `unit_price` dan nama barang disalin ke `order_items` saat order dibuat, supaya
  perubahan harga di kemudian hari tidak mengubah riwayat.
- Perhitungan biaya ada di `src/lib/finance.ts`. Kalau ingin dihitung di server,
  pindahkan rumusnya dan kirim hasilnya lewat API.

## Perhitungan uang masuk rekening

```
gross         = subtotal barang + ongkir yang dibayar pembeli
paymentFee    = gross x paymentFeePercent + paymentFeeFlat   (0 untuk COD)
platformFee   = subtotal barang x marketplaceFeePercent      (ongkir tidak dipotong)
netToBank     = gross - paymentFee - platformFee
```

Persentase dan nomor rekening bisa diubah dari kartu "Rekening & potongan" di
halaman keuangan. Pesanan berstatus `menunggu_pembayaran` dihitung terpisah
sebagai uang yang belum masuk, dan `dibatalkan` tidak dihitung sama sekali.

## Foto produk

Katalog awal belum punya foto, jadi ditampilkan placeholder berisi SKU. Admin bisa
menambah foto lewat URL atau unggah file di halaman edit produk. Di prototipe file
disimpan sebagai data URL di localStorage. Untuk produksi, unggah ke Supabase
Storage dan simpan URL publiknya saja.
