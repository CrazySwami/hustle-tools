'use client';

import { CheckIcon, CopyIcon } from 'lucide-react';
import type { ComponentProps, HTMLAttributes, ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CodeBlockContextType = {
  code: string;
};

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: '',
});

export type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  children?: ReactNode;
};

export const CodeBlock = ({
  code,
  language,
  showLineNumbers = false,
  className,
  children,
  ...props
}: CodeBlockProps) => (
  <CodeBlockContext.Provider value={{ code }}>
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-md border text-foreground',
        // In user messages (light mode): darker bg to contrast with gray-800 bubble
        'group-[.is-user]:bg-gray-700 group-[.is-user]:border-gray-600',
        // In user messages (dark mode): lighter bg to contrast with gray-200 bubble
        'dark:group-[.is-user]:bg-gray-300 dark:group-[.is-user]:border-gray-400',
        // In assistant messages: normal background
        'group-[.is-assistant]:bg-background group-[.is-assistant]:border-border',
        className,
      )}
      {...props}
    >
      <div className="relative">
        <SyntaxHighlighter
          language={language}
          style={oneLight}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.875rem',
            background: 'transparent',
            color: 'inherit',
          }}
          showLineNumbers={showLineNumbers}
          lineNumberStyle={{
            color: 'currentColor',
            opacity: 0.6,
            paddingRight: '1rem',
            minWidth: '2.5rem',
          }}
          codeTagProps={{
            className: 'font-mono text-sm',
          }}
          className="dark:hidden overflow-hidden"
        >
          {code}
        </SyntaxHighlighter>
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.875rem',
            background: 'transparent',
            color: 'inherit',
          }}
          showLineNumbers={showLineNumbers}
          lineNumberStyle={{
            color: 'currentColor',
            opacity: 0.6,
            paddingRight: '1rem',
            minWidth: '2.5rem',
          }}
          codeTagProps={{
            className: 'font-mono text-sm',
          }}
          className="hidden dark:block overflow-hidden"
        >
          {code}
        </SyntaxHighlighter>
        {children && (
          <div className="absolute right-2 top-2 flex items-center gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  </CodeBlockContext.Provider>
);

export type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export const CodeBlockCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  ...props
}: CodeBlockCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { code } = useContext(CodeBlockContext);

  const copyToClipboard = async () => {
    if (typeof window === 'undefined' || !navigator.clipboard.writeText) {
      onError?.(new Error('Clipboard API not available'));
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      onCopy?.();
      setTimeout(() => setIsCopied(false), timeout);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <Button
      className={cn('shrink-0', className)}
      onClick={copyToClipboard}
      size="icon"
      variant="ghost"
      {...props}
    >
      {children ?? <Icon size={14} />}
    </Button>
  );
};
