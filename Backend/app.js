const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB } = require(__dirname + '/config/db');

const userRoutes = require(__dirname + '/routes/userRoutes');
const sessionRoutes = require(__dirname + '/routes/sessionRoutes');
const scanRoutes = require(__dirname + '/routes/scanRoutes');

dotenv.config();
connectDB();

const app = express();
const path = require('path');

// ✅ Serving static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../frontend/public')));  // ✅ Tambahkan ini

app.use(express.json());

app.use((req, res, next) => {
  console.log(`\n===== [${new Date().toISOString()}] ${req.method} ${req.originalUrl} =====`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  } else {
    console.log('No body.');
  }
  next();
});

app.use(cors({
  origin: '*',
  //origin: 'https://monitoringsepedateluapp.my.id', // Pastikan ini benar
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.get("/", (_, res) => res.send("API is running..."));

app.use('/users', userRoutes);
app.use('/sessions', sessionRoutes);
app.use('/scan', scanRoutes);

const PORT = process.env.PORT || 3210;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});

module.exports = app;