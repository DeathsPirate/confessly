import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { confessionsAPI } from '../utils/api';
import { Confession } from '../types';
import ConfessionCard from '../components/ConfessionCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Home: React.FC = () => {
  const { user } = useAuth();
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [moodFilter, setMoodFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [totalPages, setTotalPages] = useState(0);

  const moods = ['Happy', 'Sad', 'Excited', 'Guilty', 'Regretful', 'Annoyed', 'Embarrassed', 'Proud'];

  useEffect(() => {
    loadConfessions();
  }, [currentPage, searchTerm, moodFilter, locationFilter]);

  const loadConfessions = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10,
      };

      if (searchTerm) params.search = searchTerm;
      if (moodFilter) params.mood = moodFilter;
      if (locationFilter) params.location = locationFilter;

      const response = await confessionsAPI.getConfessions(params);
      setConfessions(response.confessions);
      setHasNext(response.pagination.hasNext);
      setHasPrev(response.pagination.hasPrev);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Error loading confessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setMoodFilter('');
    setLocationFilter('');
    setCurrentPage(1);
  };

  const nextPage = () => {
    if (hasNext) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (hasPrev) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading && confessions.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Confessly
        </h1>
        <p className="text-gray-600">
          Share your thoughts anonymously and connect with others through honest confessions.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search confessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={moodFilter}
                onChange={(e) => setMoodFilter(e.target.value)}
                className="input"
              >
                <option value="">All Moods</option>
                {moods.map((mood) => (
                  <option key={mood} value={mood}>
                    {mood}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="text"
              placeholder="Filter by location..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="input"
            />

            <button
              type="button"
              onClick={clearFilters}
              className="btn btn-outline"
            >
              Clear Filters
            </button>
          </div>
        </form>
      </div>

      {/* Create Confession Button */}
      {user && (
        <div className="mb-6">
          <Link to="/create" className="btn btn-primary inline-flex items-center space-x-2">
            <Plus size={20} />
            <span>Share Your Confession</span>
          </Link>
        </div>
      )}

      {/* Confessions Feed */}
      <div className="space-y-6">
        {confessions.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 text-lg">
              {searchTerm || moodFilter || locationFilter
                ? 'No confessions found matching your filters.'
                : 'No confessions yet. Be the first to share!'}
            </p>
            {user && (
              <Link to="/create" className="btn btn-primary mt-4 inline-flex items-center space-x-2">
                <Plus size={20} />
                <span>Create First Confession</span>
              </Link>
            )}
          </div>
        ) : (
          confessions.map((confession) => (
            <ConfessionCard key={confession.id} confession={confession} />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 mt-8">
          <button
            onClick={prevPage}
            disabled={!hasPrev}
            className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={nextPage}
            disabled={!hasNext}
            className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Loading indicator for pagination */}
      {loading && confessions.length > 0 && (
        <div className="flex justify-center mt-6">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

export default Home; 