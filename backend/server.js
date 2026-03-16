require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Yerel geliştirme için statik dosyaları serve et
// Vercel'de bu satır çalışmaz ama statik dosyalar Vercel CDN'den serve edilir
app.use(express.static(path.join(__dirname, '..')));

// API Route'ları
app.use('/api/auth', require('./routes/auth'));
app.use('/api/fields', require('./routes/fields'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));

// Global hata handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Sunucu hatası.' });
});

// Vercel için export (app.listen yerine)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n🏟️  SahaBul sunucu başlatıldı!`);
    console.log(`   http://localhost:${PORT}/ana_sayfa/code.html\n`);
  });
}

module.exports = app;
