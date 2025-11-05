-- Initial schema migration for Odeals
-- Tables: users, partner_stores, deals, visits, reviews, rewards, redemptions, referrals, otps, notifications, partner_stats

BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  zip_code TEXT,
  favorite_categories TEXT[],
  user_type TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_stores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  contact_phone TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude TEXT,
  longitude TEXT,
  categories TEXT[] NOT NULL,
  business_hours JSONB,
  price_rating INTEGER DEFAULT 1,
  upi_id TEXT,
  images TEXT[],
  services_offered TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deals (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL REFERENCES partner_stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  deal_type TEXT NOT NULL,
  discount_percentage INTEGER,
  category TEXT NOT NULL,
  images TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS visits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_id INTEGER NOT NULL REFERENCES partner_stores(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  notes TEXT,
  deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'scheduled',
  marked_as_visited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_id INTEGER NOT NULL REFERENCES partner_stores(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  comment TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rewards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS redemptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_id INTEGER NOT NULL REFERENCES partner_stores(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  proof_image_url TEXT,
  code TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  referrer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_phone TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS otps (
  id SERIAL PRIMARY KEY,
  phone TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_stats (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL REFERENCES partner_stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  store_views INTEGER DEFAULT 0,
  deal_views INTEGER DEFAULT 0,
  scheduled_visits INTEGER DEFAULT 0,
  actual_visits INTEGER DEFAULT 0,
  UNIQUE (partner_id, date)
);

COMMIT;
