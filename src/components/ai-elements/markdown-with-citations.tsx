'use client';

import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { CodeBlock } from '@/components/ai-elements/code-block';
import { cn } from '@/lib/utils';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent
} from '@/components/ui/hover-card';

interface Source {
  title?: string;
  url: string;
  description?: string;
  quote?: string;
}

interface MarkdownWithCitationsProps {
  content: string;
  sources?: Source[];
  className?: string;
}

export function MarkdownWithCitations({
  content,
  sources = [],
  className,
}: MarkdownWithCitationsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Process citation markers after rendering markdown
  useEffect(() => {
    if (!containerRef.current || !sources || sources.length === 0) return;

    // Find all citation markers in the rendered content
    const citationRegex = /\[(\d+)\]/g;
    const textNodes = findTextNodesWithCitations(containerRef.current);

    textNodes.forEach(textNode => {
      const text = textNode.nodeValue || '';
      const matches = [...text.matchAll(citationRegex)];
      
      if (matches.length === 0) return;
      
      // Create a document fragment to hold the processed content
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      
      matches.forEach(match => {
        const [fullMatch, citationNumber] = match;
        const matchIndex = match.index as number;
        
        // Add text before the citation
        if (matchIndex > lastIndex) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex, matchIndex)));
        }
        
        // Create the citation element
        const citationElement = createCitationElement(parseInt(citationNumber, 10), sources);
        if (citationElement) {
          fragment.appendChild(citationElement);
        } else {
          // If no matching source, just add the citation text
          fragment.appendChild(document.createTextNode(fullMatch));
        }
        
        lastIndex = matchIndex + fullMatch.length;
      });
      
      // Add any remaining text
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
      }
      
      // Replace the original text node with the processed fragment
      if (textNode.parentNode) {
        textNode.parentNode.replaceChild(fragment, textNode);
      }
    });
  }, [content, sources]);

  // Function to find text nodes that contain citation markers
  function findTextNodesWithCitations(node: Node): Text[] {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          return node.nodeValue && /\[\d+\]/.test(node.nodeValue)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    let currentNode: Node | null;
    while (currentNode = walker.nextNode()) {
      textNodes.push(currentNode as Text);
    }
    
    return textNodes;
  }

  // Function to create an interactive citation element
  function createCitationElement(citationNumber: number, sources: Source[]): HTMLElement | null {
    const source = sources[citationNumber - 1];
    if (!source) return null;
    
    // Create the citation container
    const container = document.createElement('span');
    container.className = 'inline-block relative group';
    
    // Create the citation text
    const citationText = document.createElement('span');
    citationText.textContent = `[${citationNumber}]`;
    citationText.className = 'cursor-pointer text-blue-600 hover:underline';
    container.appendChild(citationText);
    
    // Create the hover card
    const hoverCard = document.createElement('div');
    hoverCard.className = 'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 p-4 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 hidden group-hover:block z-50';
    
    // Create the hover card content
    const content = document.createElement('div');
    content.className = 'space-y-2';
    
    // Add title
    const title = document.createElement('h4');
    title.className = 'text-sm font-semibold';
    title.textContent = source.title || new URL(source.url).hostname;
    content.appendChild(title);
    
    // Add URL
    const url = document.createElement('a');
    url.href = source.url;
    url.target = '_blank';
    url.rel = 'noopener noreferrer';
    url.className = 'text-xs text-blue-600 hover:underline break-all';
    url.textContent = source.url;
    content.appendChild(url);
    
    // Add description if available
    if (source.description) {
      const description = document.createElement('p');
      description.className = 'text-xs text-gray-500 dark:text-gray-400';
      description.textContent = source.description;
      content.appendChild(description);
    }
    
    // Add quote if available
    if (source.quote) {
      const quote = document.createElement('blockquote');
      quote.className = 'text-xs border-l-2 pl-2 italic';
      quote.textContent = source.quote;
      content.appendChild(quote);
    }
    
    hoverCard.appendChild(content);
    container.appendChild(hoverCard);
    
    return container;
  }

  return (
    <div 
      ref={containerRef}
      className={cn('prose prose-sm max-w-none dark:prose-invert', className)}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            if (!inline && match) {
              return (
                <CodeBlock
                  language={match[1]}
                  value={String(children).replace(/\n$/, '')}
                  {...props}
                />
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          pre({ children }) {
            return <>{children}</>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
