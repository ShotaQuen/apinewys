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

mongoose.connect('mongodb+srv://ikann:7xwYpL-wWR2PaGT@ikann.m1hmeuk.mongodb.net/?retryWrites=true&w=majority&appName=Ikann', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Schema & Model
const visitorSchema = new mongoose.Schema({
  count: { type: Number, default: 0 }
});
const Visitor = mongoose.model('Visitor', visitorSchema);

// API Endpoint
app.get('/api/visit', async (req, res) => {
  try {
    let visitor = await Visitor.findOne();
    if (!visitor) {
      visitor = new Visitor({ count: 1 });
    } else {
      visitor.count += 1;
    }

    await visitor.save();
    res.json({ count: visitor.count });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API Endpoints
const apiRoutes = [
  { path: '/api/lahelu', query: 'q', func: 'laheluSearch' },
  { path: '/api/sfileSearch', query: 'q', func: 'sfileSearch' },
  { path: '/api/modcombo', query: 'q', func: 'mod' },
  { path: '/api/jadwalsholat', query: 'q', func: 'JadwalSholat.byCity' },
  { path: '/api/happymod', query: 'q', func: 'happymod' },
  { path: '/api/anime', query: 'q', func: 'anime' },
  { path: '/api/githubSearch', query: 'q', func: 'githubSearch' },
  { path: '/api/Apk4Free', query: 'q', func: 'Apk4Free' },
  { path: '/api/pin', query: 'q', func: 'pin' },
  { path: '/api/ttstalk', query: 'q', func: 'ttstalk' },
  { path: '/api/npmStalk', query: 'q', func: 'npmStalk' },
  { path: '/api/ffStalk', query: 'q', func: 'ffStalk.stalk' },
  { path: '/api/mediafile', query: 'q', func: 'mediafire.stalk' },
  { path: '/api/ssweb', query: 'q', func: 'ssweb' },
  { path: '/api/viooai', query: 'q', func: 'viooai' },
  { path: '/api/ytmp4', query: ['url', 'quality'], func: 'ytdl' },
  { path: '/api/ytmp3', query: ['url', 'quality'], func: 'ytdl' },
  { path: '/api/orkut/createpayment', query: ['amount', 'codeqr'], func: 'createPayment' },
  { path: '/api/orkut/cekstatus', query: ['merchant', 'keyorkut'], func: 'cekStatus' }
];

apiRoutes.forEach(route => {
  app.get(route.path, async (req, res) => {
    try {
      const queries = Array.isArray(route.query) ?
        route.query.map(q => req.query[q]) : [req.query[route.query]];
      
      if (queries.some(q => !q)) {
        return res.status(400).json({
          status: false,
          error: `Query parameter${Array.isArray(route.query) ? 's' : ''} ${Array.isArray(route.query) ? route.query.join(', ') : route.query} ${Array.isArray(route.query) ? 'are' : 'is'} required`
        });
      }
      
      const {
        [route.func.includes('.') ? route.func.split('.')[0] : route.func]: func } = require('./scrape');
      const response = route.func.includes('.') ?
        await func[route.func.split('.')[1]](...queries) :
        await func(...queries);
      
      res.status(200).json({
        status: true,
        creator: 'ikann',
        data: response
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  });
});

// Special Routes
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