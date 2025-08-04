import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import { confessionsAPI } from '../utils/api';

const CreateConfession: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    content: '',
    mood: '',
    location: '',
    tagged_users: '',
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const moods = ['Happy', 'Sad', 'Excited', 'Guilty', 'Regretful', 'Annoyed', 'Embarrassed', 'Proud'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size must be less than 5MB');
        return;
      }

      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.content.trim()) {
      setError('Confession content is required');
      return;
    }

    if (formData.content.length > 500) {
      setError('Confession content must be 500 characters or less');
      return;
    }

    setLoading(true);

    try {
      await confessionsAPI.createConfession({
        content: formData.content,
        mood: formData.mood || undefined,
        location: formData.location || undefined,
        tagged_users: formData.tagged_users || undefined,
        image: image || undefined,
      });

      navigate('/');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create confession. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Share Your Confession
        </h1>
        <p className="text-gray-600">
          Share your thoughts anonymously. Your confession will be visible to the community.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Your Confession *
            </label>
            <textarea
              id="content"
              name="content"
              rows={6}
              required
              value={formData.content}
              onChange={handleChange}
              className="textarea"
              placeholder="Share what's on your mind... (max 500 characters)"
              maxLength={500}
            />
            <div className="mt-1 text-sm text-gray-500 text-right">
              {formData.content.length}/500
            </div>
          </div>

          {/* Mood */}
          <div>
            <label htmlFor="mood" className="block text-sm font-medium text-gray-700 mb-2">
              How are you feeling? (optional)
            </label>
            <select
              id="mood"
              name="mood"
              value={formData.mood}
              onChange={handleChange}
              className="input"
            >
              <option value="">Select a mood...</option>
              {moods.map((mood) => (
                <option key={mood} value={mood}>
                  {mood}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location (optional)
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="input"
              placeholder="Where did this happen?"
              maxLength={100}
            />
          </div>

          {/* Tagged Users */}
          <div>
            <label htmlFor="tagged_users" className="block text-sm font-medium text-gray-700 mb-2">
              Tag Users (optional)
            </label>
            <input
              type="text"
              id="tagged_users"
              name="tagged_users"
              value={formData.tagged_users}
              onChange={handleChange}
              className="input"
              placeholder="@username1 @username2"
              maxLength={200}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Image (optional)
            </label>
            
            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">
                  <label htmlFor="image" className="cursor-pointer">
                    <span className="text-primary-600 hover:text-primary-500 font-medium">
                      Upload an image
                    </span>
                    <span className="text-gray-500"> or drag and drop</span>
                  </label>
                  <input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-outline flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.content.trim()}
              className="btn btn-primary flex-1 disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Post Confession'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateConfession; 