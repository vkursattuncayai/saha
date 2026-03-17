// SahaBul - Supabase Seed Script
// Çalıştır: node backend/seed/seed.js

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function clearAll() {
  console.log('Mevcut veriler temizleniyor...');
  await supabase.from('payments').delete().gte('id', 0);
  await supabase.from('reviews').delete().gte('id', 0);
  await supabase.from('favorites').delete().gte('id', 0);
  await supabase.from('reservations').delete().gte('id', 0);
  await supabase.from('time_slots').delete().gte('id', 0);
  await supabase.from('sports_fields').delete().gte('id', 0);
  await supabase.from('users').delete().gte('id', 0);
  console.log('Temizlendi.');
}

async function seedUsers() {
  console.log('Kullanicilar ekleniyor...');
  const users = [
    {
      name: 'Admin',
      email: 'admin@sahabul.com',
      password_hash: await bcrypt.hash('admin1234', 10),
      phone: '05001234567',
      is_admin: true
    },
    {
      name: 'Ahmet Yilmaz',
      email: 'ahmet@test.com',
      password_hash: await bcrypt.hash('test1234', 10),
      phone: '05321234567'
    },
    {
      name: 'Fatma Demir',
      email: 'fatma@test.com',
      password_hash: await bcrypt.hash('test1234', 10),
      phone: '05439876543'
    }
  ];
  const { data, error } = await supabase.from('users').insert(users).select('id, email');
  if (error) throw new Error('Users: ' + error.message);
  console.log(data.length + ' kullanici eklendi.');
  return data;
}

async function seedFields() {
  console.log('Sahalar ekleniyor...');
  const fields = [
    {
      name: 'Yesil Vadi Futbol Sahasi',
      city: 'Istanbul',
      district: 'Kadikoy',
      address: 'Moda Caddesi No:45, Kadikoy',
      price_per_hour: 350,
      rating: 4.8,
      reviews_count: 124,
      field_type: 'Acik Saha',
      capacity: '7+7',
      description: 'Dogal cim yuzeyliyi, gece aydinlatmali profesyonel futbol sahasi.',
      amenities: ['Otopark', 'Dus', 'Soyunma Odasi', 'Kafe', 'WiFi'],
      images: ['https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800']
    },
    {
      name: 'Merkez Hali Saha',
      city: 'Istanbul',
      district: 'Besiktas',
      address: 'Ihlamur Yolu No:12, Besiktas',
      price_per_hour: 420,
      rating: 4.6,
      reviews_count: 89,
      field_type: 'Kapali Saha',
      capacity: '5+5',
      description: 'Kapali, iklim kontrollu modern hali saha.',
      amenities: ['Otopark', 'Dus', 'Soyunma Odasi', 'Klima'],
      images: ['https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800']
    },
    {
      name: 'Olimpik Spor Merkezi',
      city: 'Ankara',
      district: 'Cankaya',
      address: 'Kizilay Meydani No:3, Cankaya',
      price_per_hour: 280,
      rating: 4.5,
      reviews_count: 67,
      field_type: 'Kapali Saha',
      capacity: '6+6',
      description: 'Tribunlu, profesyonel futbol sahasi.',
      amenities: ['Otopark', 'Tribun', 'Dus', 'Soyunma Odasi', 'Kafe'],
      images: ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800']
    },
    {
      name: 'Bostanci Spor Kompleksi',
      city: 'Istanbul',
      district: 'Kadikoy',
      address: 'Bostanci Sahil Yolu No:8',
      price_per_hour: 300,
      rating: 4.7,
      reviews_count: 102,
      field_type: 'Acik Saha',
      capacity: '7+7',
      description: 'Sahil manzarali, dogal cim futbol sahasi.',
      amenities: ['Otopark', 'Dus', 'WiFi', 'Kafe'],
      images: ['https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800']
    },
    {
      name: 'Kartal Arena',
      city: 'Istanbul',
      district: 'Kartal',
      address: 'Kartal Merkez Mah. No:22',
      price_per_hour: 250,
      rating: 4.3,
      reviews_count: 45,
      field_type: 'Acik Saha',
      capacity: '5+5',
      description: 'Uygun fiyatli, bakimli hali saha.',
      amenities: ['Otopark', 'Soyunma Odasi'],
      images: ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800']
    },
    {
      name: 'Atasehir Premium Saha',
      city: 'Istanbul',
      district: 'Atasehir',
      address: 'Atasehir Bulvari No:55',
      price_per_hour: 500,
      rating: 4.9,
      reviews_count: 210,
      field_type: 'Kapali Saha',
      capacity: '7+7',
      description: 'Premium kalite, tam donanımli kapali futbol sahasi.',
      amenities: ['Otopark', 'Dus', 'Soyunma Odasi', 'Kafe', 'WiFi', 'Klima', 'Tribun'],
      images: ['https://images.unsplash.com/photo-1551958219-acbc595d9e47?w=800']
    },
    {
      name: 'Antalya Gunes Sahasi',
      city: 'Antalya',
      district: 'Muratpasa',
      address: 'Lara Caddesi No:17',
      price_per_hour: 200,
      rating: 4.4,
      reviews_count: 58,
      field_type: 'Acik Saha',
      capacity: '7+7',
      description: 'Gunесli Antalya\'da futbol keyfi.',
      amenities: ['Otopark', 'Dus', 'Kafe'],
      images: ['https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800']
    },
    {
      name: 'Izmir Korfez Spor',
      city: 'Izmir',
      district: 'Konak',
      address: 'Alsancak Mah. No:33',
      price_per_hour: 230,
      rating: 4.5,
      reviews_count: 76,
      field_type: 'Acik Saha',
      capacity: '6+6',
      description: 'Izmir korfez manzarali futbol sahasi.',
      amenities: ['Otopark', 'Soyunma Odasi', 'Dus'],
      images: ['https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800']
    },
    {
      name: 'Pendik Spor Vadisi',
      city: 'Istanbul',
      district: 'Pendik',
      address: 'Pendik Sahil No:9',
      price_per_hour: 220,
      rating: 4.2,
      reviews_count: 31,
      field_type: 'Acik Saha',
      capacity: '5+5',
      description: 'Sahil kenarinda, ferah ve bakimli saha.',
      amenities: ['Otopark', 'Kafe'],
      images: ['https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800']
    },
    {
      name: 'Bursa Yesil Park',
      city: 'Bursa',
      district: 'Nilufer',
      address: 'Nilufer Caddesi No:7',
      price_per_hour: 180,
      rating: 4.6,
      reviews_count: 93,
      field_type: 'Acik Saha',
      capacity: '7+7',
      description: 'Doga icinde, huzurlu bir ortamda futbol oynаyin.',
      amenities: ['Otopark', 'Dus', 'Soyunma Odasi'],
      images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800']
    },
    // --- Corum ---
    {
      name: 'Corum Merkez Hali Saha',
      city: 'Corum',
      district: 'Merkez',
      address: 'Gazi Caddesi No:14, Merkez',
      price_per_hour: 180,
      rating: 4.3,
      reviews_count: 28,
      field_type: 'Kapali Saha',
      capacity: '5+5',
      description: 'Merkeze yakin, kapali ve aydinlatmali hali saha. Soyunma odasi ve dus imkani mevcuttur.',
      amenities: ['Otopark', 'Dus', 'Soyunma Odasi', 'Kafe'],
      images: ['https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800']
    },
    {
      name: 'Yildiz Spor Hali Saha',
      city: 'Corum',
      district: 'Merkez',
      address: 'Inonu Mah. Spor Sk. No:3, Merkez',
      price_per_hour: 160,
      rating: 4.1,
      reviews_count: 17,
      field_type: 'Acik Saha',
      capacity: '7+7',
      description: 'Genis acik hali saha, aile dostu ortam.',
      amenities: ['Otopark', 'Soyunma Odasi'],
      images: ['https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800']
    },
    {
      name: 'Osmancik Futbol Park',
      city: 'Corum',
      district: 'Osmancik',
      address: 'Kizilirmak Mah. Park Sk. No:7, Osmancik',
      price_per_hour: 150,
      rating: 4.4,
      reviews_count: 22,
      field_type: 'Acik Saha',
      capacity: '7+7',
      description: 'Kizilirmak nehri kenarinda ferah, dogal cim futbol sahasi.',
      amenities: ['Otopark', 'Dus', 'Kafe'],
      images: ['https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800']
    },
    {
      name: 'Alaca Genclik Hali Saha',
      city: 'Corum',
      district: 'Alaca',
      address: 'Cumhuriyet Mah. No:2, Alaca',
      price_per_hour: 140,
      rating: 4.0,
      reviews_count: 11,
      field_type: 'Kapali Saha',
      capacity: '5+5',
      description: 'Ilcenin tek kapali hali sahasi, temiz ve bakimli.',
      amenities: ['Soyunma Odasi', 'Otopark'],
      images: ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800']
    },
    {
      name: 'Corum Premium Futbol Merkezi',
      city: 'Corum',
      district: 'Merkez',
      address: 'Bahcelievler Mah. No:18, Merkez',
      price_per_hour: 220,
      rating: 4.7,
      reviews_count: 43,
      field_type: 'Kapali Saha',
      capacity: '6+6',
      description: 'Corum\'un en modern hali saha kompleksi. Kafeteryasi ve tribunu ile tam donanim.',
      amenities: ['Otopark', 'Dus', 'Soyunma Odasi', 'Kafe', 'Tribun', 'WiFi'],
      images: ['https://images.unsplash.com/photo-1551958219-acbc595d9e47?w=800']
    }
  ];

  const { data, error } = await supabase.from('sports_fields').insert(fields).select('id, name');
  if (error) throw new Error('Fields: ' + error.message);
  console.log(data.length + ' saha eklendi.');
  return data;
}

async function seedTimeSlots(fields) {
  console.log('Zaman dilimleri olusturuluyor...');
  const slots = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hours = [
    ['09:00', '10:00'], ['10:00', '11:00'], ['11:00', '12:00'],
    ['12:00', '13:00'], ['13:00', '14:00'], ['14:00', '15:00'],
    ['15:00', '16:00'], ['16:00', '17:00'], ['17:00', '18:00'],
    ['18:00', '19:00'], ['19:00', '20:00'], ['20:00', '21:00'],
    ['21:00', '22:00'], ['22:00', '23:00']
  ];

  for (var d = -7; d <= 30; d++) {
    var date = new Date(today);
    date.setDate(today.getDate() + d);
    var dateStr = date.toISOString().split('T')[0];

    for (var f = 0; f < fields.length; f++) {
      for (var h = 0; h < hours.length; h++) {
        slots.push({
          field_id: fields[f].id,
          date: dateStr,
          start_time: hours[h][0],
          end_time: hours[h][1],
          is_available: true
        });
      }
    }
  }

  var chunkSize = 500;
  for (var i = 0; i < slots.length; i += chunkSize) {
    var chunk = slots.slice(i, i + chunkSize);
    var result = await supabase
      .from('time_slots')
      .upsert(chunk, { onConflict: 'field_id,date,start_time', ignoreDuplicates: true });
    if (result.error) throw new Error('Time slots: ' + result.error.message);
    process.stdout.write('\r  ' + Math.min(i + chunkSize, slots.length) + '/' + slots.length + ' slot...');
  }
  console.log('\n' + slots.length + ' zaman dilimi eklendi.');
}

async function seedReviewsAndFavorites(users, fields) {
  console.log('Yorumlar ve favoriler ekleniyor...');
  var ahmet = users.find(function(u) { return u.email === 'ahmet@test.com'; });
  if (!ahmet) return;

  var reviews = [
    { field_id: fields[0].id, user_id: ahmet.id, rating: 5, comment: 'Harika bir saha, kesinlikle tavsiye ederim!' },
    { field_id: fields[1].id, user_id: ahmet.id, rating: 4, comment: 'Temiz ve bakimli, fiyat biraz yuksek ama deger.' }
  ];
  var revResult = await supabase.from('reviews').insert(reviews);
  if (revResult.error) console.warn('Reviews warning:', revResult.error.message);

  var favorites = [
    { user_id: ahmet.id, field_id: fields[0].id },
    { user_id: ahmet.id, field_id: fields[2].id }
  ];
  var favResult = await supabase.from('favorites').insert(favorites);
  if (favResult.error) console.warn('Favorites warning:', favResult.error.message);

  console.log('Yorumlar ve favoriler eklendi.');
}

async function main() {
  try {
    console.log('=== SahaBul Seed Basliyor ===');
    await clearAll();
    var users = await seedUsers();
    var fields = await seedFields();
    await seedTimeSlots(fields);
    await seedReviewsAndFavorites(users, fields);
    console.log('\n=== Seed Tamamlandi! ===');
    console.log('Test hesaplari:');
    console.log('  Admin : admin@sahabul.com / admin1234');
    console.log('  User 1: ahmet@test.com / test1234');
    console.log('  User 2: fatma@test.com / test1234');
    process.exit(0);
  } catch (err) {
    console.error('Seed hatasi:', err.message);
    process.exit(1);
  }
}

main();
