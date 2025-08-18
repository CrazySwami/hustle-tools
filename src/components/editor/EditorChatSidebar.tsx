import {
  Conversation,
  ConversationContent,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import { MarkdownWithCitations } from '@/components/ai-elements/markdown-with-citations';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool';
import { PromptInput, PromptInputTextarea, PromptInputSubmit } from '@/components/ai-elements/prompt-input';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';

interface EditorChatSidebarProps {
  editorContent: string;
}

// Helper to pretty-print tool output
const formatOutput = (output: any) => {
  if (output && typeof output === 'object' && 'type' in output && output.type === 'json' && 'value' in output) {
    return <Response>{`\n\n\u0060\u0060\u0060json\n${JSON.stringify(output.value, null, 2)}\n\u0060\u0060\u0060`}</Response>;
  }
  return <Response>{typeof output === 'object' ? JSON.stringify(output, null, 2) : String(output)}</Response>;
};

export default function EditorChatSidebar({ editorContent }: EditorChatSidebarProps) {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat({ api: '/api/chat' });

  const handleSubmit = () => {
    if (!input.trim()) return;
    sendMessage(
      { text: input },
      { body: { editorContent } } // pass context
    );
    setInput('');
  };

  return (
    <div className="h-full flex flex-col border-l w-[350px]">
      <Conversation className="flex-1 overflow-y-auto">
        <ConversationContent>
          {messages.map((message) => (
            <Message key={message.id} from={message.role}>
              <MessageContent>
                {message.parts.map((part, idx) => {
                  if (part.type === 'text') {
                    return (
                      <MarkdownWithCitations
                        key={idx}
                        content={part.text}
                        sources={message.sources}
                      />
                    );
                  }

                  if (typeof part.type === 'string' && part.type.startsWith('tool-')) {
                    const toolPart: any = part;
                    return (
                      <Tool key={idx} defaultOpen>
                        <ToolHeader type={toolPart.type.replace('tool-', '')} state={toolPart.state} />
                        <ToolContent>
                          {toolPart.input && <ToolInput input={toolPart.input} />}
                          {toolPart.state?.startsWith('output') && (
                            <ToolOutput output={formatOutput(toolPart.output)} errorText={toolPart.errorText} />
                          )}
                        </ToolContent>
                      </Tool>
                    );
                  }
                  return null;
                })}
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
      </Conversation>

      <PromptInput onSubmit={handleSubmit} className="border-t p-2">
        <PromptInputTextarea value={input} onChange={(e) => setInput(e.target.value)} />
        <PromptInputSubmit status={status} disabled={!input} />
      </PromptInput>
    </div>
  );
}
