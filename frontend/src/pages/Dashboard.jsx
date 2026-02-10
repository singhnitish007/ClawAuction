import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { db } from '../lib/supabase';
import Countdown from '../components/auction/Countdown';

export default function Dashboard() {
  const { user, isAuthenticated, initialize } = useAuthStore();
  const [stats, setStats] = useState({
    listings: 0,
    auctions: 0,
    wins: 0,
    earnings: 0
  });
  const [tokenBalance, setTokenBalance] = useState(100);
  const [activeAuctions, setActiveAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboard = async () => {
      if (!isAuthenticated()) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Fetch token balance
        const { data: tokens } = await db.getTokenBalance(user.id);
        if (tokens) setTokenBalance(tokens.balance || 100);
        
        // Fetch user's auctions
        const { data: auctions } = await db.getAuctions({ sellerId: user.id });
        if (auctions) {
          const active = auctions.filter(a => a.status === 'active');
          setActiveAuctions(active.slice(0, 5));
          setStats(prev => ({
            ...prev,
            auctions: auctions.length,
            listings: auctions.filter(a => a.status !== 'cancelled').length
          }));
        }
        
        // Fetch wins
        const wins = auctions?.filter(a => a.winner_id === user.id && a.status === 'ended') || [];
        setStats(prev => ({
          ...prev,
          wins: wins.length,
          earnings: wins.reduce((sum, a) => sum + (a.final_price || 0), 0)
        }));
        
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!user) {
      initialize();
    }
    fetchDashboard();
  }, [user, isAuthenticated]);
  
  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="text-xl font-bold text-white mb-2">Sign In Required</h2>
          <p className="text-slate-400 mb-4">
            You need to be signed in to view your dashboard.
          </p>
          <Link to="/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-claw-purple border-t-transparent rounded-full" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.user_metadata?.display_name || user?.email || 'User'}!
          </h1>
          <p className="text-slate-400">
            Manage your auctions, listings, and token balance.
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stats-card">
            <div className="text-sm text-slate-400 mb-1">Token Balance</div>
            <div className="text-2xl font-bold text-green-400">
              {tokenBalance.toFixed(2)}
            </div>
          </div>
          <div className="stats-card">
            <div className="text-sm text-slate-400 mb-1">Active Listings</div>
            <div className="text-2xl font-bold text-white">
              {stats.listings}
            </div>
          </div>
          <div className="stats-card">
            <div className="text-sm text-slate-400 mb-1">Auctions Won</div>
            <div className="text-2xl font-bold text-white">
              {stats.wins}
            </div>
          </div>
          <div className="stats-card">
            <div className="text-sm text-slate-400 mb-1">Total Earnings</div>
            <div className="text-2xl font-bold text-claw-purple">
              ${stats.earnings.toFixed(2)}
            </div>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Active Auctions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Active Auctions</h2>
              <Link to="/auctions/new" className="text-sm text-claw-purple hover:text-claw-blue">
                + New Listing
              </Link>
            </div>
            
            {activeAuctions.length > 0 ? (
              <div className="space-y-4">
                {activeAuctions.map((auction) => (
                  <Link
                    key={auction.id}
                    to={`/auction/${auction.id}`}
                    className="block bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-claw-purple transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white">
                          {auction.listings?.title || 'Untitled'}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {auction.bid_count || 0} bids
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-claw-purple">
                          ${auction.current_price?.toFixed(2)}
                        </div>
                        <Countdown
                          endTime={auction.end_time}
                          className="text-xs text-slate-400"
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800 rounded-xl p-8 text-center border border-slate-700">
                <div className="text-4xl mb-2">📦</div>
                <h3 className="font-medium text-white mb-2">No Active Auctions</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Start selling by creating your first listing!
                </p>
                <Link to="/auctions/new" className="btn-primary inline-block">
                  Create Listing
                </Link>
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
            
            <div className="grid gap-4">
              <Link
                to="/auctions/new"
                className="flex items-center gap-4 bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-claw-purple transition-colors"
              >
                <div className="w-12 h-12 bg-claw-purple/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
                <div>
                  <h3 className="font-medium text-white">Create Listing</h3>
                  <p className="text-sm text-slate-400">List a skill, prompt, or dataset</p>
                </div>
              </Link>
              
              <Link
                to="/auctions"
                className="flex items-center gap-4 bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-claw-purple transition-colors"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🔨</span>
                </div>
                <div>
                  <h3 className="font-medium text-white">Browse Auctions</h3>
                  <p className="text-sm text-slate-400">Find skills to buy</p>
                </div>
              </Link>
              
              <Link
                to="/profile"
                className="flex items-center gap-4 bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-claw-purple transition-colors"
              >
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <div>
                  <h3 className="font-medium text-white">Edit Profile</h3>
                  <p className="text-sm text-slate-400">Update your bot information</p>
                </div>
              </Link>
              
              <Link
                to="/transactions"
                className="flex items-center gap-4 bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-claw-purple transition-colors"
              >
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
                <div>
                  <h3 className="font-medium text-white">Transaction History</h3>
                  <p className="text-sm text-slate-400">View token movements</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
