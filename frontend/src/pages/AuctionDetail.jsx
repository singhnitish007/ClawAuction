import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuctionStore } from '../stores/auctionStore';
import { useAuthStore } from '../stores/authStore';
import BidForm from '../components/auction/BidForm';
import Countdown from '../components/auction/Countdown';

export default function AuctionDetail() {
  const { id } = useParams();
  const { currentAuction, bids, fetchAuction, subscribeToAuction, isLoading } = useAuctionStore();
  const { user, isAuthenticated } = useAuthStore();
  const [newBid, setNewBid] = useState(null);
  
  useEffect(() => {
    fetchAuction(id);
    
    const unsubscribe = subscribeToAuction(id, {
      onBid: (bid) => setNewBid(bid)
    });
    
    return () => unsubscribe();
  }, [id]);
  
  if (isLoading || !currentAuction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-claw-purple border-t-transparent rounded-full" />
      </div>
    );
  }
  
  const { listing, seller, current_price, end_time, status, bid_count } = currentAuction;
  const isOwner = user?.id === seller?.id || user?.id === currentAuction?.seller_id;
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Link */}
        <Link to="/auctions" className="text-slate-400 hover:text-white mb-6 inline-flex items-center gap-2">
          ← Back to Auctions
        </Link>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Auction Details */}
          <div className="lg:col-span-2">
            {/* Status Banner */}
            <div className={`mb-6 p-4 rounded-xl ${
              status === 'active'
                ? 'bg-green-900/20 border border-green-800'
                : 'bg-slate-800 border border-slate-700'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {status === 'active' ? (
                    <span className="flex items-center gap-2 text-green-400">
                      <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                      Live Auction
                    </span>
                  ) : (
                    <span className="text-slate-400">Auction Ended</span>
                  )}
                </div>
                <Countdown
                  endTime={end_time}
                  className="text-lg font-mono"
                  onEnd={() => window.location.reload()}
                />
              </div>
            </div>
            
            {/* Listing Info */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              {/* Category Badge */}
              <div className="p-4 border-b border-slate-700">
                <span className={`badge ${
                  listing?.category === 'skill' ? 'badge-skill' :
                  listing?.category === 'prompt' ? 'badge-prompt' :
                  'badge-dataset'
                }`}>
                  {listing?.category || 'Unknown'}
                </span>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <h1 className="text-2xl font-bold text-white mb-4">
                  {listing?.title || 'Untitled Listing'}
                </h1>
                
                <p className="text-slate-300 mb-6 whitespace-pre-wrap">
                  {listing?.description || 'No description provided.'}
                </p>
                
                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <span className="text-slate-400">Listed by</span>
                    <div className="text-white font-medium">
                      {seller?.username || 'Unknown'}
                    </div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <span className="text-slate-400">Started</span>
                    <div className="text-white font-medium">
                      {formatDate(currentAuction.start_time)}
                    </div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <span className="text-slate-400">Version</span>
                    <div className="text-white font-medium">
                      {listing?.version || '1.0.0'}
                    </div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <span className="text-slate-400">Downloads</span>
                    <div className="text-white font-medium">
                      {listing?.downloads || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bid History */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-white mb-4">
                Bid History ({bid_count || 0})
              </h2>
              
              {bids?.length > 0 ? (
                <div className="space-y-3">
                  {bids.map((bid, index) => (
                    <div
                      key={bid.id}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        index === 0 && status === 'active'
                          ? 'bg-green-900/20 border border-green-800'
                          : 'bg-slate-800 border border-slate-700'
                      } ${newBid?.id === bid.id ? 'animate-bid-flash' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-claw-purple rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold">
                            {bid.users?.username?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {bid.users?.username || 'Unknown'}
                          </div>
                          <div className="text-sm text-slate-400">
                            {new Date(bid.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${
                          index === 0 ? 'text-green-400' : 'text-white'
                        }`}>
                          ${bid.bid_amount?.toFixed(2)}
                        </div>
                        {index === 0 && (
                          <span className="text-xs text-green-400">Highest</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-800 rounded-xl p-8 text-center">
                  <div className="text-4xl mb-2">🏷️</div>
                  <p className="text-slate-400">No bids yet. Be the first!</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - Bidding Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Current Price */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
                <div className="text-sm text-slate-400 mb-1">Current Bid</div>
                <div className="text-4xl font-bold text-claw-purple mb-2">
                  ${current_price?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-slate-400">
                  {bid_count || 0} bids placed
                </div>
              </div>
              
              {/* Bid Form */}
              {status === 'active' && !isOwner && (
                <BidForm
                  auction={currentAuction}
                  onBidPlaced={(bid) => setNewBid(bid)}
                />
              )}
              
              {isOwner && status === 'active' && (
                <div className="bg-slate-700 rounded-lg p-4 text-center">
                  <p className="text-orange-400">⚠️ You cannot bid on your own listing</p>
                </div>
              )}
              
              {status !== 'active' && (
                <div className="bg-slate-700 rounded-lg p-4 text-center">
                  <p className="text-slate-400">This auction has ended</p>
                  {currentAuction.winner_id && (
                    <p className="text-sm text-slate-500 mt-1">
                      Winner: {currentAuction.winner_id}
                    </p>
                  )}
                </div>
              )}
              
              {/* Auction Ends */}
              <div className="mt-6 bg-slate-800 rounded-xl border border-slate-700 p-4">
                <div className="text-sm text-slate-400 mb-1">Auction Ends</div>
                <div className="text-white">
                  {formatDate(end_time)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
