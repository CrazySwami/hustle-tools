'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Response } from '@/components/ai-elements/response';
import { MarkdownWithCitations } from '@/components/ai-elements/markdown-with-citations';
import { GlobeIcon, BrainIcon, PanelRightOpen, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';
import TiptapEditor from '@/components/editor/TiptapEditor';
import { Comment } from '@/components/editor/CommentExtension';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/source';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { Loader } from '@/components/ai-elements/loader';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool';
import { ToolResultRenderer } from '@/components/tool-ui/tool-result-renderer';

// Define interfaces for model and model groups
interface Model {
  name: string;
  value: string;
}

interface ModelGroup {
  provider: string;
  models: Model[];
  isOpen?: boolean; // Track if the group is expanded
}

// Group models by provider
const modelGroups: ModelGroup[] = [
  {
    provider: 'OpenAI',
    isOpen: true, // Default open
    models: [
      { name: 'GPT-4.1', value: 'openai/gpt-4.1' },
      { name: 'GPT-4.1 mini', value: 'openai/gpt-4.1-mini' },
      { name: 'GPT-4.1 nano', value: 'openai/gpt-4.1-nano' },
      { name: 'GPT-4o', value: 'openai/gpt-4o' },
      { name: 'GPT-4o mini', value: 'openai/gpt-4o-mini' },
      { name: 'o3', value: 'openai/o3' },
    ]
  },
  {
    provider: 'Anthropic',
    models: [
      { name: 'Claude Opus 4', value: 'anthropic/claude-opus-4-20250514' },
      { name: 'Claude Sonnet 4', value: 'anthropic/claude-sonnet-4-20250514' },
      { name: 'Claude 3.7 Sonnet', value: 'anthropic/claude-3-7-sonnet-20250219' },
    ]
  },
  {
    provider: 'Google',
    models: [
      { name: 'Gemini 2.5 Pro', value: 'google/gemini-2.5-pro' },
      { name: 'Gemini 2.5 Flash', value: 'google/gemini-2.5-flash' },
    ]
  },
  {
    provider: 'DeepSeek',
    models: [
      { name: 'DeepSeek R1', value: 'deepseek/deepseek-r1' },
      { name: 'DeepSeek V3 0324', value: 'deepseek/deepseek-v3-0324' },
    ]
  },
];

const ChatBotDemo = () => {
  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(modelGroups[0].models[0].value);
  const [webSearch, setWebSearch] = useState(false);

  const { messages, sendMessage, status } = useChat();

  const [documentContent, setDocumentContent] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);

  // Track which provider groups are open
  const [openProviders, setOpenProviders] = useState<Record<string, boolean>>({
    // Only OpenAI open by default
    OpenAI: true
  });



  // Helper to format tool output for display
  const formatToolOutput = (output: any): React.ReactNode => {
    if (
      output &&
      typeof output === 'object' &&
      'type' in output &&
      output.type === 'json' &&
      'value' in output
    ) {
      const pretty = JSON.stringify((output as any).value, null, 2);
      return <Response>{`\n\n\`\`\`json\n${pretty}\n\`\`\``}</Response>;
    }

    // Fallback: prettify whatever we got
    const pretty = typeof output === 'object'
      ? JSON.stringify(output, null, 2)
      : String(output);
    return <Response>{pretty}</Response>;
  };

  // Toggle provider group open/closed
  const toggleProvider = (provider: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent dropdown from closing
    e.stopPropagation(); // Prevent event bubbling
    setOpenProviders(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      // If web search is enabled but not using a Perplexity model, switch to Perplexity Sonar
      let selectedModel = model;
      if (webSearch && !model.startsWith('perplexity/')) {
        console.log('Switching to Perplexity model for web search');
        selectedModel = 'perplexity/sonar';
      }

      sendMessage(
        { text: input },
        {
          body: {
            model: selectedModel,
            webSearch,

            documentContent,
            comments,
          },
        },
      );
      setInput('');
    }
  };

  return (
    <div
      className={cn(
        'h-screen w-full pt-16 grid',
        !isEditorFullscreen && 'grid-cols-[1fr_550px]'
      )}
    >
      <div className="flex flex-col h-full p-4 overflow-auto">

        <TiptapEditor
          onContentChange={setDocumentContent}
          onCommentsChange={setComments}
          toolbarActions={
            <button
              onClick={() => setIsEditorFullscreen(!isEditorFullscreen)}
              className="p-2 rounded-md hover:bg-muted"
              title={isEditorFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isEditorFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </button>
          }
        />
      </div>
            {!isEditorFullscreen && (
      <div className="flex flex-col h-full p-4">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.map(message => (
              <div key={message.id}>
                {message.role === 'assistant' && (
                  <Sources>
                    {/* Only render SourcesTrigger once per message */}
                    {message.parts.some(part => part.type === 'source-url') && (
                      <SourcesTrigger
                        count={
                          message.parts.filter(
                            part => part.type === 'source-url',
                          ).length
                        }
                      />
                    )}
                    <SourcesContent>
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case 'source-url':
                            return (
                              <Source
                                key={`${message.id}-${i}`}
                                href={part.url}
                                title={part.url}
                              />
                            );
                          default:
                            return null;
                        }
                      })}
                    </SourcesContent>
                  </Sources>
                )}
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.parts.map((part, i) => {
                      console.log('Message part:', part.type, part);
                      switch (part.type) {
                        case 'text':
                          return (
                            <MarkdownWithCitations
                              key={`${message.id}-${i}`}
                              content={part.text}
                              sources={message.sources}
                            />
                          );
                        case 'tool-call':
                          console.log('Rendering tool-call:', part);
                          return (
                            <Tool key={`${message.id}-${i}`} defaultOpen>
                              <ToolHeader
                                type={part.toolName}
                                state="input-available"
                              />
                              <ToolContent>
                                <ToolInput input={part.input ?? part.args} />
                              </ToolContent>
                            </Tool>
                          );
                        case 'tool-result':
                          console.log('Rendering tool-result:', part);
                          return (
                            <Tool key={`${message.id}-${i}`} defaultOpen>
                              <ToolHeader
                                type={part.toolName}
                                state={
                                  part.isError
                                    ? 'output-error'
                                    : 'output-available'
                                }
                              />
                              <ToolContent>
                                <ToolInput input={part.input ?? part.args} />
                                <ToolOutput
                                  output={formatToolOutput(
                                    part.output ?? part.result,
                                  )}
                                  errorText={
                                    part.isError
                                      ? String(part.output ?? part.result)
                                      : undefined
                                  }
                                />
                              </ToolContent>
                            </Tool>
                          );
                        // Handle specific tool types as fallback
                        case 'tool-weatherTool':
                          console.log('Rendering tool-weatherTool:', part);
                          return (
                            <Tool key={`${message.id}-${i}`} defaultOpen>
                              <ToolHeader
                                type="weatherTool"
                                state={part.state || 'output-available'}
                              />
                              <ToolContent>
                                <ToolInput input={part.input || part.args} />
                                <ToolOutput
                                  output={part.output || part.result}
                                  errorText={part.errorText}
                                />
                              </ToolContent>
                            </Tool>
                          );

                        case 'source-url':
                          // Already handled in Sources component
                          return null;
                        default:
                          // Fallback for unknown part types
                          const unknownPart = part as any;
                          if (unknownPart.type === 'text') {
                            return (
                              <MarkdownWithCitations
                                key={`${message.id}-${i}`}
                                content={unknownPart.text}
                                sources={message.sources}
                              />
                            );
                          } else if (unknownPart.type === 'tool-call') {
                            return (
                              <Tool key={`${message.id}-${i}`} defaultOpen>
                                <ToolHeader
                                  type={unknownPart.toolName}
                                  state="input-available"
                                />
                                <ToolContent>
                                  <ToolInput input={unknownPart.args} />
                                </ToolContent>
                              </Tool>
                            );
                          } else if (unknownPart.type === 'tool-result') {
                            return (
                              <Tool key={`${message.id}-${i}`} defaultOpen>
                                <ToolHeader
                                  type={unknownPart.toolName}
                                  state={
                                    unknownPart.isError
                                      ? 'output-error'
                                      : 'output-available'
                                  }
                                />
                                <ToolContent>
                                  <ToolInput input={unknownPart.args} />
                                  <ToolOutput
                                    output={formatToolOutput(
                                      unknownPart.result,
                                    )}
                                    errorText={
                                      unknownPart.isError
                                        ? String(unknownPart.result)
                                        : undefined
                                    }
                                  />
                                </ToolContent>
                              </Tool>
                            );
                          }
                          return null;
                      }
                    })}
                  </MessageContent>
                </Message>
              </div>
            ))}
            {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-4">
          <PromptInputTextarea
            onChange={e => setInput(e.target.value)}
            value={input}
          />
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputButton
                variant={webSearch ? 'default' : 'ghost'}
                onClick={() => setWebSearch(!webSearch)}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>


              <PromptInputModelSelect
                onValueChange={value => {
                  setModel(value);
                  // Log when model changes
                  console.log('Model changed to:', value);
                }}
                value={model}
              >
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent className="max-h-[300px] overflow-y-auto w-[250px]">
                  {modelGroups.map(group => (
                    <div key={group.provider}>
                      <button
                        className="flex justify-between w-full p-2 text-left"
                        onClick={e => toggleProvider(group.provider, e)}
                      >
                        <h3>{group.provider}</h3>
                        <span className="text-gray-500">
                          {openProviders[group.provider] ? '-' : '+'}
                        </span>
                      </button>
                      {openProviders[group.provider] && (
                        <div className="pl-4">
                          {group.models.map(model => (
                            <PromptInputModelSelectItem
                              key={model.value}
                              value={model.value}
                            >
                              {model.name}
                            </PromptInputModelSelectItem>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
            </PromptInputTools>
            <PromptInputSubmit disabled={!input} status={status} />
          </PromptInputToolbar>
        </PromptInput>
      </div>
      )}
    </div>
  );
};

export default ChatBotDemo;
