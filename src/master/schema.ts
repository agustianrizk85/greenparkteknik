// Declarative schema for the master-data (CRUD) screens. A single generic
// ResourceManager renders any of these configs, so adding a new editable
// resource is just data, not code.
//
// Each field can carry a `tip` (cara / apa yang diisi) and a `result` (hasilnya
// apa di dashboard) — rendered as a hover tooltip next to the input label.

export type FieldType = "text" | "number" | "textarea" | "select" | "tags";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  hideInTable?: boolean;
  /** What to enter / what this field means. */
  tip?: string;
  /** What this value drives / changes in the dashboard. */
  result?: string;
}

export interface ResourceConfig {
  /** API path segment, e.g. "projects". */
  key: string;
  /** Tab/section title (plural). */
  title: string;
  /** Singular noun used in buttons/dialogs. */
  singular: string;
  /** When true, the id is user-editable on create (natural key/code). */
  idEditable?: boolean;
  idLabel?: string;
  idTip?: string;
  fields: FieldDef[];
}

const STATUS = [
  { value: "green", label: "Hijau · On Track" },
  { value: "yellow", label: "Kuning · At Risk" },
  { value: "red", label: "Merah · Off Track" },
];
const VENDOR_STATUS = [
  { value: "preferred", label: "Preferred" },
  { value: "normal", label: "Normal" },
  { value: "watchlist", label: "Watchlist" },
  { value: "probation", label: "Probation" },
  { value: "blacklist", label: "Blacklist Cand." },
];
const COMPLAINT_LEVEL = [
  { value: "critical", label: "Critical" },
  { value: "major", label: "Major" },
  { value: "minor", label: "Minor" },
];
const SLA = [
  { value: "ok", label: "On-time" },
  { value: "due", label: "Due" },
  { value: "overdue", label: "Overdue" },
];
const PUBLIC_RISK = [
  { value: "high", label: "Tinggi" },
  { value: "med", label: "Sedang" },
  { value: "low", label: "Rendah" },
];
const AI_TONE = [
  { value: "red", label: "Merah" },
  { value: "orange", label: "Oranye" },
  { value: "yellow", label: "Kuning" },
  { value: "green", label: "Hijau" },
];
const DECISION_TONE = [
  { value: "red", label: "Merah" },
  { value: "orange", label: "Oranye" },
  { value: "navy", label: "Navy" },
];
const AI_ICON = [
  { value: "trend", label: "Trend" },
  { value: "pattern", label: "Pattern" },
  { value: "vendor", label: "Vendor" },
  { value: "alert", label: "Alert" },
  { value: "site", label: "Site" },
  { value: "rec", label: "Recommendation" },
];
const KPI_STATE = [
  { value: "green", label: "Hijau" },
  { value: "yellow", label: "Kuning" },
  { value: "red", label: "Merah" },
];
const TRIGGER_STATUS = [
  { value: "yellow", label: "Kuning" },
  { value: "red", label: "Merah" },
  { value: "crisis", label: "Crisis" },
  { value: "green", label: "Hijau" },
];

export const RESOURCES: ResourceConfig[] = [
  {
    key: "projects",
    title: "Proyek",
    singular: "Proyek",
    idEditable: true,
    idLabel: "ID / Slug",
    idTip: "Kode unik proyek (huruf kecil, tanpa spasi), mis. 'aurora'.",
    fields: [
      { name: "name", label: "Nama Proyek", type: "text", tip: "Nama proyek/cluster.", result: "Judul di tabel Proyek, filter, & modal detail." },
      { name: "contractor", label: "Kontraktor", type: "text", tip: "Kontraktor utama pelaksana.", result: "Menautkan proyek ke performa kontraktor." },
      { name: "spv", label: "SPV", type: "text", tip: "Supervisor / PIC lapangan.", result: "Penanggung jawab yang tampil di detail proyek." },
      { name: "units", label: "Unit", type: "number", tip: "Jumlah unit dalam proyek.", result: "Bobot rata-rata progres & total unit di KPI." },
      { name: "baseline", label: "Baseline (%)", type: "number", hideInTable: true, tip: "Target progres rencana (%) saat ini.", result: "Pembanding terhadap actual untuk deviasi jadwal." },
      { name: "actual", label: "Actual (%)", type: "number", tip: "Realisasi progres fisik (%).", result: "Menentukan rata-rata progres & status On/At/Off Track." },
      { name: "delay", label: "Delay (hari)", type: "number", tip: "Keterlambatan (hari) vs jadwal.", result: "Menandai proyek terlambat di dashboard." },
      { name: "day", label: "Hari ke-", type: "number", hideInTable: true, tip: "Hari berjalan proyek saat ini.", result: "Konteks posisi waktu terhadap target durasi." },
      { name: "target", label: "Target (hari)", type: "number", hideInTable: true, tip: "Durasi target proyek (hari).", result: "Acuan menilai apakah proyek on schedule." },
      { name: "status", label: "Status", type: "select", options: STATUS, tip: "Kesehatan proyek: Hijau/Kuning/Merah.", result: "Warna indikator & hitungan On/At/Off Track di KPI." },
      { name: "recovery", label: "Recovery Plan", type: "text", hideInTable: true, tip: "Rencana pemulihan bila terlambat.", result: "Muncul sebagai langkah aksi di detail proyek." },
      { name: "decision", label: "Decision Needed", type: "text", hideInTable: true, tip: "Keputusan yang dibutuhkan dari pimpinan.", result: "Ditandai sebagai 'butuh keputusan' di detail proyek." },
    ],
  },
  {
    key: "contractors",
    title: "Kontraktor",
    singular: "Kontraktor",
    fields: [
      { name: "rank", label: "Rank", type: "number", tip: "Peringkat kontraktor (1 = terbaik).", result: "Mengurutkan baris di tabel kontraktor." },
      { name: "name", label: "Nama Kontraktor", type: "text", tip: "Nama kontraktor / vendor.", result: "Identitas di matriks performa vendor." },
      { name: "units", label: "Unit", type: "number", tip: "Total unit yang dikerjakan vendor.", result: "Skala beban kerja kontraktor." },
      { name: "commitment", label: "Commitment (%)", type: "number", hideInTable: true, tip: "Tingkat komitmen jadwal (%).", result: "Indikator keandalan vendor." },
      { name: "delayFreq", label: "Delay Freq", type: "number", tip: "Frekuensi keterlambatan.", result: "Sinyal vendor sering telat." },
      { name: "passRate", label: "Pass Rate (%)", type: "number", tip: "Tingkat lolos QC (%).", result: "Ukuran mutu pekerjaan vendor." },
      { name: "repeat", label: "Repeat Defect", type: "number", hideInTable: true, tip: "Jumlah defect berulang.", result: "Menandai masalah mutu yang kronis." },
      { name: "takeover", label: "Take Over", type: "number", hideInTable: true, tip: "Jumlah pekerjaan yang di-take over.", result: "Indikator vendor bermasalah." },
      { name: "retensi", label: "Retensi (%)", type: "number", hideInTable: true, tip: "Retensi tertahan (%).", result: "Jaminan penyelesaian & mutu." },
      { name: "status", label: "Status Vendor", type: "select", options: VENDOR_STATUS, tip: "Klasifikasi vendor (Preferred…Blacklist).", result: "Keputusan kelanjutan kerja sama." },
    ],
  },
  {
    key: "complaints",
    title: "Komplain",
    singular: "Komplain",
    idEditable: true,
    idLabel: "Kode (mis. K-118)",
    idTip: "Kode unik komplain, mis. 'K-118'.",
    fields: [
      { name: "unit", label: "Unit", type: "text", tip: "Unit/rumah yang dikomplain.", result: "Lokasi isu pada register komplain." },
      { name: "issue", label: "Isu", type: "textarea", tip: "Deskripsi keluhan konsumen.", result: "Inti masalah yang ditindaklanjuti." },
      { name: "level", label: "Level", type: "select", options: COMPLAINT_LEVEL, tip: "Tingkat: Critical / Major / Minor.", result: "Critical dihitung sebagai isu kritis (badge & KPI)." },
      { name: "owner", label: "Owner", type: "text", tip: "PIC penyelesaian komplain.", result: "Akuntabilitas penanganan." },
      { name: "aging", label: "Aging (hari)", type: "number", tip: "Lama komplain belum selesai (hari).", result: "Memicu sorotan bila melewati SLA." },
      { name: "slaResp", label: "SLA Respon", type: "select", options: SLA, hideInTable: true, tip: "Status SLA respon awal.", result: "Menilai kecepatan tanggap." },
      { name: "slaField", label: "SLA Lapangan", type: "select", options: SLA, tip: "Status SLA penanganan lapangan.", result: "Menilai kecepatan perbaikan." },
      { name: "publicRisk", label: "Risiko Publik", type: "select", options: PUBLIC_RISK, tip: "Risiko viral / sorotan publik.", result: "Prioritas penanganan reputasi." },
      { name: "next", label: "Next Communication", type: "text", hideInTable: true, tip: "Komunikasi berikutnya ke konsumen.", result: "Langkah lanjutan tercatat di detail." },
    ],
  },
  {
    key: "site-readiness",
    title: "Site Readiness",
    singular: "Site Readiness",
    fields: [
      { name: "project", label: "Proyek", type: "text", tip: "Proyek yang dinilai kesiapan site-nya.", result: "Menautkan skor kesiapan ke proyek." },
      { name: "window", label: "Window (mis. H-7)", type: "text", tip: "Jendela waktu, mis. 'H-7'.", result: "Konteks tenggat kesiapan." },
      { name: "score", label: "Score", type: "number", tip: "Skor kesiapan (0–100).", result: "Menentukan status siap / belum." },
      { name: "status", label: "Status", type: "select", options: STATUS, tip: "Status kesiapan site.", result: "Warna indikator kesiapan." },
      { name: "gaps", label: "Gap Utama (pisahkan dengan koma)", type: "tags", hideInTable: true, tip: "Daftar gap, pisahkan dengan koma.", result: "Daftar hal yang harus dibereskan sebelum siap." },
    ],
  },
  {
    key: "handover-readiness",
    title: "Handover Readiness",
    singular: "Handover",
    fields: [
      { name: "unit", label: "Unit", type: "text", tip: "Unit yang akan diserahterimakan.", result: "Identitas item handover." },
      { name: "window", label: "Window (mis. H-7)", type: "text", tip: "Jendela waktu handover.", result: "Konteks tenggat serah terima." },
      { name: "score", label: "Score", type: "number", tip: "Skor kesiapan handover (0–100).", result: "Menentukan siap / belum serah terima." },
      { name: "status", label: "Status", type: "select", options: STATUS, tip: "Status kesiapan handover.", result: "Warna indikator handover." },
    ],
  },
  {
    key: "ai-insights",
    title: "AI Insights",
    singular: "Insight",
    fields: [
      { name: "type", label: "Tipe", type: "text", tip: "Kategori insight (mis. Trend, Vendor).", result: "Pengelompokan kartu di panel AI." },
      { name: "tone", label: "Tone", type: "select", options: AI_TONE, tip: "Warna / urgensi insight.", result: "Warna kartu insight di panel AI." },
      { name: "icon", label: "Ikon", type: "select", options: AI_ICON, hideInTable: true, tip: "Ikon representatif insight.", result: "Visual kartu insight." },
      { name: "text", label: "Teks Insight", type: "textarea", tip: "Isi temuan / rekomendasi AI.", result: "Ditampilkan di panel AI & Decision." },
    ],
  },
  {
    key: "decisions",
    title: "Critical Decisions",
    singular: "Decision",
    fields: [
      { name: "role", label: "Role", type: "text", tip: "Peran yang harus memutuskan (mis. Dirops).", result: "Label peran pada kartu keputusan." },
      { name: "tone", label: "Tone", type: "select", options: DECISION_TONE, tip: "Warna / urgensi keputusan.", result: "Warna kartu keputusan." },
      { name: "text", label: "Keputusan", type: "textarea", tip: "Keputusan yang dibutuhkan.", result: "Ditampilkan di panel Decision." },
    ],
  },
  {
    key: "kpis",
    title: "KPI",
    singular: "KPI",
    fields: [
      { name: "no", label: "No", type: "number", tip: "Nomor urut KPI.", result: "Mengurutkan baris tabel KPI." },
      { name: "kpi", label: "Nama KPI", type: "text", tip: "Nama indikator.", result: "Judul baris KPI." },
      { name: "def", label: "Definisi", type: "text", hideInTable: true, tip: "Definisi / cara ukur KPI.", result: "Penjelasan KPI di tabel." },
      { name: "pic", label: "PIC", type: "text", hideInTable: true, tip: "Penanggung jawab KPI.", result: "Akuntabilitas pencapaian." },
      { name: "upd", label: "Update", type: "text", hideInTable: true, tip: "Frekuensi update (mis. Mingguan).", result: "Konteks kebaruan data KPI." },
      { name: "green", label: "Ambang Hijau", type: "text", hideInTable: true, tip: "Batas nilai status hijau.", result: "Menentukan warna hijau pada KPI." },
      { name: "yellow", label: "Ambang Kuning", type: "text", hideInTable: true, tip: "Batas nilai status kuning.", result: "Menentukan warna kuning pada KPI." },
      { name: "red", label: "Ambang Merah", type: "text", hideInTable: true, tip: "Batas nilai status merah.", result: "Menentukan warna merah pada KPI." },
      { name: "val", label: "Nilai Kini", type: "text", tip: "Nilai aktual terkini.", result: "Dibandingkan ambang untuk warna status." },
      { name: "state", label: "Status", type: "select", options: KPI_STATE, tip: "Status kini KPI.", result: "Warna indikator KPI." },
    ],
  },
  {
    key: "triggers",
    title: "Early Warning",
    singular: "Trigger",
    fields: [
      { name: "cond", label: "Kondisi", type: "text", tip: "Kondisi pemicu peringatan.", result: "Aturan early warning yang dipantau." },
      { name: "thr", label: "Ambang Batas", type: "text", tip: "Ambang batas pemicu.", result: "Titik di mana peringatan menyala." },
      { name: "status", label: "Status", type: "select", options: TRIGGER_STATUS, tip: "Tingkat keparahan trigger.", result: "Warna & prioritas peringatan." },
      { name: "pic", label: "PIC", type: "text", tip: "Penanggung jawab respons.", result: "Akuntabilitas tindakan." },
      { name: "act", label: "Tindakan Wajib", type: "text", hideInTable: true, tip: "Tindakan wajib bila terpicu.", result: "Langkah respons tercatat." },
      { name: "esc", label: "Eskalasi", type: "text", hideInTable: true, tip: "Jalur eskalasi (kepada siapa).", result: "Tujuan eskalasi bila tak tertangani." },
    ],
  },
  {
    key: "construction-stages",
    title: "Tahap Pembangunan",
    singular: "Tahap",
    idEditable: true,
    idLabel: "ID Tahap",
    idTip: "Kode unik tahap, mis. 'cs-1'.",
    fields: [
      { name: "no", label: "No", type: "number", tip: "Urutan tahap (1–17).", result: "Mengurutkan kolom di Cek List Progress." },
      { name: "name", label: "Nama Tahap", type: "text", tip: "Nama tahap — dipakai sebagai kunci checklist unit. JANGAN di-rename (centang unit mengacu ke nama ini).", result: "Judul kolom checklist & kunci status per unit." },
      { name: "weight", label: "Bobot (%)", type: "number", tip: "Bobot tahap terhadap progres total (semua tahap = 100%).", result: "Menentukan kontribusi % saat tahap dicentang." },
      { name: "termin", label: "Termin", type: "select", options: [
        { value: "T1", label: "Termin 1" }, { value: "T2", label: "Termin 2" },
        { value: "T3", label: "Termin 3" }, { value: "T4", label: "Termin 4" },
      ], tip: "Termin pembayaran tahap ini.", result: "Pengelompokan header TERMIN di grid." },
    ],
  },
  {
    key: "progress-units",
    title: "Unit Progress",
    singular: "Unit",
    idEditable: true,
    idLabel: "ID Unit",
    idTip: "Kode unik unit, mis. 'pu-1'.",
    fields: [
      { name: "noInduk", label: "No. Induk", type: "text", tip: "Nomor induk unit.", result: "Identitas baris di Cek List Progress." },
      { name: "project", label: "Nama Proyek", type: "text", tip: "Proyek/cluster unit.", result: "Filter proyek di grid checklist." },
      { name: "blok", label: "Blok", type: "text", tip: "Blok/kavling unit.", result: "Identitas unit di grid." },
      { name: "tglSpk", label: "Tgl SPK", type: "text", hideInTable: true, tip: "Tanggal terbit SPK (YYYY-MM-DD).", result: "Acuan mulai pembangunan." },
      { name: "tglSpkFinish", label: "Tgl SPK Finish", type: "text", hideInTable: true, tip: "Target selesai SPK (YYYY-MM-DD).", result: "Acuan target penyelesaian." },
      { name: "status", label: "Status Kavling", type: "select", options: [
        { value: "SOLD", label: "SOLD" }, { value: "READY STOCK", label: "READY STOCK" },
        { value: "AVAILABLE", label: "AVAILABLE" }, { value: "SOLD MANAGEMENT", label: "SOLD MANAGEMENT" },
      ], tip: "Status jual kavling/unit.", result: "Label status di grid checklist." },
      { name: "keterangan", label: "Keterangan", type: "textarea", hideInTable: true, tip: "Catatan progres. Centang tahap dilakukan di tab Cek List Progress.", result: "Keterangan progres di grid." },
    ],
  },
  {
    key: "work-items",
    title: "Bobot Pekerjaan (Kurva S)",
    singular: "Item",
    idEditable: true,
    idLabel: "ID Item",
    idTip: "Kode unik item, mis. 'wi-1'.",
    fields: [
      { name: "no", label: "No", type: "number", tip: "Urutan item pekerjaan.", result: "Urutan di master bobot." },
      { name: "name", label: "Nama Pekerjaan", type: "text", tip: "Nama item pekerjaan (mis. Pondasi & Beton).", result: "Item pada Kurva S." },
      { name: "weight", label: "Bobot (%)", type: "number", tip: "Bobot item terhadap total (semua = 100%).", result: "Kontribusi item ke kurva rencana." },
    ],
  },
  {
    key: "kurva-weekly",
    title: "Kurva S Mingguan",
    singular: "Minggu",
    idEditable: true,
    idLabel: "ID Minggu",
    idTip: "Kode unik minggu, mis. 'kw-1'.",
    fields: [
      { name: "week", label: "Minggu Ke", type: "number", tip: "Minggu pembangunan (1–20).", result: "Sumbu X kurva rencana." },
      { name: "weight", label: "Bobot (%)", type: "number", tip: "Target bobot minggu ini.", result: "Kenaikan kurva per minggu." },
      { name: "cumulative", label: "Kumulatif (%)", type: "number", tip: "Target kumulatif s/d minggu ini.", result: "Garis RENCANA pada Kurva S." },
    ],
  },
  {
    key: "unit-weekly-progress",
    title: "Progress Mingguan Unit",
    singular: "Progress",
    idEditable: true,
    idLabel: "ID Progress",
    idTip: "Kode unik, mis. 'uwp-1'.",
    fields: [
      { name: "unitId", label: "Unit ID", type: "text", tip: "ID unit (mengacu ke Unit Progress).", result: "Menautkan progres mingguan ke unit." },
      { name: "week", label: "Minggu Ke", type: "number", tip: "Minggu berjalan.", result: "Sumbu waktu deviasi/SPI." },
      { name: "actual", label: "Aktual (%)", type: "number", tip: "Progres aktual kumulatif (%).", result: "Garis REALISASI & perhitungan deviasi." },
      { name: "target", label: "Target (%)", type: "number", tip: "Target kumulatif (%) dari Kurva S.", result: "Pembanding untuk deviasi & SPI." },
      { name: "updatedBy", label: "Diupdate Oleh", type: "text", hideInTable: true, tip: "User yang menginput.", result: "Jejak audit input." },
    ],
  },
];
