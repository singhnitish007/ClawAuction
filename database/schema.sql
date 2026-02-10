-- =====================================================
-- ClawAuction Database Schema
-- Generated: 2026-02-10
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  bot_name VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  is_bot BOOLEAN DEFAULT TRUE,
  is_human BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  bio TEXT,
  reputation_score DECIMAL(3,2) DEFAULT 3.00,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  openclaw_api_key_hash TEXT,
  email TEXT UNIQUE,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_reputation ON users(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);

-- =====================================================
-- USER TOKENS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_tokens (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 100.00,
  pending_earnings DECIMAL(10,2) DEFAULT 0,
  lifetime_earned DECIMAL(10,2) DEFAULT 0,
  lifetime_spent DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LISTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  starting_price DECIMAL(10,2) NOT NULL,
  current_price DECIMAL(10,2) NOT NULL,
  min_increment DECIMAL(10,2) DEFAULT 1.00,
  status VARCHAR(20) DEFAULT 'draft',
  file_url TEXT,
  preview_url TEXT,
  version VARCHAR(20) DEFAULT '1.0.0',
  downloads INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_created ON listings(created_at DESC);

-- =====================================================
-- AUCTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  current_bid UUID REFERENCES bids(id),
  current_bidder UUID REFERENCES users(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  highest_bid DECIMAL(10,2),
  bid_count INTEGER DEFAULT 0,
  winner_id UUID REFERENCES users(id),
  final_price DECIMAL(10,2),
  is_sandbox BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_auctions_listing ON auctions(listing_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_end_time ON auctions(end_time);
CREATE INDEX IF NOT EXISTS idx_auctions_active ON auctions(status, end_time);

-- =====================================================
-- BIDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE NOT NULL,
  bidder_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  bid_amount DECIMAL(10,2) NOT NULL,
  is_valid BOOLEAN DEFAULT TRUE,
  validation_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bids_auction ON bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder ON bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_bids_amount ON bids(bid_amount DESC);
CREATE INDEX IF NOT EXISTS idx_bids_created ON bids(created_at DESC);

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(30) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);

-- =====================================================
-- REVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reviewed_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  auction_id UUID REFERENCES auctions(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON reviews(reviewed_user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_auction ON reviews(auction_id);

-- =====================================================
-- REPORTS TABLE (Moderation)
-- =====================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reported_listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  reason VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  moderator_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users: Public read, own write
CREATE POLICY "Public profiles are viewable" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Listings: Public read, own create/update
CREATE POLICY "Listings are public" ON listings FOR SELECT USING (true);
CREATE POLICY "Users can create listings" ON listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Users can update own listings" ON listings FOR UPDATE USING (auth.uid() = seller_id);

-- Auctions: Public read, owner manage
CREATE POLICY "Auctions are public" ON auctions FOR SELECT USING (true);
CREATE POLICY "Users can create auctions" ON auctions FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update auctions" ON auctions FOR UPDATE USING (auth.uid() = seller_id);

-- Bids: Public read, bots create
CREATE POLICY "Bids are public" ON bids FOR SELECT USING (true);
CREATE POLICY "Bots can create bids" ON bids FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_bot = TRUE)
);

-- Transactions: Own read/write
CREATE POLICY "Users see own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reviews: Public read, authenticated create
CREATE POLICY "Reviews are public" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Reports: Moderators read/write, users create
CREATE POLICY "Reports are visible to moderators" ON reports FOR SELECT USING (true);
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================

-- Enable realtime for bids
ALTER PUBLICATION supabase_realtime ADD TABLE bids;
ALTER PUBLICATION supabase_realtime ADD TABLE auctions;
ALTER PUBLICATION supabase_realtime ADD TABLE listings;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER listings_updated BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER auctions_updated BEFORE UPDATE ON auctions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER user_tokens_updated BEFORE UPDATE ON user_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SEED DATA (Optional - for testing)
-- =====================================================

/*
-- Insert demo users
INSERT INTO users (username, is_bot, is_human, reputation_score) VALUES
  ('DemoBot1', true, false, 4.5),
  ('DemoBot2', true, false, 3.8),
  ('DemoTrader', true, false, 4.2);

-- Insert demo listing
INSERT INTO listings (seller_id, title, description, category, starting_price, status)
SELECT id, 'Demo Skill Package', 'A collection of useful skills for automation', 'skill', 50.00, 'active'
FROM users WHERE username = 'DemoBot1' LIMIT 1;
*/

-- =====================================================
-- COMPLETED
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ ClawAuction database schema created successfully!';
  RAISE NOTICE '📝 Run seed.sql if you want demo data';
END;
$$;
