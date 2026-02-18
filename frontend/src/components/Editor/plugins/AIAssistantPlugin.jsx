/**
 * AI Assistant Wrapper Plugin
 * This wraps the AI Assistant to work within Lexical context
 */
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import AIAssistantComponent from '../../AIAssistant';

export default function AIAssistantPlugin() {
  return <AIAssistantComponent />;
}
