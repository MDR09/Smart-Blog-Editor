/**
 * AI Assistant Component
 * Provides AI-powered features like summarization and grammar fixing
 */
import { useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $getSelection, $isRangeSelection } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { aiAPI } from '../services/api';
import { Sparkles, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AIAssistant() {
  const [editor] = useLexicalComposerContext();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null); // null, 'success', 'error'
  const [message, setMessage] = useState('');

  const extractText = () => {
    let text = '';
    editor.getEditorState().read(() => {
      const root = $getRoot();
      text = root.getTextContent();
    });
    return text;
  };

  const insertText = (textToInsert) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.insertText(textToInsert);
      }
    });
  };

  const handleAIAction = async (action) => {
    const text = extractText();
    
    if (!text || text.trim().length === 0) {
      setStatus('error');
      setMessage('Please write some content first');
      setTimeout(() => setStatus(null), 3000);
      return;
    }

    setIsLoading(true);
    setStatus(null);
    setMessage('');

    try {
      const response = await aiAPI.generate(text, action);
      
      // Insert AI-generated text
      insertText('\n\n' + response.generated_text);
      
      setStatus('success');
      setMessage(`${action === 'summarize' ? 'Summary' : 'Fixed text'} added!`);
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error('AI generation error:', error);
      setStatus('error');
      setMessage(error.response?.data?.detail || 'AI generation failed. Please check your API key.');
      setTimeout(() => setStatus(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-primary-600" />
          <h3 className="font-medium text-gray-900">AI Assistant</h3>
        </div>
        {status && (
          <div className="flex items-center gap-2 text-sm">
            {status === 'success' ? (
              <>
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-green-700">{message}</span>
              </>
            ) : (
              <>
                <XCircle size={16} className="text-red-600" />
                <span className="text-red-700">{message}</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleAIAction('summarize')}
          disabled={isLoading}
          className="btn-secondary flex-1 text-sm flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          Generate Summary
        </button>
        <button
          onClick={() => handleAIAction('fix_grammar')}
          disabled={isLoading}
          className="btn-secondary flex-1 text-sm flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          Fix Grammar
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-2 text-center">
        AI-powered suggestions will be inserted at the cursor position
      </p>
    </div>
  );
}
