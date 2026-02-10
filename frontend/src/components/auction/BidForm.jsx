import { useState } from 'react';
import { useAuctionStore } from '../../stores/auctionStore';
import { useAuthStore } from '../../stores/authStore';

export default function BidForm({ auction, onBidPlaced }) {
  const { placeBid } = useAuctionStore();
  const { user, isAuthenticated } = useAuthStore();
  const [bidAmount, setBidAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  if (!isAuthenticated()) {
    return (
      <div className="bg-slate-700 rounded-lg p-4 text-center">
        <p className="text-slate-400 mb-3">Sign in to place bids</p>
        <a href="/login" className="btn-primary inline-block">
          Sign In
        </a>
      </div>
    );
  }
  
  if (!user?.is_bot) {
    return (
      <div className="bg-slate-700 rounded-lg p-4 text-center">
        <p className="text-orange-400">⚠️ Only bots can bid</p>
        <p className="text-sm text-slate-400 mt-2">
          Human spectators can watch but not participate in bidding.
        </p>
      </div>
    );
  }
  
  const minimumBid = auction.current_price + (auction.min_increment || 1);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const amount = parseFloat(bidAmount);
    
    if (isNaN(amount) || amount < minimumBid) {
      setError(`Minimum bid is $${minimumBid.toFixed(2)}`);
      setIsLoading(false);
      return;
    }
    
    const result = await placeBid(auction.id, amount);
    
    if (result.success) {
      setBidAmount('');
      if (onBidPlaced) onBidPlaced(result.bid);
    } else {
      setError(result.error || 'Failed to place bid');
    }
    
    setIsLoading(false);
  };
  
  const quickAmounts = [
    { label: 'Min', value: minimumBid },
    { label: '+5', value: auction.current_price + 5 },
    { label: '+10', value: auction.current_price + 10 },
    { label: '+25', value: auction.current_price + 25 }
  ];
  
  return (
    <div className="bg-slate-700 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Place Your Bid</h3>
      
      {/* Quick Amount Buttons */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {quickAmounts.map((amount) => (
          <button
            key={amount.label}
            type="button"
            className="py-2 px-3 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm transition-colors"
            onClick={() => setBidAmount(amount.value.toFixed(2))}
          >
            {amount.label}
          </button>
        ))}
      </div>
      
      {/* Bid Input */}
      <form onSubmit={handleSubmit}>
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
          <input
            type="number"
            step="0.01"
            min={minimumBid}
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            className="input-field pl-8"
            placeholder={`Min: $${minimumBid.toFixed(2)}`}
          />
        </div>
        
        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isLoading || !bidAmount}
          className="w-full btn-success disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Placing Bid...
            </span>
          ) : (
            'Place Bid'
          )}
        </button>
      </form>
    </div>
  );
}
