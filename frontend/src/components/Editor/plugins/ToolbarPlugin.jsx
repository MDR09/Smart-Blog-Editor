/**
 * Toolbar Plugin for Lexical Editor
 * Provides formatting controls: Bold, Italic, Headings, Lists
 */
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useState } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from '@lexical/list';
import { $getNearestNodeOfType } from '@lexical/utils';
import { $createParagraphNode } from 'lexical';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Type
} from 'lucide-react';

const LowPriority = 1;

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format states
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));

      // Update block type
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const type = parentList ? parentList.getTag() : element.getTag();
          setBlockType(type);
        } else {
          const type = element.getType();
          setBlockType(type);
        }
      }
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      LowPriority
    );
  }, [editor, updateToolbar]);

  const formatText = (format) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatHeading = (headingSize) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
        }
      });
    }
  };

  const formatParagraph = () => {
    if (blockType !== 'paragraph') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode());
        }
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== 'ul') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== 'ol') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND);
    }
  };

  return (
    <div className="toolbar">
      {/* Text Formatting */}
      <button
        onClick={() => formatText('bold')}
        className={`toolbar-button ${isBold ? 'active' : ''}`}
        aria-label="Format Bold"
        title="Bold (Ctrl+B)"
      >
        <Bold size={18} />
      </button>
      <button
        onClick={() => formatText('italic')}
        className={`toolbar-button ${isItalic ? 'active' : ''}`}
        aria-label="Format Italic"
        title="Italic (Ctrl+I)"
      >
        <Italic size={18} />
      </button>
      <button
        onClick={() => formatText('underline')}
        className={`toolbar-button ${isUnderline ? 'active' : ''}`}
        aria-label="Format Underline"
        title="Underline (Ctrl+U)"
      >
        <Underline size={18} />
      </button>
      <button
        onClick={() => formatText('strikethrough')}
        className={`toolbar-button ${isStrikethrough ? 'active' : ''}`}
        aria-label="Format Strikethrough"
        title="Strikethrough"
      >
        <Strikethrough size={18} />
      </button>

      <div className="toolbar-divider" />

      {/* Block Formatting */}
      <button
        onClick={formatParagraph}
        className={`toolbar-button ${blockType === 'paragraph' ? 'active' : ''}`}
        aria-label="Normal Text"
        title="Normal Text"
      >
        <Type size={18} />
      </button>
      <button
        onClick={() => formatHeading('h1')}
        className={`toolbar-button ${blockType === 'h1' ? 'active' : ''}`}
        aria-label="Heading 1"
        title="Heading 1"
      >
        <Heading1 size={18} />
      </button>
      <button
        onClick={() => formatHeading('h2')}
        className={`toolbar-button ${blockType === 'h2' ? 'active' : ''}`}
        aria-label="Heading 2"
        title="Heading 2"
      >
        <Heading2 size={18} />
      </button>
      <button
        onClick={() => formatHeading('h3')}
        className={`toolbar-button ${blockType === 'h3' ? 'active' : ''}`}
        aria-label="Heading 3"
        title="Heading 3"
      >
        <Heading3 size={18} />
      </button>

      <div className="toolbar-divider" />

      {/* Lists */}
      <button
        onClick={formatBulletList}
        className={`toolbar-button ${blockType === 'ul' ? 'active' : ''}`}
        aria-label="Bullet List"
        title="Bullet List"
      >
        <List size={18} />
      </button>
      <button
        onClick={formatNumberedList}
        className={`toolbar-button ${blockType === 'ol' ? 'active' : ''}`}
        aria-label="Numbered List"
        title="Numbered List"
      >
        <ListOrdered size={18} />
      </button>
    </div>
  );
}
