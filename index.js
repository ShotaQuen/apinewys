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

const helmet = require('helmet'); // Tambahan untuk keamanan
const rateLimit = require('express-rate-limit'); // Tambahan untuk rate limiting

const app = express();

// Middleware dasar
app.use(express.json());
app.use(helmet()); // Menambahkan header keamanan

// Rate limiting untuk API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100 // limit setiap IP ke 100 request per windowMs
});
app.use('/stats/', limiter);

// Koneksi MongoDB dengan error handling yang lebih baik
mongoose.connect('mongodb://localhost:27017/visitorDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000 // Timeout setelah 5 detik jika tidak bisa connect
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Keluar jika tidak bisa connect ke MongoDB
});

// Skema Visitor yang diperluas
const visitorSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  userAgent: String,
  referrer: String,
  path: String,
  visitDate: { type: Date, default: Date.now, index: true }, // Ditambahkan index
  isUnique: { type: Boolean, default: true }
});

// Index untuk performa query
visitorSchema.index({ ip: 1, visitDate: 1 });

// Middleware pre-save untuk mengecek visitor unik
visitorSchema.pre('save', async function(next) {
  const existing = await Visitor.findOne({ 
    ip: this.ip,
    visitDate: { 
      $gte: new Date(new Date() - 24 * 60 * 60 * 1000) // 24 jam terakhir
    }
  });
  
  if (existing) {
    this.isUnique = false;
  }
  next();
});

const Visitor = mongoose.model('Visitor', visitorSchema);

// Middleware untuk tracking visitor yang lebih robust
app.use(async (req, res, next) => {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
               req.ip || 
               req.socket.remoteAddress;
    
    const userAgent = req.headers['user-agent'];
    const referrer = req.headers['referer'] || req.headers['referrer'];
    const path = req.originalUrl;

    await Visitor.create({ 
      ip, 
      userAgent, 
      referrer, 
      path 
    });

    next();
  } catch (err) {
    console.error('Visitor logging failed:', err);
    next();
  }
});

// Endpoint statistik visitor yang lebih lengkap
app.get('/stats/visitors', async (req, res) => {
  try {
    const [total, unique, today] = await Promise.all([
      Visitor.countDocuments(),
      Visitor.countDocuments({ isUnique: true }),
      Visitor.countDocuments({ 
        visitDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      })
    ]);
    
    res.json({ 
      totalVisitors: total,
      uniqueVisitors: unique,
      visitorsToday: today
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch visitor stats' });
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