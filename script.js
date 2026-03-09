const scriptURL ="https://script.google.com/macros/s/AKfycbykorsFz6j22kazT1I2OHD8B-PWahkI8BQVyTCu_YyxShPNC5jcYKUIE7hqNrYzsUlp/exec";

/* ==========================
   FORMAT RUPIAH
========================== */
function formatRupiah(angka) {
  return "Rp " + Number(angka || 0).toLocaleString("id-ID");
}

/* ==========================
   GLOBAL DATA
========================== */
let dataPenjualan = [];
let dataPengeluaran = [];
let chartPenjualan = null;
let chartPengeluaran = null;
let chartPerbandingan = null;

/* ==========================
   LOAD DATA
========================== */
document.addEventListener("DOMContentLoaded", loadData);

function loadData() {
  fetch(scriptURL)
    .then(res => res.json())
    .then(data => {

      dataPenjualan = Array.isArray(data.penjualan) ? data.penjualan : [];
      dataPengeluaran = Array.isArray(data.pengeluaran) ? data.pengeluaran : [];

      if (document.getElementById("totalPenjualan")) {
        renderDashboard();
        renderchartPenjualan();
        renderchartPengeluaran();
        renderChartPerbandingan();
      }

      if (document.getElementById("laporanContainer")) {
        renderPenjualanTable(dataPenjualan);
      }

      if (document.getElementById("pengeluaranContainer")) {
        renderPengeluaranTable(dataPengeluaran);
      }

    })
    .catch(err => console.log("Load Error:", err));
}

/* ==========================
   DASHBOARD
========================== */
function renderDashboard() {

  let totalPenjualan = 0;
  let totalPengeluaran = 0;

  dataPenjualan.forEach(item => {
    totalPenjualan += (Number(item["Harga"]) || 0) * (Number(item["Jumlah"]) || 0);
  });

  dataPengeluaran.forEach(item => {
    totalPengeluaran += (Number(item["Harga"]) || 0) * (Number(item["Jumlah"]) || 0);
  });

  const saldo = totalPenjualan - totalPengeluaran;

  const penjualanEl = document.getElementById("totalPenjualan");
  const pengeluaranEl = document.getElementById("totalPengeluaran");
  const saldoEl = document.getElementById("saldoAkhir");

  if (penjualanEl) penjualanEl.innerText = formatRupiah(totalPenjualan);
  if (pengeluaranEl) pengeluaranEl.innerText = formatRupiah(totalPengeluaran);

  if (saldoEl) {
    saldoEl.classList.remove("saldo-positif","saldo-negatif","saldo-netral");

    let icon = "";

    if (saldo > 0) {
      saldoEl.classList.add("saldo-positif");
      icon = "▲ ";
    } else if (saldo < 0) {
      saldoEl.classList.add("saldo-negatif");
      icon = "▼ ";
    } else {
      saldoEl.classList.add("saldo-netral");
      icon = "● ";
    }

    saldoEl.innerText = icon + formatRupiah(saldo);
  }
}

function renderchartPenjualan() {

  const canvas = document.getElementById("grafikPenjualan");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (!dataPenjualan.length) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const grouped = {};

  dataPenjualan.forEach(item => {
    const nama = item["Nama Barang"] || "Tidak diketahui";
    const total = (Number(item["Harga"]) || 0) * (Number(item["Jumlah"]) || 0);

    if (!grouped[nama]) grouped[nama] = 0;
    grouped[nama] += total;
  });

  const labels = Object.keys(grouped);
  const values = Object.values(grouped);

  if (chartPenjualan) {
    chartPenjualan.destroy();
  }

  chartPenjualan = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Total Penjualan",
        data: values
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function renderchartPengeluaran() {

  const canvas = document.getElementById("grafikPengeluaran");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (!dataPengeluaran.length) {
    if (chartPengeluaran) {
      chartPengeluaran.destroy();
      chartPengeluaran = null;
    }
    return;
  }

  const grouped = {};

  dataPengeluaran.forEach(item => {
    const nama = item["Keterangan"] || "-";
    const total = (Number(item["Harga"]) || 0) * (Number(item["Jumlah"]) || 0);

    if (!grouped[nama]) grouped[nama] = 0;
    grouped[nama] += total;
  });

  if (chartPengeluaran) {
    chartPengeluaran.destroy();
  }

  chartPengeluaran = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(grouped),
      datasets: [{
        label: "Total Pengeluaran",
        data: Object.values(grouped)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function renderChartPerbandingan() {

  const canvas = document.getElementById("grafikPerbandingan");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const groupedPenjualan = {};
  const groupedPengeluaran = {};

  // Group Penjualan per Tanggal
  dataPenjualan.forEach(item => {
    const tanggal = item["Tanggal"];
    const total = (Number(item["Harga"]) || 0) * (Number(item["Jumlah"]) || 0);

    if (!groupedPenjualan[tanggal]) groupedPenjualan[tanggal] = 0;
    groupedPenjualan[tanggal] += total;
  });

  // Group Pengeluaran per Tanggal
  dataPengeluaran.forEach(item => {
    const tanggal = item["Tanggal"];
    const total = (Number(item["Harga"]) || 0) * (Number(item["Jumlah"]) || 0);

    if (!groupedPengeluaran[tanggal]) groupedPengeluaran[tanggal] = 0;
    groupedPengeluaran[tanggal] += total;
  });

  // Gabungkan semua tanggal unik
  const allDates = [...new Set([
    ...Object.keys(groupedPenjualan),
    ...Object.keys(groupedPengeluaran)
  ])].sort();

  const penjualanData = allDates.map(date => groupedPenjualan[date] || 0);
  const pengeluaranData = allDates.map(date => groupedPengeluaran[date] || 0);

  if (chartPerbandingan) {
    chartPerbandingan.destroy();
  }

  chartPerbandingan = new Chart(ctx, {
    type: "line",
    data: {
      labels: allDates,
      datasets: [
        {
          label: "Penjualan",
          data: penjualanData,
          tension: 0.3
        },
        {
          label: "Pengeluaran",
          data: pengeluaranData,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

/* ==========================
   INPUT PENJUALAN
========================== */
const formPenjualan = document.getElementById("formPenjualan");

if (formPenjualan) {
  formPenjualan.addEventListener("submit", function(e) {
    e.preventDefault();

    fetch(scriptURL, {
      method: "POST",
      body: JSON.stringify({
        type: "penjualan",
        tanggal: document.getElementById("tanggal").value,
        nama: document.getElementById("nama").value,
        harga: Number(document.getElementById("harga").value) || 0,
        jumlah: Number(document.getElementById("jumlah").value) || 0
      })
    })
    .then(res => res.json())
    .then(() => {
      alert("Penjualan berhasil disimpan");
      formPenjualan.reset();
      loadData();
    })
    .catch(err => console.log("Error Penjualan:", err));
  });
}

/* ==========================
   INPUT PENGELUARAN
========================== */
const formPengeluaran = document.getElementById("formPengeluaran");

if (formPengeluaran) {
  formPengeluaran.addEventListener("submit", function(e) {
    e.preventDefault();

    fetch(scriptURL, {
      method: "POST",
      body: JSON.stringify({
        type: "pengeluaran",
        tanggal: document.getElementById("tanggal").value,
        keterangan: document.getElementById("keterangan").value,
        harga: Number(document.getElementById("harga").value) || 0,
        jumlah: Number(document.getElementById("jumlah").value) || 0
      })
    })
    .then(res => res.json())
    .then(() => {
      alert("Pengeluaran berhasil disimpan");
      formPengeluaran.reset();
      loadData();
    })
    .catch(err => console.log("Error Pengeluaran:", err));
  });
}

/* ==========================
   TABLE PENJUALAN
========================== */
function renderPenjualanTable(data) {

  const container = document.getElementById("laporanContainer");
  if (!container) return;

  let total = 0;

  let html = `
    <table class="laporan-table">
      <thead>
        <tr>
          <th>Tanggal</th>
          <th>Nama Barang</th>
          <th>Harga</th>
          <th>Jumlah</th>
          <th>Total</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
  `;

  if (!data.length) {
    html += `<tr><td colspan="6" style="text-align:center;">Tidak ada data</td></tr>`;
  }

  data.forEach(item => {

    const harga = Number(item["Harga"]) || 0;
    const jumlah = Number(item["Jumlah"]) || 0;
    const totalItem = harga * jumlah;

    total += totalItem;

    html += `
      <tr>
        <td>${item["Tanggal"] || "-"}</td>
        <td>${item["Nama Barang"] || "-"}</td>
        <td class="angka">${harga.toLocaleString("id-ID")}</td>
        <td class="angka">${jumlah}</td>
        <td class="angka">${totalItem.toLocaleString("id-ID")}</td>
        <td>
          <button class="btn-delete"
            onclick="deleteData(${item.rowIndex}, '${item.sheetName}')">
            Hapus
          </button>
        </td>
      </tr>
    `;
  });

  html += `
        <tr class="total-row">
          <td colspan="4">Total Penjualan</td>
          <td class="angka">${total.toLocaleString("id-ID")}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

/* ==========================
   TABLE PENGELUARAN
========================== */
function renderPengeluaranTable(data) {

  const container = document.getElementById("pengeluaranContainer");
  if (!container) return;

  let total = 0;

  let html = `
    <table class="laporan-table">
      <thead>
        <tr>
          <th>Tanggal</th>
          <th>Keterangan</th>
          <th>Harga</th>
          <th>Jumlah</th>
          <th>Total</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
  `;

  if (!data.length) {
    html += `<tr><td colspan="6" style="text-align:center;">Tidak ada data</td></tr>`;
  }

  data.forEach(item => {

    // 🔥 NORMALISASI KEY
    const tanggal = item["Tanggal"] ?? item["tanggal"] ?? "-";
    const keterangan = item["Keterangan"] ?? item["keterangan"] ?? "-";
    const harga = Number(item["Harga"] ?? item["harga"] ?? 0);
    const jumlah = Number(item["Jumlah"] ?? item["jumlah"] ?? 0);

    const totalItem = harga * jumlah;
    total += totalItem;

    html += `
      <tr>
        <td>${tanggal}</td>
        <td>${keterangan}</td>
        <td class="angka">${harga.toLocaleString("id-ID")}</td>
        <td class="angka">${jumlah}</td>
        <td class="angka">${totalItem.toLocaleString("id-ID")}</td>
        <td>
          <button class="btn-delete"
            onclick="deleteData(${item.rowIndex}, '${item.sheetName}')">
            Hapus
          </button>
        </td>
      </tr>
    `;
  });

  html += `
        <tr class="total-row">
          <td colspan="4">Total Pengeluaran</td>
          <td class="angka">${total.toLocaleString("id-ID")}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

/* ==========================
   DELETE DATA
========================== */
function deleteData(rowIndex, sheetName) {

  if (!confirm("Yakin ingin menghapus data ini?")) return;

  fetch(scriptURL, {
    method: "POST",
    body: JSON.stringify({
      action: "delete",
      rowIndex: rowIndex,
      sheetName: sheetName
    })
  })
  .then(res => res.json())
  .then(() => {
    alert("Data berhasil dihapus");
    loadData();
  })
  .catch(err => console.log("Delete Error:", err));
}

/* ==========================
   FILTER PENJUALAN
========================== */
function filterPenjualan() {

  const keyword = (document.getElementById("searchPenjualan")?.value || "")
    .toLowerCase()
    .trim();

  if (!keyword) {
    renderPenjualanTable(dataPenjualan);
    return;
  }

  const hasil = dataPenjualan.filter(item =>
    (item["Nama Barang"] || "")
      .toLowerCase()
      .includes(keyword)
  );

  renderPenjualanTable(hasil);
}

/* ==========================
   FILTER PENGELUARAN
========================== */
function filterPengeluaran() {

  const keyword = (document.getElementById("searchPengeluaran")?.value || "")
    .toLowerCase()
    .trim();

  if (!keyword) {
    renderPengeluaranTable(dataPengeluaran);
    return;
  }

  const hasil = dataPengeluaran.filter(item =>
    (item["Keterangan"] || "")
      .toLowerCase()
      .includes(keyword)
  );

  renderPengeluaranTable(hasil);
}