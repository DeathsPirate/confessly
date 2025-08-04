import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, MessageCircle, Flag, Clock, MapPin, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { confessionsAPI, moderationAPI } from '../utils/api';
import { Confession } from '../types';

interface ConfessionCardProps {
  confession: Confession;
  onUpdate?: () => void;
}

const ConfessionCard: React.FC<ConfessionCardProps> = ({ confession, onUpdate }) => {
  const { user } = useAuth();
  const [upvotes, setUpvotes] = useState(confession.upvotes);
  const [downvotes, setDownvotes] = useState(confession.downvotes);
  const [voting, setVoting] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [flagging, setFlagging] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!user || voting) return;

    try {
      setVoting(true);
      await confessionsAPI.voteConfession(confession.id, { vote_type: voteType });
      
      if (voteType === 'upvote') {
        setUpvotes(upvotes + 1);
      } else {
        setDownvotes(downvotes + 1);
      }
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVoting(false);
    }
  };

  const handleFlag = async () => {
    if (!user || flagging) return;

    try {
      setFlagging(true);
      await moderationAPI.flagContent({
        content_type: 'confession',
        content_id: confession.id,
        reason: flagReason,
      });
      
      setShowFlagModal(false);
      setFlagReason('');
      alert('Content flagged successfully');
    } catch (error) {
      console.error('Error flagging content:', error);
      alert('Failed to flag content');
    } finally {
      setFlagging(false);
    }
  };

  return (
    <>
      <div className="card hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock size={16} />
            <span>{formatDate(confession.created_at)}</span>
          </div>
          
          {user && (
            <button
              onClick={() => setShowFlagModal(true)}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Flag this content"
            >
              <Flag size={16} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-gray-900 text-lg leading-relaxed mb-3">
            {confession.content}
          </p>
          
          {confession.image_url && (
            <img
              src={confession.image_url}
              alt="Confession attachment"
              className="w-full h-48 object-cover rounded-lg mb-3"
              crossOrigin="anonymous"
            />
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2 mb-4">
          {confession.mood && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {confession.mood}
            </span>
          )}
          
          {confession.location && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <MapPin size={12} className="mr-1" />
              {confession.location}
            </span>
          )}
          
          {confession.tagged_users && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              <Tag size={12} className="mr-1" />
              {confession.tagged_users}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Voting */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleVote('upvote')}
                disabled={!user || voting}
                className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors disabled:opacity-50"
              >
                <ThumbsUp size={18} />
                <span className="text-sm font-medium">{upvotes}</span>
              </button>
              
              <button
                onClick={() => handleVote('downvote')}
                disabled={!user || voting}
                className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                <ThumbsDown size={18} />
                <span className="text-sm font-medium">{downvotes}</span>
              </button>
            </div>

            {/* Comments */}
            <Link
              to={`/confession/${confession.id}`}
              className="flex items-center space-x-1 text-gray-500 hover:text-primary-600 transition-colors"
            >
              <MessageCircle size={18} />
              <span className="text-sm">Comments</span>
            </Link>
          </div>

          {/* Author (Anonymous) */}
          <div className="text-sm text-gray-500">
            by {confession.user_handle}
          </div>
        </div>
      </div>

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Flag Content</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for flagging this content:
            </p>
            
            <select
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              className="input mb-4"
            >
              <option value="">Select a reason...</option>
              <option value="Inappropriate content">Inappropriate content</option>
              <option value="Harassment or bullying">Harassment or bullying</option>
              <option value="Spam or misleading">Spam or misleading</option>
              <option value="Violence or threats">Violence or threats</option>
              <option value="Other">Other</option>
            </select>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowFlagModal(false)}
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleFlag}
                disabled={!flagReason || flagging}
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                {flagging ? 'Flagging...' : 'Flag Content'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConfessionCard; 