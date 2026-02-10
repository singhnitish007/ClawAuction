import { create } from 'zustand';
import { db, supabase } from '../lib/supabase';

export const useAuctionStore = create((set, get) => ({
  auctions: [],
  currentAuction: null,
  bids: [],
  isLoading: false,
  error: null,
  
  fetchAuctions: async (filters = {}) => {
    set({ isLoading: true });
    try {
      const { data, error } = await db.getAuctions(filters);
      if (error) throw error;
      set({ auctions: data || [], isLoading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },
  
  fetchAuction: async (id) => {
    set({ isLoading: true });
    try {
      const { data, error } = await db.getAuction(id);
      if (error) throw error;
      
      // Fetch bids
      const { data: bids } = await db.getBids(id);
      
      set({ currentAuction: data, bids: bids || [], isLoading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },
  
  placeBid: async (auctionId, amount) => {
    try {
      const { data: auction } = get();
      const auctionData = auction || get().currentAuction;
      
      const { data: bid, error } = await db.createBid({
        auction_id: auctionId,
        bidder_id: auctionData.current_bidder,
        listing_id: auctionData.listing_id,
        bid_amount: amount
      });
      if (error) throw error;
      
      // Update bids list
      set((state) => ({
        bids: [bid, ...state.bids]
      }));
      
      return { success: true, bid };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  subscribeToAuction: (auctionId, callbacks = {}) => {
    const channel = supabase
      .channel(`auction:${auctionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `auction_id=eq.${auctionId}`
        },
        async (payload) => {
          // Fetch updated bid with user info
          const { data: bid } = await supabase
            .from('bids')
            .select('*, users(*)')
            .eq('id', payload.new.id)
            .single();
          
          set((state) => ({
            bids: [bid, ...state.bids]
          }));
          
          if (callbacks.onBid) callbacks.onBid(bid);
        }
      )
      .subscribe();
    
    return () => supabase.removeChannel(channel);
  },
  
  createListing: async (listingData) => {
    set({ isLoading: true, error: null });
    try {
      // Create listing
      const { data: listing, error } = await db.createListing(listingData);
      if (error) throw error;
      
      // Create auction if type is auction
      if (listingData.listing_type === 'auction') {
        const endTime = new Date();
        endTime.setDate(endTime.getDate() + listingData.duration_days);
        
        const { data: auction, error: auctionError } = await db.createAuction({
          listing_id: listing.id,
          seller_id: listingData.seller_id,
          starting_price: listingData.starting_price,
          current_price: listingData.starting_price,
          start_time: new Date().toISOString(),
          end_time: endTime.toISOString(),
          status: 'active'
        });
        if (auctionError) throw auctionError;
      }
      
      set({ isLoading: false });
      return { success: true, listing };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },
  
  getTimeRemaining: (endTime) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end - now;
    
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, isEnded: true };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { hours, minutes, seconds, isEnded: false, diff };
  },
  
  clearCurrent: () => set({ currentAuction: null, bids: [] })
}));

export default useAuctionStore;
