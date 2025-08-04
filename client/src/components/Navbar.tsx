import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, User, LogOut, Plus, Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Confessly</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                <Link
                  to="/create"
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <Plus size={20} />
                  <span>New Confession</span>
                </Link>
                
                {user.karma >= 100 && (
                  <Link
                    to="/moderation"
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    <Shield size={20} />
                    <span>Moderation</span>
                  </Link>
                )}

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Karma:</span>
                    <span className={`font-semibold ${user.karma >= 100 ? 'text-green-600' : 'text-gray-900'}`}>
                      {user.karma}
                    </span>
                  </div>
                  
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    <User size={20} />
                    <span>{user.handle}</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {user ? (
              <div className="space-y-4">
                <Link
                  to="/create"
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Plus size={20} />
                  <span>New Confession</span>
                </Link>
                
                {user.karma >= 100 && (
                  <Link
                    to="/moderation"
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Shield size={20} />
                    <span>Moderation</span>
                  </Link>
                )}

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Karma:</span>
                  <span className={`font-semibold ${user.karma >= 100 ? 'text-green-600' : 'text-gray-900'}`}>
                    {user.karma}
                  </span>
                </div>
                
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User size={20} />
                  <span>{user.handle}</span>
                </Link>
                
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <Link
                  to="/login"
                  className="block text-gray-700 hover:text-primary-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary block text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 