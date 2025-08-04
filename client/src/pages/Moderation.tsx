import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { moderationAPI } from '../utils/api';
import { Flag, ModerationStats } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const Moderation: React.FC = () => {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'resolved' | 'dismissed' | ''>('');
  const [contentTypeFilter, setContentTypeFilter] = useState<'confession' | 'comment' | ''>('');

  useEffect(() => {
    loadFlags();
    loadStats();
  }, [currentPage, statusFilter, contentTypeFilter]);

  const loadFlags = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10,
      };

      if (statusFilter) params.status = statusFilter;
      if (contentTypeFilter) params.content_type = contentTypeFilter;

      const response = await moderationAPI.getFlags(params);
      setFlags(response.flags);
      setHasNext(response.pagination.hasNext);
      setHasPrev(response.pagination.hasPrev);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Error loading flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await moderationAPI.getStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleResolveFlag = async (flagId: number, action: 'delete' | 'dismiss') => {
    try {
      await moderationAPI.resolveFlag(flagId, action);
      loadFlags();
      loadStats();
    } catch (error) {
      console.error('Error resolving flag:', error);
      alert('Failed to resolve flag. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-500" size={16} />;
      case 'resolved':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'dismissed':
        return <XCircle className="text-gray-500" size={16} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && flags.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Shield className="text-primary-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-900">
            Moderation Dashboard
          </h1>
        </div>
        <p className="text-gray-600">
          Review and manage flagged content to keep the community safe.
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total_flags}</div>
            <div className="text-sm text-gray-600">Total Flags</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending_flags}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-green-600">{stats.resolved_flags}</div>
            <div className="text-sm text-gray-600">Resolved</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.dismissed_flags}</div>
            <div className="text-sm text-gray-600">Dismissed</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.confession_flags}</div>
            <div className="text-sm text-gray-600">Confessions</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.comment_flags}</div>
            <div className="text-sm text-gray-600">Comments</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="input"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
            <select
              value={contentTypeFilter}
              onChange={(e) => {
                setContentTypeFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="input"
            >
              <option value="">All Types</option>
              <option value="confession">Confessions</option>
              <option value="comment">Comments</option>
            </select>
          </div>
        </div>
      </div>

      {/* Flags List */}
      <div className="space-y-4">
        {flags.length === 0 ? (
          <div className="card text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">
              No flagged content found matching your filters.
            </p>
          </div>
        ) : (
          flags.map((flag) => (
            <div key={flag.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(flag.status)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(flag.status)}`}>
                    {flag.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {flag.content_type}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(flag.created_at)}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">Flagged by:</span>
                  <span className="text-sm text-gray-900">@{flag.flagged_by}</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">Reason:</span>
                  <span className="text-sm text-gray-900">{flag.reason}</span>
                </div>
                {flag.content_text && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Content:</span>
                    <p className="text-sm text-gray-900 mt-1">{flag.content_text}</p>
                  </div>
                )}
              </div>

              {flag.status === 'pending' && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleResolveFlag(flag.id, 'delete')}
                    className="btn btn-primary flex-1"
                  >
                    Delete Content
                  </button>
                  <button
                    onClick={() => handleResolveFlag(flag.id, 'dismiss')}
                    className="btn btn-outline flex-1"
                  >
                    Dismiss Flag
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 mt-8">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={!hasPrev}
            className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!hasNext}
            className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Moderation; 