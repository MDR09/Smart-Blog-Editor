/**
 * Custom Hook for Auto-Save Functionality
 * 
 * This hook implements an intelligent auto-save mechanism with:
 * - Debouncing to prevent API spam
 * - Error handling with retry logic
 * - Status tracking (idle, saving, error, saved)
 * - Exponential backoff for retries
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { postsAPI } from '../services/api';
import { useDebounce } from './useDebounce';

/**
 * Auto-save hook
 * @param {string} postId - The ID of the post to auto-save
 * @param {Object} content - The content to save (title, content)
 * @param {number} delay - Debounce delay in milliseconds (default: 2000)
 * @returns {Object} - Status and control functions
 */
export function useAutoSave(postId, content, delay = 2000) {
  const [status, setStatus] = useState('idle'); // idle, saving, saved, error
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const retryCount = useRef(0);
  const maxRetries = 3;
  const isMounted = useRef(true);
  const saveQueue = useRef([]);
  const isSaving = useRef(false);

  console.log('🔵 useAutoSave hook state:', { postId, hasContent: !!content, content });

  // Debounce the content
  const debouncedContent = useDebounce(content, delay);

  // Save function with retry logic and exponential backoff
  const saveContent = useCallback(async (contentToSave) => {
    if (!postId || isSaving.current) {
      // Add to queue if already saving
      saveQueue.current.push(contentToSave);
      return;
    }

    // CRITICAL: Validate postId matches to prevent cross-post contamination
    if (contentToSave?.postId && contentToSave.postId !== postId) {
      console.warn('⚠️ PostId mismatch detected! Skipping save to prevent data corruption', {
        contentPostId: contentToSave.postId,
        currentPostId: postId
      });
      return;
    }

    isSaving.current = true;
    setStatus('saving');
    setError(null);
    console.log('💾 Auto-saving post:', postId);

    try {
      // Exponential backoff: 1s, 2s, 4s
      const backoffDelay = Math.pow(2, retryCount.current) * 1000;
      if (retryCount.current > 0) {
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }

      // Remove postId from content before sending to API (it's just for validation)
      const { postId: _, ...contentForAPI } = contentToSave || {};
      
      console.log('🌐 Calling API with data:', { postId, contentToSave: contentForAPI });
      const response = await postsAPI.update(postId, contentForAPI);
      console.log('📡 API response:', response);

      if (isMounted.current) {
        setStatus('saved');
        setLastSaved(new Date());
        retryCount.current = 0; // Reset retry count on success
        console.log('✅ Auto-save successful:', new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('❌ Auto-save error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });

      if (retryCount.current < maxRetries) {
        retryCount.current++;
        if (isMounted.current) {
          setStatus('retrying');
          // Retry
          setTimeout(() => saveContent(contentToSave), 1000);
        }
      } else {
        if (isMounted.current) {
          setStatus('error');
          setError(err.response?.data?.detail || 'Failed to save');
        }
        retryCount.current = 0;
      }
    } finally {
      isSaving.current = false;

      // Process queue
      if (saveQueue.current.length > 0) {
        const nextContent = saveQueue.current.pop();
        saveQueue.current = []; // Clear queue, only save latest
        saveContent(nextContent);
      }
    }
  }, [postId]);

  // Trigger save when debounced content changes
  useEffect(() => {
    if (debouncedContent && postId) {
      console.log('🔄 Debounced content changed, triggering save...');
      saveContent(debouncedContent);
    } else if (!postId) {
      console.warn('⚠️ No postId - auto-save disabled');
    }
  }, [debouncedContent, postId, saveContent]);

  // Clear save queue when postId changes to prevent cross-post contamination
  useEffect(() => {
    saveQueue.current = [];
    console.log('🧹 Cleared save queue for new post:', postId);
  }, [postId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Manual save function (bypasses debounce)
  const saveNow = useCallback(() => {
    if (content && postId) {
      saveContent(content);
    }
  }, [content, postId, saveContent]);

  return {
    status, // 'idle' | 'saving' | 'saved' | 'error' | 'retrying'
    error,
    lastSaved,
    saveNow,
    isSaving: status === 'saving' || status === 'retrying',
  };
}
