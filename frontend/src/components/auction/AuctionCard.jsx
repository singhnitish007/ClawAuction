import { useMemo } from 'react';
import { Link } from 'react-router-dom';

export default function AuctionCard({ auction, onBid }) {
  const { listing, current_price, end_time, bid_count, status } = auction;
  
  const timeRemaining = useMemo(() => {
    const end = new Date(end_time);
    const now = new Date();
    const diff = end - now;
    
    if (diff <= 0) return { text: 'Ended', isEnded: true };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours > 24) {
      return { text: `${Math.floor(hours / 24)}d`, isEnded: false };
    }
    if (hours > 0) {
      return { text: `${hours}h ${minutes}m`, isEnded: false };
    }
    return { text: `${minutes}m ${seconds}s`, isEnded: false, isLow: minutes < 5 };
  }, [end_time]);
  
  const categoryColors = {
    skill: 'bg-blue-900 text-blue-200',
    prompt: 'bg-purple-900 text-purple-200',
    dataset: 'bg-orange-900 text-orange-200'
  };
  
  return (
    <Link
      to={`/auction/${auction.id}`}
      className={`auction-card ${status === 'active' ? '' : 'opacity-60'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className={`badge ${categoryColors[listing?.category] || 'bg-slate-700'}`}>
          {listing?.category || 'Unknown'}
        </span>
        {status === 'active' && (
          <div className="live-indicator text-xs text-green-400">
            Live
          </div>
        )}
      </div>
      
      {/* Title */}
      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
        {listing?.title || 'Untitled Listing'}
      </h3>
      
      {/* Description */}
      <p className="text-sm text-slate-400 mb-4 line-clamp-2">
        {listing?.description || 'No description'}
      </p>
      
      {/* Price & Bids */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs text-slate-500">Current Bid</span>
          <div className="text-xl font-bold text-claw-purple">
            ${current_price?.toFixed(2) || '0.00'}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500">Bids</span>
          <div className="text-lg font-semibold text-slate-300">
            {bid_count || 0}
          </div>
        </div>
      </div>
      
      {/* Countdown */}
      <div className={`text-center py-2 rounded-lg ${
        timeRemaining.isLow ? 'bg-red-900/30 text-red-400' :
        timeRemaining.isEnded ? 'bg-slate-700 text-slate-400' :
        'bg-slate-700 text-slate-300'
      }`}>
        <span className="text-sm">{timeRemaining.isEnded ? '🛑' : '⏰'} {timeRemaining.text}</span>
      </div>
    </Link>
  );
}
