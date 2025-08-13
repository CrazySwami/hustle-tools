[AI SDK](https://ai-sdk.dev/)

v5

Search…
`⌘ K`

Feedback

Sign in with Vercel

Sign in with Vercel

Menu

[Introduction](https://ai-sdk.dev/elements/overview)

[Setup](https://ai-sdk.dev/elements/overview/setup)

[Usage](https://ai-sdk.dev/elements/overview/usage)

[Troubleshooting](https://ai-sdk.dev/elements/overview/troubleshooting)

[Examples](https://ai-sdk.dev/elements/examples)

[Chatbot](https://ai-sdk.dev/elements/examples/chatbot)

[v0 clone](https://ai-sdk.dev/elements/examples/v0)

[Components](https://ai-sdk.dev/elements/components)

[Actions](https://ai-sdk.dev/elements/components/actions)

[Branch](https://ai-sdk.dev/elements/components/branch)

[Code Block](https://ai-sdk.dev/elements/components/code-block)

[Conversation](https://ai-sdk.dev/elements/components/conversation)

[Image](https://ai-sdk.dev/elements/components/image)

[Inline Citation](https://ai-sdk.dev/elements/components/inline-citation)

[Loader](https://ai-sdk.dev/elements/components/loader)

[Message](https://ai-sdk.dev/elements/components/message)

[Prompt Input](https://ai-sdk.dev/elements/components/prompt-input)

[Reasoning](https://ai-sdk.dev/elements/components/reasoning)

[Response](https://ai-sdk.dev/elements/components/response)

[Sources](https://ai-sdk.dev/elements/components/sources)

[Suggestion](https://ai-sdk.dev/elements/components/suggestion)

[Task](https://ai-sdk.dev/elements/components/task)

[Tool](https://ai-sdk.dev/elements/components/tool)

[Web Preview](https://ai-sdk.dev/elements/components/web-preview)

Copy markdown

# [Task](https://ai-sdk.dev/elements/components/task\#task)

The `Task` component provides a structured way to display task lists or workflow progress with collapsible details, status indicators, and progress tracking. It consists of a main `Task` container with `TaskTrigger` for the clickable header and `TaskContent` for the collapsible content area.

Found project files

Searching "app/page.tsx, components structure"

Read
Reactpage.tsx

Scanning 52 files

Scanning 2 files

Reading files
Reactlayout.tsx

## [Installation](https://ai-sdk.dev/elements/components/task\#installation)

ai-elementsshadcnManual

```
npx ai-elements@latest add task
```

## [Usage](https://ai-sdk.dev/elements/components/task\#usage)

```code-block_code__yIKW2

import {

  Task,

  TaskContent,

  TaskItem,

  TaskItemFile,

  TaskTrigger,

} from '@/components/ai-elements/task';
```

```code-block_code__yIKW2

<Task className="w-full">

  <TaskTrigger title="Found project files" />

  <TaskContent>

    <TaskItem>

      Read <TaskItemFile>index.md</TaskItemFile>

    </TaskItem>

  </TaskContent>

</Task>
```

## [Usage with AI SDK](https://ai-sdk.dev/elements/components/task\#usage-with-ai-sdk)

Build a mock async programming agent using [`experimental_generateObject`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-object).

Add the following component to your frontend:

app/page.tsx

```code-block_code__yIKW2

'use client';

import { experimental_useObject as useObject } from '@ai-sdk/react';

import {

  Task,

  TaskItem,

  TaskItemFile,

  TaskTrigger,

  TaskContent,

} from '@/components/ai-elements/task';

import { Button } from '@/components/ui/button';

import { tasksSchema } from '@/app/api/task/route';

import {

  SiReact,

  SiTypescript,

  SiJavascript,

  SiCss,

  SiHtml5,

  SiJson,

  SiMarkdown,

} from '@icons-pack/react-simple-icons';

const iconMap = {

  react: { component: SiReact, color: '#149ECA' },

  typescript: { component: SiTypescript, color: '#3178C6' },

  javascript: { component: SiJavascript, color: '#F7DF1E' },

  css: { component: SiCss, color: '#1572B6' },

  html: { component: SiHtml5, color: '#E34F26' },

  json: { component: SiJson, color: '#000000' },

  markdown: { component: SiMarkdown, color: '#000000' },

};

const TaskDemo = () => {

  const { object, submit, isLoading } = useObject({

    api: '/api/agent',

    schema: tasksSchema,

  });

  const handleSubmit = (taskType: string) => {

    submit({ prompt: taskType });

  };

  const renderTaskItem = (item: any, index: number) => {

    if (item?.type === 'file' && item.file) {

      const iconInfo = iconMap[item.file.icon as keyof typeof iconMap];

      if (iconInfo) {

        const IconComponent = iconInfo.component;

        return (

          <span className="inline-flex items-center gap-1" key={index}>

            {item.text}

            <TaskItemFile>

              <IconComponent

                color={item.file.color || iconInfo.color}

                className="size-4"

              />

              <span>{item.file.name}</span>

            </TaskItemFile>

          </span>

        );

      }

    }

    return item?.text || '';

  };

  return (

    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">

      <div className="flex flex-col h-full">

        <div className="flex gap-2 mb-6 flex-wrap">

          <Button

            onClick={() => handleSubmit('React component development')}

            disabled={isLoading}

            variant="outline"

          >

            React Development

          </Button>

        </div>

        <div className="flex-1 overflow-auto space-y-4">

          {isLoading && !object && (

            <div className="text-muted-foreground">Generating tasks...</div>

          )}

          {object?.tasks?.map((task: any, taskIndex: number) => (

            <Task key={taskIndex} defaultOpen={taskIndex === 0}>

              <TaskTrigger title={task.title || 'Loading...'} />

              <TaskContent>

                {task.items?.map((item: any, itemIndex: number) => (

                  <TaskItem key={itemIndex}>

                    {renderTaskItem(item, itemIndex)}

                  </TaskItem>

                ))}

              </TaskContent>

            </Task>

          ))}

        </div>

      </div>

    </div>

  );

};

export default TaskDemo;
```

Add the following route to your backend:

app/api/agent.ts

```code-block_code__yIKW2

import { streamObject } from 'ai';

import { z } from 'zod';

export const taskItemSchema = z.object({

  type: z.enum(['text', 'file']),

  text: z.string(),

  file: z

    .object({

      name: z.string(),

      icon: z.string(),

      color: z.string().optional(),

    })

    .optional(),

});

export const taskSchema = z.object({

  title: z.string(),

  items: z.array(taskItemSchema),

  status: z.enum(['pending', 'in_progress', 'completed']),

});

export const tasksSchema = z.object({

  tasks: z.array(taskSchema),

});

// Allow streaming responses up to 30 seconds

export const maxDuration = 30;

export async function POST(req: Request) {

  const { prompt } = await req.json();

  const result = streamObject({

    model: 'openai/gpt-4o',

    schema: tasksSchema,

    prompt: `You are an AI assistant that generates realistic development task workflows. Generate a set of tasks that would occur during ${prompt}.

    Each task should have:

    - A descriptive title

    - Multiple task items showing the progression

    - Some items should be plain text, others should reference files

    - Use realistic file names and appropriate file types

    - Status should progress from pending to in_progress to completed

    For file items, use these icon types: 'react', 'typescript', 'javascript', 'css', 'html', 'json', 'markdown'

    Generate 3-4 tasks total, with 4-6 items each.`,

  });

  return result.toTextStreamResponse();

}
```

## [Features](https://ai-sdk.dev/elements/components/task\#features)

- Visual icons for pending, in-progress, completed, and error states
- Expandable content for task descriptions and additional information
- Built-in progress counter showing completed vs total tasks
- Optional progressive reveal of tasks with customizable timing
- Support for custom content within task items
- Full type safety with proper TypeScript definitions
- Keyboard navigation and screen reader support

## [Props](https://ai-sdk.dev/elements/components/task\#props)

### [`<Task />`](https://ai-sdk.dev/elements/components/task\#task-)

### \[...props\]?:

React.ComponentProps<typeof Collapsible>

Any other props are spread to the root Collapsible component.

### [`<TaskTrigger />`](https://ai-sdk.dev/elements/components/task\#tasktrigger-)

### title:

string

The title of the task that will be displayed in the trigger.

### \[...props\]?:

React.ComponentProps<typeof CollapsibleTrigger>

Any other props are spread to the CollapsibleTrigger component.

### [`<TaskContent />`](https://ai-sdk.dev/elements/components/task\#taskcontent-)

### \[...props\]?:

React.ComponentProps<typeof CollapsibleContent>

Any other props are spread to the CollapsibleContent component.

### [`<TaskItem />`](https://ai-sdk.dev/elements/components/task\#taskitem-)

### \[...props\]?:

React.ComponentProps<"div">

Any other props are spread to the underlying div.

### [`<TaskItemFile />`](https://ai-sdk.dev/elements/components/task\#taskitemfile-)

### \[...props\]?:

React.ComponentProps<"div">

Any other props are spread to the underlying div.

On this page

[Task](https://ai-sdk.dev/elements/components/task#task)

[Installation](https://ai-sdk.dev/elements/components/task#installation)

[Usage](https://ai-sdk.dev/elements/components/task#usage)

[Usage with AI SDK](https://ai-sdk.dev/elements/components/task#usage-with-ai-sdk)

[Features](https://ai-sdk.dev/elements/components/task#features)

[Props](https://ai-sdk.dev/elements/components/task#props)

[<Task />](https://ai-sdk.dev/elements/components/task#task-)

[<TaskTrigger />](https://ai-sdk.dev/elements/components/task#tasktrigger-)

[<TaskContent />](https://ai-sdk.dev/elements/components/task#taskcontent-)

[<TaskItem />](https://ai-sdk.dev/elements/components/task#taskitem-)

[<TaskItemFile />](https://ai-sdk.dev/elements/components/task#taskitemfile-)

Elevate your AI applications with Vercel.

Trusted by OpenAI, Replicate, Suno, Pinecone, and more.

Vercel provides tools and infrastructure to deploy AI apps and features at scale.

[Talk to an expert](https://vercel.com/contact/sales?utm_source=ai_sdk&utm_medium=web&utm_campaign=contact_sales_cta&utm_content=talk_to_an_expert_sdk_docs)