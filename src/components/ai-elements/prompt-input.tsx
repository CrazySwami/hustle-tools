'use client';

import { Loader2Icon, SendIcon, SquareIcon, XIcon } from 'lucide-react';
import type {
  ComponentProps,
  HTMLAttributes,
  KeyboardEventHandler,
} from 'react';
import { Children, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ChatStatus } from 'ai';
import { PromptTokenCounter } from '@/components/ui/PromptTokenCounter';

export type PromptInputProps = HTMLAttributes<HTMLFormElement> & {
  /** Current prompt value for token counting */
  promptValue?: string;
  /** System prompt for token calculation */
  systemPrompt?: string;
  /** Model context limit */
  contextLimit?: number;
  /** Conversation tokens so far */
  conversationTokens?: number;
  /** Callback when send should be disabled */
  onSendDisabled?: (disabled: boolean) => void;
  /** Show token counter (default: true) */
  showTokenCounter?: boolean;
};

export const PromptInput = ({
  className,
  promptValue = '',
  systemPrompt = '',
  contextLimit = 128000,
  conversationTokens = 0,
  onSendDisabled,
  showTokenCounter = true,
  ...props
}: PromptInputProps) => {
  return (
    <form
      className={cn(
        'w-full divide-y overflow-hidden rounded-xl border shadow-sm',
        'bg-[#EBEBEB] dark:bg-[#2C2C2C]',
        className,
      )}
      {...props}
    />
  );
};

export type PromptInputTextareaProps = ComponentProps<typeof Textarea> & {
  minHeight?: number;
  maxHeight?: number;
};

export const PromptInputTextarea = ({
  onChange,
  className,
  placeholder = 'What would you like to know?',
  minHeight = 48,
  maxHeight = 164,
  ...props
}: PromptInputTextareaProps) => {
  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow newline
        return;
      }

      // Submit on Enter (without Shift)
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <Textarea
      className={cn(
        'w-full resize-none rounded-none border-none p-3 shadow-none outline-none ring-0',
        'bg-transparent dark:bg-transparent field-sizing-content max-h-[6lh]',
        'focus-visible:ring-0',
        className,
      )}
      name="message"
      onChange={(e) => {
        onChange?.(e);
      }}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      {...props}
    />
  );
};

export type PromptInputTokenCounterProps = {
  /** Current prompt value for token counting */
  promptValue?: string;
  /** System prompt for token calculation */
  systemPrompt?: string;
  /** Model context limit */
  contextLimit?: number;
  /** Conversation tokens so far */
  conversationTokens?: number;
  /** Callback when send should be disabled */
  onSendDisabled?: (disabled: boolean) => void;
  /** Show detailed breakdown */
  showDetails?: boolean;
  /** Current model name (for provider-specific image token calculation) */
  model?: string;
  /** Attached image file (if any) */
  attachedImage?: { file: File; preview: string } | null;
  className?: string;
};

export const PromptInputTokenCounterSection = ({
  promptValue = '',
  systemPrompt = '',
  contextLimit = 128000,
  conversationTokens = 0,
  onSendDisabled,
  showDetails = false,
  model = 'default',
  attachedImage = null,
  className,
}: PromptInputTokenCounterProps) => {
  // Always render to show system prompt + conversation tokens
  // (previously only showed when user was typing)
  return (
    <div className={cn('px-3 py-2 bg-muted/30', className)}>
      <PromptTokenCounter
        prompt={promptValue}
        systemPrompt={systemPrompt}
        contextLimit={contextLimit}
        conversationTokens={conversationTokens}
        onSendDisabled={onSendDisabled}
        showDetails={showDetails}
        model={model}
        attachedImage={attachedImage}
      />
    </div>
  );
};

export type PromptInputToolbarProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputToolbar = ({
  className,
  ...props
}: PromptInputToolbarProps) => (
  <div
    className={cn('flex items-center justify-between p-1', className)}
    {...props}
  />
);

export type PromptInputToolsProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTools = ({
  className,
  ...props
}: PromptInputToolsProps) => (
  <div
    className={cn(
      'flex items-center gap-1',
      '[&_button:first-child]:rounded-bl-xl',
      className,
    )}
    {...props}
  />
);

export type PromptInputButtonProps = ComponentProps<typeof Button>;

export const PromptInputButton = ({
  variant = 'ghost',
  className,
  size,
  ...props
}: PromptInputButtonProps) => {
  const newSize =
    (size ?? Children.count(props.children) > 1) ? 'default' : 'icon';

  return (
    <Button
      className={cn(
        'shrink-0 gap-1.5 rounded-lg',
        variant === 'ghost' && 'text-muted-foreground',
        newSize === 'default' && 'px-3',
        className,
      )}
      size={newSize}
      type="button"
      variant={variant}
      {...props}
    />
  );
};

export type PromptInputSubmitProps = ComponentProps<typeof Button> & {
  status?: ChatStatus;
};

export const PromptInputSubmit = ({
  className,
  variant = 'default',
  size = 'icon',
  status,
  children,
  ...props
}: PromptInputSubmitProps) => {
  let Icon = <SendIcon className="size-4" />;

  if (status === 'submitted') {
    Icon = <Loader2Icon className="size-4 animate-spin" />;
  } else if (status === 'streaming') {
    Icon = <SquareIcon className="size-4" />;
  } else if (status === 'error') {
    Icon = <XIcon className="size-4" />;
  }

  return (
    <Button
      className={cn('gap-1.5 rounded-lg', className)}
      size={size}
      type="submit"
      variant={variant}
      {...props}
    >
      {children ?? Icon}
    </Button>
  );
};

export type PromptInputModelSelectProps = ComponentProps<typeof Select>;

export const PromptInputModelSelect = (props: PromptInputModelSelectProps) => (
  <Select {...props} />
);

export type PromptInputModelSelectTriggerProps = ComponentProps<
  typeof SelectTrigger
>;

export const PromptInputModelSelectTrigger = ({
  className,
  ...props
}: PromptInputModelSelectTriggerProps) => (
  <SelectTrigger
    className={cn(
      'border-none bg-transparent font-medium text-muted-foreground shadow-none transition-colors',
      'hover:bg-accent hover:text-foreground [&[aria-expanded="true"]]:bg-accent [&[aria-expanded="true"]]:text-foreground',
      className,
    )}
    {...props}
  />
);

export type PromptInputModelSelectContentProps = ComponentProps<
  typeof SelectContent
>;

export const PromptInputModelSelectContent = ({
  className,
  ...props
}: PromptInputModelSelectContentProps) => (
  <SelectContent className={cn(className)} {...props} />
);

export type PromptInputModelSelectItemProps = ComponentProps<typeof SelectItem>;

export const PromptInputModelSelectItem = ({
  className,
  ...props
}: PromptInputModelSelectItemProps) => (
  <SelectItem className={cn(className)} {...props} />
);

export type PromptInputModelSelectValueProps = ComponentProps<
  typeof SelectValue
>;

export const PromptInputModelSelectValue = ({
  className,
  ...props
}: PromptInputModelSelectValueProps) => (
  <SelectValue className={cn(className)} {...props} />
);
