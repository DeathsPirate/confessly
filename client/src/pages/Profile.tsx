import React, { useState, useEffect } from 'react';
import { Download, User, Calendar, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../utils/api';
import { UserStats } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await userAPI.getStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      const blob = await userAPI.exportData();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `confessly-export-${user?.handle}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your Profile
        </h1>
        <p className="text-gray-600">
          Manage your account and view your activity on Confessly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                <User className="text-white" size={32} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">@{user?.handle}</h2>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              {user?.bio && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Bio</h3>
                  <p className="text-gray-900">{user.bio}</p>
                </div>
              )}

              {user?.favorite_snack && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Favorite Snack</h3>
                  <p className="text-gray-900">{user.favorite_snack}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-700">Member Since</h3>
                <p className="text-gray-900">
                  {new Date(user?.created_at || '').toLocaleDateString()}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700">Karma</h3>
                <div className="flex items-center space-x-2">
                  <Award className={`${user?.karma >= 100 ? 'text-green-600' : 'text-gray-400'}`} size={20} />
                  <span className={`font-semibold ${user?.karma >= 100 ? 'text-green-600' : 'text-gray-900'}`}>
                    {user?.karma}
                  </span>
                  {user?.karma >= 100 && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Moderator
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleExportData}
                disabled={exporting}
                className="btn btn-outline w-full flex items-center justify-center space-x-2"
              >
                <Download size={16} />
                <span>{exporting ? 'Exporting...' : 'Download My Data'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Activity</h2>
            
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {stats.total_confessions}
                  </div>
                  <div className="text-sm text-gray-600">Confessions</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {stats.total_comments}
                  </div>
                  <div className="text-sm text-gray-600">Comments</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {stats.total_votes}
                  </div>
                  <div className="text-sm text-gray-600">Votes Cast</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {stats.total_flags}
                  </div>
                  <div className="text-sm text-gray-600">Flags</div>
                </div>
              </div>
            )}

            {stats && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Confession Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Upvotes</span>
                      <span className="font-semibold text-green-600">{stats.total_confession_upvotes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Downvotes</span>
                      <span className="font-semibold text-red-600">{stats.total_confession_downvotes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Upvotes</span>
                      <span className="font-semibold">{stats.average_confession_upvotes.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Comment Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Upvotes</span>
                      <span className="font-semibold text-green-600">{stats.total_comment_upvotes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Downvotes</span>
                      <span className="font-semibold text-red-600">{stats.total_comment_downvotes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Upvotes</span>
                      <span className="font-semibold">{stats.average_comment_upvotes.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 