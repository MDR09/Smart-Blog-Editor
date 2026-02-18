/**
 * Auto-Save Plugin for Lexical Editor
 * 
 * Monitors editor state changes and triggers auto-save after debounce delay
 * Implements efficient debouncing to prevent API spam
 */
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef } from 'react';
import { $generateHtmlFromNodes } from '@lexical/html';
import { debounce } from '../../../utils/debounce';

export default function AutoSavePlugin({ postId, onContentChange }) {
  const [editor] = useLexicalComposerContext();
  const lastSavedState = useRef(null);
  const postIdRef = useRef(postId);
  const onContentChangeRef = useRef(onContentChange);
  
  // Keep refs updated with latest values
  useEffect(() => {
    postIdRef.current = postId;
    onContentChangeRef.current = onContentChange;
  });
  
  // Create stable debounced function that uses refs
  const debouncedSaveRef = useRef(
    debounce((editorState) => {
      console.log('⏱️ Debounced function called!', { 
        hasEditorState: !!editorState,
        editorStateType: typeof editorState 
      });
      
      // Don't save if state hasn't changed
      if (lastSavedState.current === editorState) {
        console.log('⏭️ Skipping save - state unchanged');
        return;
      }

      // Generate HTML and JSON from the editorState parameter
      let htmlString = '';
      let jsonState = null;
      
      // Use the editorState.read() to safely extract content
      editorState.read(() => {
        htmlString = $generateHtmlFromNodes(editor, null);
      });
      
      // Get JSON state directly from the editorState parameter
      jsonState = editorState.toJSON();

      console.log('📝 Lexical state to save:', {
        hasRoot: !!jsonState.root,
        rootKeys: jsonState.root ? Object.keys(jsonState.root) : [],
        rootChildren: jsonState.root?.children?.length || 0,
        fullState: jsonState
      });

      // Save both formats
      const content = {
        lexical: jsonState,
        html: htmlString
      };

      console.log('💾 AutoSavePlugin: Calling onContentChange with content');
      if (onContentChangeRef.current) {
        onContentChangeRef.current(content);
      }
      lastSavedState.current = editorState;
    }, 2000)
  );

  // Register update listener
  useEffect(() => {
    console.log('🔌 AutoSavePlugin mounted/updated:', { 
      postId, 
      hasOnContentChange: !!onContentChange,
      editorReady: !!editor 
    });
    
    if (!postId || !onContentChange) {
      console.log('⚠️ AutoSavePlugin: missing dependencies, not registering listener');
      return;
    }
    
    console.log('✅ AutoSavePlugin: registering update listener');

    // Listen to editor updates
    const removeUpdateListener = editor.registerUpdateListener(
      ({ editorState }) => {
        console.log('🔔 Editor update detected! Calling debounced save...');
        if (debouncedSaveRef.current) {
          debouncedSaveRef.current(editorState);
        }
      }
    );

    // Cleanup
    return () => {
      console.log('🧹 AutoSavePlugin: cleaning up update listener');
      removeUpdateListener();
      // Cancel any pending saves when unmounting
      if (debouncedSaveRef.current) {
        debouncedSaveRef.current.cancel();
      }
    };
  }, [editor, postId, onContentChange]);

  return null;
}
