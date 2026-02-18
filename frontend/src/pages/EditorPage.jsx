/**
 * Editor Page - Main Dashboard
 * Contains PostList, Editor, and controls
 */
import { useState, useEffect, useCallback } from 'react';
import useStore from '../store/useStore';
import PostList from '../components/PostList';
import Editor from '../components/Editor/Editor';
import AIAssistant from '../components/AIAssistant';
import { useAutoSave } from '../hooks/useAutoSave';
import {
  Menu,
  X,
  Save,
  Upload,
  LogOut,
  User,
  CheckCircle,
  Loader2,
  Eye
} from 'lucide-react';

export default function EditorPage() {
  const { 
    currentPost, 
    updateCurrentPost, 
    publishPost, 
    logout, 
    user,
    sidebarOpen,
    toggleSidebar
  } = useStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState(null);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [contentModified, setContentModified] = useState(false);

  // Auto-save hook - Only save if content has been modified by user
  const autoSave = useAutoSave(
    currentPost?.id,
    contentModified && currentPost ? { 
      postId: currentPost.id, // Include postId for validation
      title: currentPost.title || '', 
      content: currentPost.content 
    } : null,
    2000
  );

  // Update local state when current post changes AND reset content to match currentPost
  useEffect(() => {
    if (currentPost) {
      console.log('📋 EditorPage: updating local state from currentPost', {
        postId: currentPost.id,
        title: currentPost.title,
        hasContent: !!currentPost.content,
        content: currentPost.content
      });
      setTitle(currentPost.title || '');
      setContent(currentPost.content || null);
      // Reset modified flag when loading a new post
      setContentModified(false);
    } else {
      // Reset state when no post is selected
      setTitle('');
      setContent(null);
      setContentModified(false);
    }
  }, [currentPost?.id]);

  // Handle title change
  const handleTitleChange = useCallback((e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    updateCurrentPost({ title: newTitle });
    setContentModified(true); // Mark as modified
  }, [updateCurrentPost]);

  // Handle content change from editor
  const handleContentChange = useCallback((newContent) => {
    console.log('📄 Editor content changed:', { hasContent: !!newContent });
    setContent(newContent);
    updateCurrentPost({ content: newContent });
    setContentModified(true); // Mark as modified
  }, [updateCurrentPost]);

  // Handle publish
  const handlePublish = async () => {
    if (!currentPost) return;
    
    const result = await publishPost(currentPost.id);
    if (result.success) {
      setShowPublishSuccess(true);
      setTimeout(() => setShowPublishSuccess(false), 3000);
    }
  };

  const getSaveStatusText = () => {
    switch (autoSave.status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'All changes saved';
      case 'error':
        return `Error: ${autoSave.error}`;
      case 'retrying':
        return 'Retrying...';
      default:
        return '';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            Smart Blog Editor
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Auto-save status */}
          {currentPost && (
            <div className="flex items-center gap-2 text-sm">
              {autoSave.isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin text-primary-600" />
                  <span className="text-gray-600">{getSaveStatusText()}</span>
                </>
              ) : autoSave.status === 'saved' ? (
                <>
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-gray-600">{getSaveStatusText()}</span>
                </>
              ) : autoSave.status === 'error' ? (
                <span className="text-red-600">{getSaveStatusText()}</span>
              ) : null}
            </div>
          )}

          {/* Publish button */}
          {currentPost && currentPost.status === 'draft' && (
            <button
              onClick={handlePublish}
              className="btn-primary flex items-center gap-2"
            >
              <Upload size={18} />
              Publish
            </button>
          )}

          {/* Publish success message */}
          {showPublishSuccess && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg">
              <CheckCircle size={18} />
              <span className="text-sm font-medium">Published successfully!</span>
            </div>
          )}

          {/* User menu */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
            <User size={18} className="text-gray-600" />
            <span className="text-sm text-gray-700">{user?.email}</span>
            <button
              onClick={logout}
              className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
              title="Logout"
            >
              <LogOut size={16} className="text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Post List */}
        {sidebarOpen && (
          <aside className="w-80 flex-shrink-0">
            <PostList onPostSelect={() => {}} />
          </aside>
        )}

        {/* Editor Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {currentPost ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Title Input */}
              <div className="px-8 pt-8 pb-4 bg-white border-b border-gray-200">
                <input
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Post title..."
                  className="w-full text-4xl font-bold outline-none placeholder-gray-300"
                />
                {currentPost.status === 'published' && (
                  <div className="flex items-center gap-2 mt-3 text-green-700">
                    <Eye size={16} />
                    <span className="text-sm font-medium">Published</span>
                  </div>
                )}
              </div>

              {/* Editor with AI Assistant */}
              <div className="flex-1 overflow-y-auto p-8">
                <Editor
                  key={currentPost.id}
                  postId={currentPost.id}
                  initialContent={currentPost.content}
                  onContentChange={handleContentChange}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Save size={64} className="mx-auto mb-4 text-gray-300" />
                <h2 className="text-2xl font-semibold mb-2">No post selected</h2>
                <p className="text-gray-400">
                  Select a post from the sidebar or create a new one to start writing
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
