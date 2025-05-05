require('dotenv').config();
const express = require("express");
const cors = require("cors");
const secure = require("ssl-express-www");
const path = require('path');
const os = require('os');
const fs = require('fs');
const axios = require('axios');
const mongoose = require('mongoose');
const { autogempa, gempaterkini, gempadirasakan } = require("./scrape");

const app = express();
app.enable("trust proxy");
app.set("json spaces", 2);
app.use(cors());
app.use(secure);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/stats', (req, res) => {
  const stats = {
    platform: os.platform(),
    architecture: os.arch(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    uptime: os.uptime(),
    cpuModel: os.cpus()[0].model,
    numCores: os.cpus().length,
    loadAverage: os.loadavg(),
    hostname: os.hostname(),
    osType: os.type(),
    osRelease: os.release(),
    processId: process.pid,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage()
  };
  res.json(stats);
});

// Special Routes
const errorLogFile = path.join(__dirname, "latest-error.txt");

// Fungsi untuk menyimpan error ke file .txt
function logErrorToFile(error) {
  const log = `
[${new Date().toLocaleString()}]
Message: ${error.message}
Stack:
${error.stack}
Platform: ${process.platform}
------------------------------------
`;
  fs.writeFileSync(errorLogFile, log);
}

// Contoh route API yang bisa error
app.get("/api/test", (req, res) => {
  // Simulasi error
  throw new Error("Simulasi error dari /api/test");
});

// API untuk ambil error terakhir
app.get("/api/latest-error", (req, res) => {
  fs.readFile(errorLogFile, "utf8", (err, data) => {
    if (err) {
      return res.status(404).send("Tidak ada error terbaru");
    }
    res.type("text").send(data);
  });
});

// Middleware untuk menangkap error dalam route
app.use((err, req, res, next) => {
  console.error("Middleware error:", err);
  logErrorToFile(err);
  res.status(500).send("Terjadi kesalahan pada server");
});

// Tangkap error global
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  logErrorToFile(err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  logErrorToFile(reason instanceof Error ? reason : new Error(reason));
})

app.get("/api/autogempa", async (req, res) => {
  try {
    const data = await autogempa();
    res.status(200).json({ status: true, creator: "ikann", data });
  } catch (error) {
    res.status(500).json({ status: false, error: "Gagal mengambil data gempa" });
  }
});

app.get("/api/gempaterkini", async (req, res) => {
  try {
    const data = await gempaterkini();
    res.status(200).json({ status: true, creator: "ikann", data });
  } catch (error) {
    res.status(500).json({ status: false, error: "Gagal mengambil data gempa" });
  }
});

app.get("/api/gempadirasakan", async (req, res) => {
  try {
    const data = await gempadirasakan();
    res.status(200).json({ status: true, creator: "ikann", data });
  } catch (error) {
    res.status(500).json({ status: false, error: "Gagal mengambil data gempa" });
  }
});

// Islam Routes
app.get('/api/islam/surah', async (req, res) => {
  try {
    const listSurat = await axios.get('https://api.npoint.io/99c279bb173a6e28359c/data');
    res.status(200).json({ status: true, creator: 'ikann', data: listSurat.data });
  } catch (error) {
    res.status(500).json({ status: false, creator: 'ikann', message: "Server sedang error :(" });
  }
});

app.get('/api/islam/nosurat', async (req, res) => {
  try {
    const { q } = req.query;
    if (q >= 115) {
      return res.status(404).json({ status: false, creator: 'ikann', message: "Al-Qur'an hanya sampai 114 surah" });
    }
    const surat = await axios.get(`https://api.npoint.io/99c279bb173a6e28359c/surat/${q}`);
    res.status(200).json({ status: true, creator: 'ikann', data: surat.data });
  } catch (error) {
    res.status(500).json({ status: false, creator: 'ikann', message: "Server sedang error :(" });
  }
});

app.get('/api/islam/namasurat', async (req, res) => {
  try {
    const { q } = req.query;
    const listSurat = await axios.get('https://api.npoint.io/99c279bb173a6e28359c/data');
    const findSurah = listSurat.data.find(surah => surah.nama === q);
    if (!findSurah) {
      return res.status(404).json({ status: false, creator: 'ikann', message: "Surah tidak ditemukan" });
    }
    res.status(200).json({ status: true, creator: 'ikann', data: findSurah });
  } catch (error) {
    res.status(500).json({ status: false, creator: 'ikann', message: "Server sedang error :(" });
  }
});

// Error Handling
app.use((req, res) => {
  res.status(404).send("Halaman tidak ditemukan");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Ada kesalahan pada server');
});

// Server Start
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});

module.exports = app;