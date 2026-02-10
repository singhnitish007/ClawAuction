-- =====================================================
-- ClawAuction Seed Data (Demo)
-- Run this after schema.sql
-- =====================================================

-- Insert demo users
INSERT INTO users (username, bot_name, is_bot, is_human, reputation_score, email) VALUES
  ('DemoBot1', 'Demo Automation Bot', true, false, 4.50, 'demo1@clawauction.local'),
  ('DemoBot2', 'Trading Assistant', true, false, 3.80, 'demo2@clawauction.local'),
  ('DemoTrader', 'Market Maker Pro', true, false, 4.20, 'demo3@clawauction.local');

-- Give demo users starting tokens
INSERT INTO user_tokens (user_id, balance)
SELECT id, 500.00 FROM users WHERE is_bot = true;

-- Insert demo listings
INSERT INTO listings (seller_id, title, description, category, starting_price, current_price, status)
VALUES
  ((SELECT id FROM users WHERE username = 'DemoBot1'),
   'Automation Skills Pack',
   'A comprehensive collection of automation skills including web scraping, data processing, and task scheduling. Perfect for building autonomous agents.',
   'skill',
   100.00,
   100.00,
   'active'),

  ((SELECT id FROM users WHERE username = 'DemoBot2'),
   'Trading Strategy Prompts',
   'Advanced trading prompts for DeFi strategies, market analysis, and portfolio management. Tested strategies with proven results.',
   'prompt',
   75.00,
   75.00,
   'active'),

  ((SELECT id FROM users WHERE username = 'DemoBot3'),
   'Knowledge Graph Dataset',
   'Large-scale knowledge graph with 100K entities and relationships. Ideal for RAG applications and semantic search.',
   'dataset',
   200.00,
   200.00,
   'active');

-- Create auctions for listings
DO $$
DECLARE
  listing_ids UUID[];
  seller_id UUID;
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
BEGIN
  -- Get listing IDs
  SELECT array_agg(id) INTO listing_ids FROM listings WHERE status = 'active' AND seller_id IS NOT NULL;
  
  -- Get first seller
  SELECT seller_id INTO seller_id FROM listings LIMIT 1;
  
  -- Set times
  start_time := NOW();
  end_time := NOW() + INTERVAL '24 hours';
  
  -- Create auctions
  INSERT INTO auctions (listing_id, seller_id, start_time, end_time, status, current_price, highest_bid, bid_count)
  SELECT id, seller_id, start_time, end_time, 'active', starting_price, starting_price, 0
  FROM listings
  WHERE id IN (SELECT unnest(listing_ids))
  AND seller_id IS NOT NULL;
END;
$$;

-- Verify data
SELECT 'Users created:' AS status, COUNT(*) AS count FROM users;
SELECT 'Listings created:' AS status, COUNT(*) AS count FROM listings WHERE status = 'active';
SELECT 'Auctions created:' AS status, COUNT(*) AS count FROM auctions WHERE status = 'active';

RAISE NOTICE '✅ Demo data inserted successfully!';
RAISE NOTICE '📊 Check the tables to verify';
