"use client";

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Heading2, Link as LinkIcon, List, Image as ImageIcon, Code, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  minHeight?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange, minHeight = "300px" }) => {
  const [editorValue, setEditorValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditorValue(value);
  }, [value]);

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditorValue(e.target.value);
    onChange(e.target.value);
  };

  const applyStyle = (style: 'bold' | 'italic' | 'heading' | 'link' | 'list' | 'image' | 'code' | 'quote') => {
    if (!textareaRef.current) return;
    const { selectionStart, selectionEnd, value: currentValue } = textareaRef.current;
    const selectedText = currentValue.substring(selectionStart, selectionEnd);
    let newText = '';

    switch (style) {
      case 'bold':
        newText = `**${selectedText}**`;
        break;
      case 'italic':
        newText = `*${selectedText}*`;
        break;
      case 'heading':
        newText = `## ${selectedText}`;
        break;
      case 'link':
        newText = `[${selectedText}](url)`;
        break;
      case 'list':
        newText = `- ${selectedText || 'List item'}`;
        break;
      case 'image':
        newText = `![${selectedText || 'Alt text'}](image_url)`;
        break;
      case 'code':
        newText = `\`\`\`\n${selectedText || 'code block'}\n\`\`\``;
        break;
      case 'quote':
        newText = `> ${selectedText || 'Quote'}`;
        break;
      default:
        newText = selectedText;
    }

    const newValue = currentValue.substring(0, selectionStart) + newText + currentValue.substring(selectionEnd);
    setEditorValue(newValue);
    onChange(newValue);
    textareaRef.current.focus();
    // Adjust cursor position after insertion if needed, simplified for now
  };

  const toolbarButtons = [
    { label: 'Bold', icon: Bold, action: () => applyStyle('bold') },
    { label: 'Italic', icon: Italic, action: () => applyStyle('italic') },
    { label: 'Heading', icon: Heading2, action: () => applyStyle('heading') },
    { label: 'Link', icon: LinkIcon, action: () => applyStyle('link') },
    { label: 'List', icon: List, action: () => applyStyle('list') },
    { label: 'Image', icon: ImageIcon, action: () => applyStyle('image') },
    { label: 'Code Block', icon: Code, action: () => applyStyle('code') },
    { label: 'Quote', icon: Quote, action: () => applyStyle('quote') },
  ];

  return (
    <Card className="shadow-sm">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/50 rounded-t-lg">
        {toolbarButtons.map(btn => (
          <Button key={btn.label} variant="ghost" size="icon" onClick={btn.action} title={btn.label} className="h-8 w-8">
            <btn.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-px">
        <Textarea
          ref={textareaRef}
          value={editorValue}
          onChange={handleEditorChange}
          placeholder="Write your blog content in Markdown..."
          className="rounded-none rounded-bl-lg md:rounded-tr-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-4"
          style={{ minHeight }}
        />
        <div className="p-4 bg-background rounded-br-lg md:rounded-bl-none border-t md:border-t-0 md:border-l" style={{ minHeight }}>
          <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
            {editorValue || "Preview will appear here..."}
          </ReactMarkdown>
        </div>
      </div>
    </Card>
  );
};

export default MarkdownEditor;
