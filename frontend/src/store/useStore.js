/**
 * Zustand Store - Global State Management
 * 
 * This store manages:
 * - User authentication state
 * - Posts list (drafts and published)
 * - Current editing post
 * - Loading states
 * - UI state
 */
import { create } from 'zustand';
import { postsAPI, authAPI } from '../services/api';
import { authService } from '../services/auth';

const useStore = create((set, get) => ({
  // ============ Auth State ============
  user: authService.getUser(),
  isAuthenticated: authService.isAuthenticated(),

  // ============ Posts State ============
  posts: [],
  currentPost: null,
  isLoading: false,
  error: null,

  // ============ UI State ============
  sidebarOpen: true,

  // ============ Auth Actions ============
  
  login: async (credentials) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authAPI.login(credentials);
      
      authService.setToken(response.access_token);
      
      // In a real app, you'd decode the JWT to get user info
      // For now, we'll store basic info
      const user = { email: credentials.email };
      authService.setUser(user);
      
      set({ 
        isAuthenticated: true, 
        user,
        isLoading: false 
      });
      
      return { success: true };
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Login failed',
        isLoading: false 
      });
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  },

  register: async (userData) => {
    try {
      set({ isLoading: true, error: null });
      const user = await authAPI.register(userData);
      
      // Auto-login after registration
      const loginResult = await get().login({
        email: userData.email,
        password: userData.password
      });
      
      return loginResult;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Registration failed',
        isLoading: false 
      });
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      };
    }
  },

  logout: () => {
    authService.logout();
    set({ 
      user: null, 
      isAuthenticated: false,
      posts: [],
      currentPost: null
    });
  },

  // ============ Posts Actions ============

  fetchPosts: async (status = null) => {
    try {
      set({ isLoading: true, error: null });
      const posts = await postsAPI.getAll(status);
      set({ posts, isLoading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch posts',
        isLoading: false 
      });
    }
  },

  createPost: async (postData = {}) => {
    try {
      set({ isLoading: true, error: null });
      const newPost = await postsAPI.create({
        title: postData.title || 'Untitled',
        content: postData.content || {
          lexical: {},
          html: ''
        }
      });
      
      set((state) => ({
        posts: [newPost, ...state.posts],
        currentPost: newPost,
        isLoading: false
      }));
      
      return newPost;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to create post',
        isLoading: false 
      });
      return null;
    }
  },

  fetchPostById: async (postId) => {
    try {
      console.log('🔎 Fetching post by ID from API:', postId);
      const post = await postsAPI.getById(postId);
      console.log('✅ Post fetched successfully:', { postId: post.id, hasContent: !!post.content });
      
      // Update in posts list if it exists
      set((state) => ({
        posts: state.posts.map(p => p.id === post.id ? post : p)
      }));
      
      return post;
    } catch (error) {
      console.error('❌ Failed to fetch post:', error);
      return null;
    }
  },

  setCurrentPost: (post) => {
    console.log('📌 setCurrentPost called with:', { 
      postId: post?.id, 
      title: post?.title,
      hasContent: !!post?.content,
      contentPreview: post?.content
    });
    set({ currentPost: post });
  },

  updateCurrentPost: (updates) => {
    set((state) => {
      if (!state.currentPost) {
        console.warn('⚠️ updateCurrentPost called but no currentPost exists');
        return state;
      }
      
      const updatedPost = { ...state.currentPost, ...updates };
      console.log('🔄 Zustand: updateCurrentPost', { postId: updatedPost.id, updates });
      
      // Also update in posts list
      const updatedPosts = state.posts.map(post =>
        post.id === updatedPost.id ? updatedPost : post
      );
      
      return {
        currentPost: updatedPost,
        posts: updatedPosts
      };
    });
  },

  publishPost: async (postId) => {
    try {
      set({ isLoading: true, error: null });
      const publishedPost = await postsAPI.publish(postId);
      
      set((state) => ({
        currentPost: state.currentPost?.id === postId ? publishedPost : state.currentPost,
        posts: state.posts.map(post =>
          post.id === postId ? publishedPost : post
        ),
        isLoading: false
      }));
      
      return { success: true };
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to publish post',
        isLoading: false 
      });
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to publish post' 
      };
    }
  },

  deletePost: async (postId) => {
    try {
      set({ isLoading: true, error: null });
      await postsAPI.delete(postId);
      
      set((state) => ({
        posts: state.posts.filter(post => post.id !== postId),
        currentPost: state.currentPost?.id === postId ? null : state.currentPost,
        isLoading: false
      }));
      
      return { success: true };
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to delete post',
        isLoading: false 
      });
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to delete post' 
      };
    }
  },

  // ============ UI Actions ============

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useStore;
