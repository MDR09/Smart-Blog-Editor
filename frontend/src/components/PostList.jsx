/**
 * PostList Component
 * Displays list of drafts and published posts
 */
import { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle,
  Search,
  Filter
} from 'lucide-react';
import { formatDistanceToNow } from '../utils/dateUtils';

export default function PostList({ onPostSelect }) {
  const { posts, fetchPosts, createPost, deletePost, setCurrentPost, fetchPostById, currentPost } = useStore();
  const [filter, setFilter] = useState('all'); // all, draft, published
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Update time every minute to refresh "X ago" timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, []);

  const handleNewPost = async () => {
    const newPost = await createPost();
    if (newPost && onPostSelect) {
      onPostSelect(newPost);
    }
  };

  const handleDeletePost = async (postId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this post?')) {
      await deletePost(postId);
    }
  };

  const handlePostClick = async (post) => {
    // Fetch fresh post data from server to ensure we get the latest auto-saved content
    try {
      console.log('🔍 Fetching fresh post data for:', post.id);
      const freshPost = await fetchPostById(post.id);
      if (freshPost) {
        setCurrentPost(freshPost);
        if (onPostSelect) {
          onPostSelect(freshPost);
        }
      }
    } catch (error) {
      console.error('Failed to fetch post:', error);
      // Fallback to cached post
      setCurrentPost(post);
      if (onPostSelect) {
        onPostSelect(post);
      }
    }
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesFilter = filter === 'all' || post.status === filter;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={handleNewPost}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          New Post
        </button>
      </div>

      {/* Search and Filter */}
      <div className="p-4 space-y-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              filter === 'draft'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Drafts
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              filter === 'published'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Published
          </button>
        </div>
      </div>

      {/* Posts List */}
      <div className="flex-1 overflow-y-auto">
        {filteredPosts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No posts found</p>
            <p className="text-xs mt-1">Create your first post to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => handlePostClick(post)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  currentPost?.id === post.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {post.title || 'Untitled'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {post.status === 'published' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded">
                          <CheckCircle size={12} />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          <Clock size={12} />
                          Draft
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(post.updated_at, currentTime)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeletePost(post.id, e)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete post"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
