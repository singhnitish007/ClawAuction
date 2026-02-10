import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuctionStore } from '../stores/auctionStore';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

export default function CreateListing() {
  const navigate = useNavigate();
  const { createListing, isLoading } = useAuctionStore();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'skill',
    startingPrice: '',
    duration: '7',
    listingType: 'auction'
  });
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Check authentication with timeout
    if (!isAuthenticated()) {
      setError('Please sign in to create a listing');
      return;
    }
    
    // Get fresh user ID
    const userId = user?.id;
    if (!userId) {
      // Try to refresh auth
      try {
        const { data: { user: freshUser } } = await supabase.auth.getUser();
        if (!freshUser?.id) {
          setError('Session expired. Please sign in again.');
          return;
        }
      } catch (err) {
        setError('Please sign in again to continue.');
        return;
      }
    }
    
    if (!formData.title || !formData.description || !formData.startingPrice) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Get user ID (either from store or fresh from auth)
    const sellerId = user?.id;
    if (!sellerId) {
      setError('Unable to get user ID. Please sign in again.');
      return;
    }
    
    const result = await createListing({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      starting_price: parseFloat(formData.startingPrice),
      duration_days: parseInt(formData.duration),
      seller_id: sellerId,
      status: 'active',
      listing_type: formData.listingType
    });
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };
  
  // Show loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center text-slate-400">
          Loading...
        </div>
      </div>
    );
  }
  
  // Show login required
  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-slate-900 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Link to="/dashboard" className="text-claw-purple hover:text-claw-blue mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-white">Create New Listing</h1>
            <p className="text-slate-400 mt-2">List your skill, prompt, or dataset for auction</p>
          </div>
          
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 text-center">
            <p className="text-slate-400 mb-4">Please sign in to create a listing</p>
            <Link to="/login" className="btn-primary inline-block">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="text-claw-purple hover:text-claw-blue mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Create New Listing</h1>
          <p className="text-slate-400 mt-2">List your skill, prompt, or dataset for auction</p>
        </div>
        
        {/* Form */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg p-4 mb-6">
                {error}
              </div>
            )}
            
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Advanced Trading Bot v2.0"
                  required
                />
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="input-field"
                  placeholder="Describe your skill, prompt, or dataset in detail..."
                  required
                />
              </div>
              
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="skill">Skill</option>
                  <option value="prompt">Prompt</option>
                  <option value="dataset">Dataset</option>
                  <option value="tool">Tool</option>
                  <option value="template">Template</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              {/* Listing Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Listing Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`cursor-pointer border rounded-xl p-4 text-center transition ${
                    formData.listingType === 'auction' 
                      ? 'border-claw-purple bg-claw-purple/10' 
                      : 'border-slate-700 hover:border-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="listingType"
                      value="auction"
                      checked={formData.listingType === 'auction'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="text-lg font-medium text-white">Auction</span>
                    <p className="text-sm text-slate-400 mt-1">Competitive bidding</p>
                  </label>
                  <label className={`cursor-pointer border rounded-xl p-4 text-center transition ${
                    formData.listingType === 'fixed' 
                      ? 'border-claw-purple bg-claw-purple/10' 
                      : 'border-slate-700 hover:border-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="listingType"
                      value="fixed"
                      checked={formData.listingType === 'fixed'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="text-lg font-medium text-white">Fixed Price</span>
                    <p className="text-sm text-slate-400 mt-1">Direct purchase</p>
                  </label>
                </div>
              </div>
              
              {/* Starting Price */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Starting Price (CLAW) *
                </label>
                <input
                  type="number"
                  name="startingPrice"
                  value={formData.startingPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="input-field"
                  placeholder="100"
                  required
                />
                <p className="text-sm text-slate-500 mt-1">Minimum 1 CLAW token</p>
              </div>
              
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Auction Duration
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="1">1 Day</option>
                  <option value="3">3 Days</option>
                  <option value="7">7 Days</option>
                  <option value="14">14 Days</option>
                  <option value="30">30 Days</option>
                </select>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary mt-8 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Listing'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
