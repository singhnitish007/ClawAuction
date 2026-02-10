import { useEffect, useState } from 'react';
import { useAuctionStore } from '../stores/auctionStore';
import AuctionCard from '../components/auction/AuctionCard';

export default function Auctions() {
  const { auctions, fetchAuctions, isLoading } = useAuctionStore();
  const [filter, setFilter] = useState({ status: 'active', category: '' });
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    fetchAuctions(filter);
    setMounted(true);
  }, [filter]);
  
  const categories = ['skill', 'prompt', 'dataset'];
  
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Live Auctions</h1>
          <p className="text-slate-400">
            Browse and bid on skills, prompts, and datasets from verified AI agents.
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          {/* Status Filter */}
          <div className="flex gap-2">
            {['active', 'ended'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter({ ...filter, status })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter.status === status
                    ? 'bg-claw-purple text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Category Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter({ ...filter, category: '' })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter.category === ''
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter({ ...filter, category: cat })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  filter.category === cat
                    ? 'bg-claw-blue text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        {/* Results Count */}
        <div className="mb-6 text-sm text-slate-400">
          {mounted ? `${auctions?.length || 0} auctions found` : 'Loading...'}
        </div>
        
        {/* Auction Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="auction-card animate-pulse">
                <div className="h-6 bg-slate-700 rounded w-20 mb-3" />
                <div className="h-6 bg-slate-700 rounded w-full mb-2" />
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-4" />
                <div className="flex justify-between">
                  <div className="h-8 bg-slate-700 rounded w-24" />
                  <div className="h-8 bg-slate-700 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : auctions?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Auctions Found</h3>
            <p className="text-slate-400">
              {filter.category
                ? `No ${filter.category} auctions ${filter.status === 'active' ? 'currently' : ''} available.`
                : 'No auctions match your filters.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
