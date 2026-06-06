import { RESOURCES } from "../master/schema";

interface Step {
  n: number;
  title: string;
  desc: string;
}

const FLOW: Step[] = [
  { n: 1, title: "Input Master Data", desc: "Isi data dasar di tab Master Data: Proyek, Kontraktor, Komplain, Site/Handover, AI Insight, Decision, KPI, Early Warning. Bisa input manual atau impor file Excel (.xlsx)." },
  { n: 2, title: "Pantau Progres Proyek", desc: "Tiap proyek dibandingkan Baseline (rencana) vs Actual (realisasi). Selisihnya menentukan status On Track / At Risk / Off Track dan keterlambatan (delay)." },
  { n: 3, title: "Nilai Performa Kontraktor", desc: "Kontraktor dinilai dari pass rate QC, frekuensi telat, dan defect berulang → menghasilkan keputusan vendor (Preferred sampai Blacklist)." },
  { n: 4, title: "Kelola Mutu & Komplain", desc: "Defect dan komplain konsumen dicatat dengan level, SLA respon/lapangan, dan risiko publik. Komplain Critical jadi sorotan KPI." },
  { n: 5, title: "Cek Kesiapan Site & Handover", desc: "Skor kesiapan (0–100) per proyek/unit sebelum mulai bangun & serah terima, beserta gap utama yang harus dibereskan." },
  { n: 6, title: "KPI & Early Warning", desc: "KPI memantau indikator kunci dengan ambang Hijau/Kuning/Merah. Trigger early-warning menyala saat ambang terlampaui dan menentukan jalur eskalasi." },
  { n: 7, title: "AI & Decision", desc: "Insight otomatis dan daftar keputusan kritis membantu CEO mengambil tindakan cepat berdasarkan data di atas." },
  { n: 8, title: "Cek List Progress (Bobot Tahap)", desc: "Tiap unit punya 17 tahap pembangunan berbobot (Termin 1–4). Centang tahap yang selesai → persentase progres unit otomatis (Σ bobot tahap tercentang). Bobot diatur di Master Data → Tahap Pembangunan, data unit bisa diimpor dari Excel." },
  { n: 9, title: "Kurva S & Deviasi", desc: "Master Bobot Pekerjaan + bobot mingguan (20 minggu) jadi baseline Kurva S. Progres mingguan unit dibandingkan target → deviasi, status (Sangat Cepat…Critical Delay), SPI, dan forecast keterlambatan. Deviasi ≤ −5% wajib Recovery Plan." },
];

const TOOLS = [
  { label: "Input manual", desc: "Tombol ＋ Tambah di tiap tabel Master Data, lalu isi form (tiap field ada tooltip ⓘ berisi cara isi + dampaknya)." },
  { label: "Contoh (Excel)", desc: "Unduh template .xlsx (header per kolom), isi di Excel." },
  { label: "Import", desc: "Unggah file .xlsx yang sudah diisi → data masuk massal." },
  { label: "Excel (export)", desc: "Unduh isi tabel sebagai .xlsx (header bold, freeze, autofilter)." },
  { label: "Centang tahap (Cek List Progress)", desc: "Di tab Cek List Progress, admin mencentang tahap selesai per unit → % progres otomatis. Bisa juga impor unit dari Excel (.xlsx) lewat tombol Import." },
  { label: "Seed data contoh", desc: "Pulihkan seluruh data ke contoh bawaan (untuk demo/uji)." },
  { label: "Hapus semua data", desc: "Kosongkan seluruh data (mulai dari nol). Akun login tetap aman." },
];

export function ProsesBisnis() {
  return (
    <div className="pb-wrap">
      <div className="pb-intro">
        <h2>Proses Bisnis — Dashboard Teknik</h2>
        <p>
          Satu layar kendali Departemen Teknik: dari input data dasar, pemantauan progres pembangunan dan kontraktor,
          mutu &amp; komplain, kesiapan site/handover, sampai KPI, early warning, dan keputusan. Halaman ini menjelaskan
          <b> alur kerjanya</b> dan <b>cara mengisi datanya</b>.
        </p>
      </div>

      <div className="pb-section-h">Alur Kerja</div>
      <div className="pb-flow">
        {FLOW.map((s, i) => (
          <div className="pb-step" key={s.n}>
            <div className="pb-step-n">{s.n}</div>
            <div className="pb-step-body">
              <div className="pb-step-title">{s.title}</div>
              <div className="pb-step-desc">{s.desc}</div>
            </div>
            {i < FLOW.length - 1 && <div className="pb-step-line" />}
          </div>
        ))}
      </div>

      <div className="pb-section-h">Cara Input Data (per data)</div>
      <p className="pb-note">
        Buka tab <b>Master Data</b>, pilih jenis data di kiri, klik <b>＋ Tambah</b>, lalu isi field berikut. Tiap field
        juga punya tooltip <b>ⓘ</b> saat mengisi form.
      </p>
      <div className="pb-cards">
        {RESOURCES.map((r) => (
          <div className="pb-card" key={r.key}>
            <div className="pb-card-h">{r.title}</div>
            <table className="pb-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Cara isi</th>
                  <th>Hasilnya</th>
                </tr>
              </thead>
              <tbody>
                {r.fields.map((f) => (
                  <tr key={f.name}>
                    <td className="pb-f">{f.label}</td>
                    <td>{f.tip ?? "—"}</td>
                    <td className="pb-r">{f.result ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="pb-section-h">Alat Data</div>
      <div className="pb-tools">
        {TOOLS.map((t) => (
          <div className="pb-tool" key={t.label}>
            <b>{t.label}</b>
            <span>{t.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
