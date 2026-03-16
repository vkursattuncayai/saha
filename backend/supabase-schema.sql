-- SahaBul - Supabase PostgreSQL Schema
-- Supabase dashboard > SQL Editor > Bu dosyayı yapıştır ve çalıştır

-- Kullanıcılar
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone         TEXT,
  profile_image TEXT,
  is_admin      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Spor Sahaları
CREATE TABLE IF NOT EXISTS sports_fields (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  city           TEXT NOT NULL,
  district       TEXT NOT NULL,
  address        TEXT NOT NULL,
  price_per_hour NUMERIC(10,2) NOT NULL,
  rating         NUMERIC(3,1) DEFAULT 0,
  reviews_count  INTEGER DEFAULT 0,
  images         JSONB DEFAULT '[]',
  amenities      JSONB DEFAULT '[]',
  field_type     TEXT NOT NULL,
  capacity       TEXT,
  description    TEXT,
  owner_id       INTEGER REFERENCES users(id),
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Zaman Dilimleri
CREATE TABLE IF NOT EXISTS time_slots (
  id             SERIAL PRIMARY KEY,
  field_id       INTEGER NOT NULL REFERENCES sports_fields(id) ON DELETE CASCADE,
  date           DATE NOT NULL,
  start_time     TEXT NOT NULL,
  end_time       TEXT NOT NULL,
  is_available   BOOLEAN DEFAULT TRUE,
  reservation_id INTEGER,
  UNIQUE(field_id, date, start_time)
);

-- Rezervasyonlar
CREATE TABLE IF NOT EXISTS reservations (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  field_id     INTEGER NOT NULL REFERENCES sports_fields(id),
  slot_id      INTEGER NOT NULL,
  date         DATE NOT NULL,
  start_time   TEXT NOT NULL,
  end_time     TEXT NOT NULL,
  total_price  NUMERIC(10,2) NOT NULL,
  status       TEXT DEFAULT 'confirmed',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Ödemeler
CREATE TABLE IF NOT EXISTS payments (
  id             SERIAL PRIMARY KEY,
  reservation_id INTEGER NOT NULL REFERENCES reservations(id),
  amount         NUMERIC(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'credit_card',
  status         TEXT DEFAULT 'success',
  transaction_id TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Yorumlar
CREATE TABLE IF NOT EXISTS reviews (
  id         SERIAL PRIMARY KEY,
  field_id   INTEGER NOT NULL REFERENCES sports_fields(id),
  user_id    INTEGER NOT NULL REFERENCES users(id),
  rating     SMALLINT NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(field_id, user_id)
);

-- Favoriler
CREATE TABLE IF NOT EXISTS favorites (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  field_id   INTEGER NOT NULL REFERENCES sports_fields(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, field_id)
);

-- Supabase RLS (Row Level Security) - Opsiyonel, JWT auth kendi token'ımızı kullandığı için
-- Tabloları public erişime aç (backend API üzerinden yönetilir)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE sports_fields DISABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;

-- Atomik rezervasyon oluşturma fonksiyonu (double-booking önler)
CREATE OR REPLACE FUNCTION create_reservation(
  p_user_id  INTEGER,
  p_field_id INTEGER,
  p_slot_id  INTEGER,
  p_date     TEXT
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_slot           RECORD;
  v_field          RECORD;
  v_reservation_id INTEGER;
  v_result         JSON;
BEGIN
  -- Slot'u kilitle (FOR UPDATE ile double-booking önle)
  SELECT * INTO v_slot
  FROM time_slots
  WHERE id = p_slot_id AND field_id = p_field_id AND is_available = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bu saat dilimi artık müsait değil.';
  END IF;

  SELECT * INTO v_field FROM sports_fields WHERE id = p_field_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Saha bulunamadı.';
  END IF;

  INSERT INTO reservations (user_id, field_id, slot_id, date, start_time, end_time, total_price)
  VALUES (p_user_id, p_field_id, p_slot_id, p_date::DATE, v_slot.start_time, v_slot.end_time, v_field.price_per_hour)
  RETURNING id INTO v_reservation_id;

  UPDATE time_slots
  SET is_available = false, reservation_id = v_reservation_id
  WHERE id = p_slot_id;

  SELECT row_to_json(r) INTO v_result FROM (
    SELECT res.*, sf.name AS field_name, sf.city, sf.district
    FROM reservations res
    JOIN sports_fields sf ON res.field_id = sf.id
    WHERE res.id = v_reservation_id
  ) r;

  RETURN v_result;
END;
$$;
