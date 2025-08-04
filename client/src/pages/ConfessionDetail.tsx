import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, ThumbsDown, Flag, Clock, MapPin, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { confessionsAPI, commentsAPI, moderationAPI } from '../utils/api';
import { Confession, Comment } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const ConfessionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [confession, setConfession] = useState<Confession | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [flagging, setFlagging] = useState(false);

  useEffect(() => {
    if (id) {
      loadConfession();
      loadComments();
    }
  }, [id]);

  const loadConfession = async () => {
    try {
      const response = await confessionsAPI.getConfession(parseInt(id!));
      setConfession(response.confession);
    } catch (error) {
      console.error('Error loading confession:', error);
    }
  };

  const loadComments = async () => {
    try {
      const response = await commentsAPI.getComments(parseInt(id!));
      setComments(response.comments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!user) return;

    try {
      await confessionsAPI.voteConfession(parseInt(id!), { vote_type: voteType });
      loadConfession();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleCommentVote = async (commentId: number, voteType: 'upvote' | 'downvote') => {
    if (!user) return;

    try {
      await commentsAPI.voteComment(commentId, { vote_type: voteType });
      loadComments();
    } catch (error) {
      console.error('Error voting on comment:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentContent.trim()) return;

    try {
      setSubmittingComment(true);
      await commentsAPI.createComment(parseInt(id!), commentContent);
      setCommentContent('');
      loadComments();
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleFlag = async () => {
    if (!user || flagging) return;

    try {
      setFlagging(true);
      await moderationAPI.flagContent({
        content_type: 'confession',
        content_id: parseInt(id!),
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!confession) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">Confession not found.</p>
          <Link to="/" className="btn btn-primary mt-4">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} />
          <span>Back to Confessions</span>
        </Link>
      </div>

      {/* Confession */}
      <div className="card mb-6">
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

        <div className="mb-4">
          <p className="text-gray-900 text-lg leading-relaxed mb-3">
            {confession.content}
          </p>
          
          {confession.image_url && (
            <img
              src={confession.image_url}
              alt="Confession attachment"
              className="w-full h-64 object-cover rounded-lg mb-3"
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
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleVote('upvote')}
                disabled={!user}
                className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors disabled:opacity-50"
              >
                <ThumbsUp size={18} />
                <span className="text-sm font-medium">{confession.upvotes}</span>
              </button>
              
              <button
                onClick={() => handleVote('downvote')}
                disabled={!user}
                className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                <ThumbsDown size={18} />
                <span className="text-sm font-medium">{confession.downvotes}</span>
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            by {confession.user_handle}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Comments ({comments.length})
        </h2>

        {/* Add Comment */}
        {user && (
          <form onSubmit={handleSubmitComment} className="mb-6">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="textarea mb-3"
              maxLength={300}
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {commentContent.length}/300
              </span>
              <button
                type="submit"
                disabled={!commentContent.trim() || submittingComment}
                className="btn btn-primary disabled:opacity-50"
              >
                {submittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>Anonymous</span>
                    <span>•</span>
                    <span>{formatDate(comment.created_at)}</span>
                  </div>
                </div>
                
                <p className="text-gray-900 mb-3">{comment.content}</p>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCommentVote(comment.id, 'upvote')}
                      disabled={!user}
                      className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors disabled:opacity-50"
                    >
                      <ThumbsUp size={16} />
                      <span className="text-sm">{comment.upvotes}</span>
                    </button>
                    
                    <button
                      onClick={() => handleCommentVote(comment.id, 'downvote')}
                      disabled={!user}
                      className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      <ThumbsDown size={16} />
                      <span className="text-sm">{comment.downvotes}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
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
    </div>
  );
};

export default ConfessionDetail; 