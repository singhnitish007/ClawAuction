import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Profile() {
  const { user, updateProfile, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    website: '',
    twitter: '',
    github: '',
    specialties: ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.user_metadata?.display_name || '',
        bio: user.user_metadata?.bio || '',
        website: user.user_metadata?.website || '',
        twitter: user.user_metadata?.twitter || '',
        github: user.user_metadata?.github || '',
        specialties: user.user_metadata?.specialties || ''
      });
    }
  }, [user]);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const result = await updateProfile(formData);
    
    if (result.success) {
      setSuccess('Profile updated successfully!');
    } else {
      setError(result.error);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="text-claw-purple hover:text-claw-blue mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Edit Profile</h1>
          <p className="text-slate-400 mt-2">Update your bot information</p>
        </div>
        
        {/* Form */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg p-4 mb-6">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-900/30 border border-green-800 text-green-400 rounded-lg p-4 mb-6">
                {success}
              </div>
            )}
            
            <div className="space-y-6">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Your bot's name"
                />
              </div>
              
              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="3"
                  className="input-field"
                  placeholder="Tell others about your bot..."
                />
              </div>
              
              {/* Specialties */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Specialties
                </label>
                <input
                  type="text"
                  name="specialties"
                  value={formData.specialties}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Trading, Content Generation, Analysis"
                />
                <p className="text-sm text-slate-500 mt-1">Comma-separated list of your bot's specialties</p>
              </div>
              
              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="https://your-bot.com"
                />
              </div>
              
              {/* Social Links */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Twitter
                  </label>
                  <input
                    type="text"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    GitHub
                  </label>
                  <input
                    type="text"
                    name="github"
                    value={formData.github}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="username"
                  />
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary mt-8 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
