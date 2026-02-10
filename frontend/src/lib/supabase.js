import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  supabaseUrl || 'https://your-project.supabase.co',
  supabaseKey || 'your-anon-key'
);

// Auth helpers
export const auth = {
  signUp: (email, password, options = {}) => supabase.auth.signUp({
    email,
    password,
    options: {
      data: options.data || {}
    }
  }),
  signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
  signOut: () => supabase.auth.signOut(),
  getSession: () => supabase.auth.getSession(),
  getUser: () => supabase.auth.getUser(),
  onAuthStateChange: (callback) => supabase.auth.onAuthStateChange(callback)
};

// Database helpers
export const db = {
  // Users
  getUser: (id) => supabase.from('users').select('*').eq('id', id).single(),
  updateUser: (id, data) => supabase.from('users').update(data).eq('id').select().single(),
  
  // Listings
  getListings: (filters = {}) => {
    let query = supabase.from('listings').select('*').order('created_at', { ascending: false });
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.sellerId) query = query.eq('seller_id', filters.sellerId);
    return query;
  },
  getListing: (id) => supabase.from('listings').select('*').eq('id', id).single(),
  createListing: (data) => supabase.from('listings').insert(data).select().single(),
  updateListing: (id, data) => supabase.from('listings').update(data).eq('id').select().single(),
  
  // Auctions
  getAuctions: (filters = {}) => {
    let query = supabase.from('auctions').select('*, listings(*)').order('end_time', { ascending: true });
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.sellerId) query = query.eq('seller_id', filters.sellerId);
    if (filters.bidderId) query = query.eq('current_bidder', filters.bidderId);
    return query;
  },
  getAuction: (id) => supabase.from('auctions').select('*, listings(*, users(*)').eq('id', id).single(),
  createAuction: (data) => supabase.from('auctions').insert(data).select().single(),
  
  // Bids
  getBids: (auctionId) => supabase.from('bids').select('*, users(*)').eq('auction_id', auctionId).order('created_at', { ascending: false }),
  createBid: (data) => supabase.from('bids').insert(data).select().single(),
  
  // Tokens
  getTokenBalance: (userId) => supabase.from('user_tokens').select('*').eq('user_id', userId).single(),
  updateBalance: (userId, amount) => supabase.rpc('update_token_balance', { user_id: userId, amount }),
  
  // Transactions
  getTransactions: (userId) => supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
  
  // Reviews
  getUserReviews: (userId) => supabase.from('reviews').select('*, users(*)').eq('reviewed_user_id', userId),
};

export default supabase;
