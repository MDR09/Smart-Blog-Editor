/**
 * Lexical Editor Component
 * 
 * A rich text editor built with Lexical framework
 * Features: Bold, Italic, Headings, Lists, Auto-save
 */
import { useEffect, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import AutoSavePlugin from './plugins/AutoSavePlugin';
import AIAssistantPlugin from './plugins/AIAssistantPlugin';
import { $generateHtmlFromNodes } from '@lexical/html';

const theme = {
  paragraph: 'editor-paragraph',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
    code: 'editor-text-code',
  },
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
  },
  list: {
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listitem',
  },
};

function onError(error) {
  console.error('Lexical Editor Error:', error);
}

export default function Editor({ postId, initialContent, onContentChange }) {
  const [isReady, setIsReady] = useState(false);

  console.log('🎨 Editor mounting with:', { 
    postId, 
    initialContent,
    hasLexical: !!initialContent?.lexical,
    lexicalType: typeof initialContent?.lexical,
    lexicalKeys: initialContent?.lexical ? Object.keys(initialContent.lexical) : [],
    lexicalRoot: initialContent?.lexical?.root
  });

  // Check if lexical content has a valid root node
  const hasValidLexicalContent = initialContent?.lexical 
    && typeof initialContent.lexical === 'object'
    && initialContent.lexical.root
    && Object.keys(initialContent.lexical).length > 0;

  const initialConfig = {
    namespace: 'SmartBlogEditor',
    theme,
    onError,
    nodes: [HeadingNode, ListNode, ListItemNode, LinkNode],
    // Only include editorState if we have valid initial content with a root node
    ...(hasValidLexicalContent 
      ? { editorState: JSON.stringify(initialContent.lexical) } 
      : {}),
  };

  useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <div className="editor-container">
        <div className="p-8 text-center text-gray-500">
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-container">
        <ToolbarPlugin />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="editor-input" />
            }
            placeholder={
              <div className="editor-placeholder">
                Start writing your post...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <AutoSavePlugin postId={postId} onContentChange={onContentChange} />
        <AIAssistantPlugin />
      </div>
    </LexicalComposer>
  );
}
