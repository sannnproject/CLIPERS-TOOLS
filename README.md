# CLIPERS-TOOLS

![Languages](https://img.shields.io/github/languages/top/sannnproject/CLIPERS-TOOLS?logo=typescript) ![Repo size](https://img.shields.io/github/repo-size/sannnproject/CLIPERS-TOOLS) ![Last commit](https://img.shields.io/github/last-commit/sannnproject/CLIPERS-TOOLS) ![Bun](https://img.shields.io/badge/bun-%23000000?style=flat&logo=bun) ![Vite](https://img.shields.io/badge/Vite-3DDC84?logo=vite) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript) ![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)

Deskripsi singkat: alat untuk membuat potongan (clips) video secara otomatis dan berjalan secara lokal pada mesin pengguna. Aplikasi memproses video di sisi klien menggunakan ffmpeg.wasm untuk menjaga video tetap berada di perangkat (tidak diunggah ke server).

---

## Apa ini
CLIPERS-TOOLS adalah aplikasi TypeScript + Vite yang menganalisis video lokal (audio + gerakan + subtitle) lalu mengekspor potongan video (clips) secara otomatis sesuai konfigurasi pengguna. Cocok untuk workflow pembuatan potongan pendek (mis. konten sosial) yang harus diproses sepenuhnya secara lokal.

### Ringkasan teknis singkat
- Aplikasi terdiri dari antarmuka React/TSX (client) plus entry server yang menggunakan @tanstack/react-start untuk SSR/route handling (src/server.ts, src/start.ts).
- Pemrosesan video dijalankan di browser memakai ffmpeg.wasm melalui paket @ffmpeg/ffmpeg (module ESM) — engine di-load secara dinamis (src/features/autoclip/engine.ts).
- Fitur pemrosesan inti berada di src/features/autoclip — pipeline analisis → scoring → cutting → (opsional) burn subtitles → export.

---

## Stack
- Language(s): TypeScript (utama), CSS
- Framework / runtime: Vite dev server; React (TSX) untuk UI; @tanstack/react-start untuk server/SSR
- Notable libraries:
  - @ffmpeg/ffmpeg + @ffmpeg/util — ffmpeg.wasm client-side engine
  - @tanstack/react-start / @tanstack/react-router — routing dan SSR helpers
  - react / react-dom
  - zod, zustand, @tanstack/react-query — utilities/state and data fetching patterns
  - tailwindcss (tailwind-merge) — styling utilities (project includes tailwind integrations)

---

## Struktur penting proyek
Berikut ringkasan pohon direktori top-level (yang relevan):

```
src/
  components/ui/        # komponen UI primitives (button, dialog, sidebar, dsb)
  features/autoclip/    # inti fitur autoclip: pipeline, engine, analysis, subtitles, store, templates
    analysis.ts         # analisis audio & motion + highlight detection
    engine.ts           # loader & accessor ffmpeg.wasm (browser-only)
    pipeline.ts         # orkestrasi pipeline: extract audio, analyze, cut, export
    subtitles.ts        # parsing SRT/VTT dan build ASS untuk burn-in
    source.ts           # abstraksi sumber input
    store.ts            # penyimpanan metadata/status lokal
    templates.ts        # template metadata / nama file
  lib/                   # utilitas (error capture, theme, db, utils)
  router.tsx             # client router
  routeTree.gen.ts       # rute yang di-generate
  server.ts              # server entry (SSR wrapper)
  start.ts               # start/boot middleware setup
  styles.css
package.json
vite.config.ts
bun.lock
bunfig.toml
```

How it fits together (ringkas): aplikasinya adalah SPA/SSR hybrid; UI memanggil pipeline autoclip dengan sebuah Blob (file video) ─ pipeline menulis file ke engine ffmpeg.wasm, mengekstrak audio, menganalisis audio & motion, memilih highlight, memotong segmen dan mengekspor hasil sebagai Blob yang bisa di-download atau ditampilkan langsung.

---

## Rincian cara kerja (berdasarkan kode)
Pipeline utama di src/features/autoclip/pipeline.ts menjalankan langkah-langkah berikut:
1. load engine ffmpeg.wasm (getEngine di engine.ts) — engine berjalan di browser, core diambil dari CDN (unpkg/jsdelivr) lalu di-load ke worker.
2. menulis file input ke sistem file virtual engine (`engine.writeFile`) dan mengekstrak track audio menjadi WAV (`ffmpeg -i source -vn -ac 1 -ar 16000 -f wav`).
3. analyzeAudio (analysis.ts) — decode WAV ke Web Audio API, hitung envelope (RMS per bucket), peaks, silence ratio.
4. analyzeMotion (analysis.ts) — buat video element, sampling frame pada interval, hitung per-frame difference untuk skor motion.
5. detectHighlights (analysis.ts) — gabungkan sinyal audio, motion, dan kata kunci dari subtitle untuk memilih jendela waktu terbaik.
6. Untuk setiap highlight: buat file subtitle ASS bila diminta (subtitles.buildAss), lalu panggil engine.exec dengan argumen ffmpeg yang dibangun di pipeline (`buildArgs`) untuk memotong, crop/scale, burn watermark dan/atau subtitle, serta encode ke mp4/webm/gif.
7. Hasil dibaca (`engine.readFile`) lalu dibungkus menjadi Blob dan dikembalikan ke UI.

Beberapa hal teknis yang penting:
- Subtitle parsing mendukung SRT dan WebVTT (src/features/autoclip/subtitles.ts) dan membuat file ASS untuk burn-in.
- Watermark dan overlay ditangani oleh filter_complex ffmpeg saat watermark disertakan.
- Pencarian highlight menggunakan kombinasi metrik: energi audio (envelope/peaks), rasio keheningan, motion, dan densitas kata kunci (analysis.ts).
- Semua pemrosesan FFmpeg terjadi di browser lewat ffmpeg.wasm — tidak ada upload video ke server.

---

## Fitur yang terlihat di kode
- Analisis audio (RMS envelope, peaks)
- Analisis motion (frame differencing)
- Deteksi highlight berbasis gabungan skor audio/motion/subtitle
- Burn-in subtitle via ASS
- Watermark overlay dengan opsi posisi/opacity/size
- Ekspor ke mp4/webm/gif dengan preset encoding yang disesuaikan

---

## Cara menjalankan (dari clone sampai dev)
Periksa script di package.json — project menyediakan perintah standar Vite. Berikut perintah yang dapat dijalankan di mesin pengembang.

1) Clone repository

```bash
git clone https://github.com/sannnproject/CLIPERS-TOOLS.git
cd CLIPERS-TOOLS
```

2) Install dependensi
- Dengan Bun (repo menyertakan bun.lock & bunfig.toml — Bun direkomendasikan jika tersedia):

```bash
bun install
```

- Atau dengan npm/yarn/pnpm:

```bash
npm install
# atau
# pnpm install
# yarn
```

3) Jalankan development server

```bash
npm run dev
# atau dengan bun
# bun run dev
```

Vite dev server default biasanya hadir di http://localhost:5173 — periksa output terminal untuk port yang tepat.

4) Build untuk produksi

```bash
npm run build
# atau
# bun run build
```

5) Preview hasil build

```bash
npm run preview
```

6) Lint & format

```bash
npm run lint
npm run format
```

Catatan: repository menggunakan Vite + TypeScript, jadi environment yang mendukung ES modules dan node/bun yang kompatibel diperlukan.

---

## Environment & requirement singkat
- Browser modern dengan Web Audio API & Canvas 2D (untuk analisis audio & motion)
- Akses file lokal (pengguna memilih file video lewat UI)
- Tidak perlu server eksternal untuk pemrosesan video — engine ffmpeg.wasm berjalan client-side
- Node atau Bun untuk instalasi/development (Bun terdeteksi dari lockfile)

---

## Troubleshooting & tips
- Jika ffmpeg.wasm gagal load, periksa koneksi ke CDN (unpkg / jsdelivr) atau coba jalankan ulang; engine mencoba beberapa base URLs.
- Subtitle burn-in mungkin gagal pada beberapa build ffmpeg.wasm — pipeline mencoba fallback mengekspor clip tanpa burn-in ketika itu terjadi.
- Jika video gagal didekode untuk motion analysis, pastikan format video didukung oleh browser dan CORS/preview tidak mencegah pembacaan media.
- Bila menggunakan Bun dan ada masalah dependency, coba `npm install` sebagai alternatif.

---

## Files of interest (baca jika ingin mengubah/menambah fitur)
- src/features/autoclip/pipeline.ts
- src/features/autoclip/engine.ts
- src/features/autoclip/analysis.ts
- src/features/autoclip/subtitles.ts
- src/features/autoclip/types.ts
- src/features/autoclip/store.ts
- src/components/ui/ (komponen UI)
- src/server.ts, src/start.ts
- vite.config.ts, package.json, bun.lock

---

## Kontribusi
Terima kasih bila ingin berkontribusi. Silakan buka issue untuk bug/fitur, dan kirim PR dengan perubahan kecil dulu (fix/feature). Ikuti gaya TypeScript yang ada — project sudah mengandung eslint & prettier configs.

