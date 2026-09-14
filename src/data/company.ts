/**
 * Company profile content for the home page.
 *
 * LOCATIONS, TEAM and EVENTS are PLACEHOLDER data - swap the values here and
 * every home page section updates. No component needs to change.
 */

export type Location = {
  id: string;
  name: string;
  role: string;
  address: string;
  phone: string;
  hours: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  /** Initials shown in the avatar circle. */
  initials: string;
  bio: string;
};

export type CompanyEvent = {
  id: string;
  date: string;
  /** ISO date, used for the <time> tag and sorting. */
  iso: string;
  tag: string;
  title: string;
  body: string;
  /** Heroicons outline path, drawn as the slide's graphic (no photo assets shipped). */
  icon: string;
};

/* ------------------------------------------------------------ locations --- */

/** PLACEHOLDER - ganti dengan alamat cabang yang sebenarnya. */
export const LOCATIONS: Location[] = [
  {
    id: "loc-jakarta",
    name: "Jakarta Barat",
    role: "Kantor Pusat & Showroom",
    address: "Jl. Contoh Raya No. 12, Kembangan, Jakarta Barat 11640",
    phone: "021-5550-1234",
    hours: "Senin - Sabtu, 08.00 - 17.00",
  },
  {
    id: "loc-surabaya",
    name: "Surabaya",
    role: "Cabang & Gudang",
    address: "Jl. Contoh Industri No. 88, Rungkut, Surabaya 60293",
    phone: "031-5550-2345",
    hours: "Senin - Sabtu, 08.00 - 17.00",
  },
  {
    id: "loc-bandung",
    name: "Bandung",
    role: "Cabang",
    address: "Jl. Contoh Soekarno No. 45, Kiaracondong, Bandung 40282",
    phone: "022-5550-3456",
    hours: "Senin - Jumat, 08.30 - 16.30",
  },
  {
    id: "loc-medan",
    name: "Medan",
    role: "Cabang & Servis",
    address: "Jl. Contoh Gatot Subroto No. 7, Medan Petisah, Medan 20112",
    phone: "061-5550-4567",
    hours: "Senin - Sabtu, 08.00 - 16.00",
  },
];

/* ----------------------------------------------------------------- team --- */

/** PLACEHOLDER - ganti dengan nama dan jabatan yang sebenarnya. */
export const TEAM: TeamMember[] = [
  {
    id: "team-ceo",
    name: "Budi Santoso",
    role: "Chief Executive Officer",
    initials: "BS",
    bio: "Memimpin arah bisnis dan hubungan dengan principal NRT-PRO dan YAMAMAX PRO.",
  },
  {
    id: "team-coo",
    name: "Siti Rahmawati",
    role: "Direktur Operasional",
    initials: "SR",
    bio: "Mengurus rantai pasok, gudang, dan ketepatan pengiriman ke seluruh cabang.",
  },
  {
    id: "team-sales",
    name: "Andi Prasetyo",
    role: "Kepala Penjualan",
    initials: "AP",
    bio: "Menangani pelanggan proyek, kontraktor, dan reseller di Jawa dan Sumatera.",
  },
  {
    id: "team-service",
    name: "Rudi Hartono",
    role: "Kepala Teknisi & Servis",
    initials: "RH",
    bio: "Memimpin tim servis, klaim garansi, dan ketersediaan sparepart.",
  },
  {
    id: "team-warehouse",
    name: "Dewi Anggraini",
    role: "Kepala Gudang",
    initials: "DA",
    bio: "Menjaga akurasi stok dan penyegelan unit sebelum dikirim ke pelanggan.",
  },
  {
    id: "team-support",
    name: "Fajar Nugroho",
    role: "Dukungan Pelanggan",
    initials: "FN",
    bio: "Membantu pemilihan tipe alat dan menjawab pertanyaan teknis sebelum pembelian.",
  },
];

/* --------------------------------------------------------------- events --- */

/** PLACEHOLDER - ganti dengan kegiatan perusahaan yang sebenarnya. */
export const EVENTS: CompanyEvent[] = [
  {
    id: "ev-2026-09",
    date: "1 September 2026",
    iso: "2026-09-01",
    tag: "Stok",
    title: "Kedatangan kontainer hammer demolition seri HD",
    body: "Stok hammer demolition 2.8J sampai 75J kembali penuh di gudang Jakarta dan Surabaya, siap kirim hari yang sama untuk pesanan sebelum jam 14.00.",
    icon: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
  },
  {
    id: "ev-2026-08b",
    date: "18 Agustus 2026",
    iso: "2026-08-18",
    tag: "Cabang",
    title: "Cabang Medan menambah layanan servis",
    body: "Cabang Medan kini menerima servis dan klaim garansi langsung di tempat, tanpa perlu mengirim unit ke Jakarta.",
    icon: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z",
  },
  {
    id: "ev-2026-08a",
    date: "5 Agustus 2026",
    iso: "2026-08-05",
    tag: "Pelatihan",
    title: "Pelatihan teknisi bersama principal NRT-PRO",
    body: "Tim teknisi dari empat cabang mengikuti pelatihan perawatan mesin kerja kayu dan penanganan sparepart lini cordless.",
    icon: "M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347M4.26 10.147a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814M4.26 10.147a50.717 50.717 0 0112 3.342m3.74-3.342a50.702 50.702 0 00-3.74 3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443",
  },
  {
    id: "ev-2026-07",
    date: "5 Juli 2026",
    iso: "2026-07-05",
    tag: "Harga",
    title: "Daftar harga distributor diperbarui",
    body: "Daftar harga edisi 5 Juli 2026 berlaku untuk seluruh katalog, termasuk penyesuaian pada lini staples angin dan spray gun YAMAMAX PRO.",
    icon: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z",
  },
];
