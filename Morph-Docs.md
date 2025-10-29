https://docs.morphllm.com/introduction

# Introduction

> For teams who want to build the best AI coding agents

## What is Morph?

Morph Fast Apply is a tool that you give to your AI agent that allows it to edit code or files.

When building AI agents that edit code or files you have 3 options:

1. **Rewrite entire files** (slow, expensive, loses context, hallucinates updates) - 100+ seconds per file edit
2. **Use search-and-replace** (brittle, fails on whitespace/formatting, needs self correction loops) - 86% accurate with Claude 4 Sonnet: 35s per file edit
3. **Fast Apply via an edit\_file tool** (fast, accurate, semantic) - 98% accurate with Morph + Claude 4 Sonnet: 6s per file edit

[Start Here → Quickstart Guide](/quickstart)

## Why You Need It

**Current AI code editing is broken.** Agents either:

* **Rewrite entire files** (slow, expensive, loses context)
* **Use search-and-replace** (brittle, fails, needs self correction)

You lose customers while your agents are fixing patch errors.
**Fast Apply solves this.** Your agent uses an edit\_file tool that writes lazy edit snippets, and Fast Apply handles the merging - the same way Cursor does it.
Fast, Reliable Edits every time

## How It Looks in Your Code

1. **Give your agent an edit\_file tool** - It generates abbreviated edit snippets in this tool call
2. **Call Morph's API inside the tool** - We merge the edit with the original file FAST, using our specialized models
3. **Write the result** - Get the merged code back and save it to your filesystem

## How edit\_file Works

See how Claude integrates with Morph to deliver lightning-fast, accurate code edits:

<Card title="Apply Model" icon="code-merge" href="/quickstart">
  Apply code changes at 10,500 tokens/sec with 98% accuracy
</Card>

<CardGroup cols={2}>
  <Card title="Embedding Model" icon="cube" href="/models/embedding">
    Embeddings built for code
  </Card>

  <Card title="Rerank Model" icon="arrow-up-arrow-down" href="/models/rerank">
    Reorder code results with code reranking
  </Card>
</CardGroup>

## Why Choose Morph?

<div className="flex gap-8">
  <div className="flex-1">
    <ul className="space-y-4 mb-4">
      <li>
        <strong>Built for Code:</strong> Specialized models trained for code
        understanding and editing
      </li>

      <li>
        <strong>Universal Integration:</strong> OpenAI-compatible with native
        support for OpenRouter, Vercel AI SDK, and MCP
      </li>

      <li>
        <strong>Enterprise Ready:</strong> Dedicated instances, self-hosted,
        and on-premises options
      </li>
    </ul>
  </div>
</div>

## Enterprise Ready

Your code. Your cloud. Your AI advantage.

* **Dedicated Instances**: Managed cloud infrastructure with guaranteed performance and 99.9% uptime SLA
* **Self-Hosted**: Deploy on your own infrastructure - on-premises or cloud with full control
* **Zero Data Retention**: ZDR-ready with enterprise security, audit trails, and IAM integration

<Card title="Contact Sales" icon="envelope" href="mailto:info@morphllm.com" horizontal>
  Get custom deployment options and enterprise features
</Card>

## Next Steps

Ready to start building with Morph? Here's what to do next:

<Card title="Try the API Playground" icon="play" href="https://morphllm.com/dashboard/playground/apply" horizontal>
  Test Fast Apply with live examples
</Card>

<Card title="Get Your API Key" icon="key" href="https://morphllm.com/dashboard/api-keys" horizontal>
  Set up authentication and test your first API call in minutes
</Card>

<Card title="Explore the Apply Model" icon="code-merge" href="/quickstart" horizontal>
  Learn how to use Morph's Fast Apply for precise code edits
</Card>

<Card title="Integrate with Morph" icon="wrench" href="/quickstart" horizontal>
  Create edit\_file tools for AI agents and development environments
</Card>


# Quickstart: Fast Apply

> Replace full file rewrites or search and replace with Fast Apply in 5 minutes

<img className="block dark:hidden" src="https://mintcdn.com/morph-555d6c14/81UoWpotGPzGjPQ0/images/quickstart.jpeg?fit=max&auto=format&n=81UoWpotGPzGjPQ0&q=85&s=4524d22ab335cb82edbcaf0553cb1cdc" alt="Morph Fast Apply Quickstart" data-og-width="1344" width="1344" data-og-height="768" height="768" data-path="images/quickstart.jpeg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/morph-555d6c14/81UoWpotGPzGjPQ0/images/quickstart.jpeg?w=280&fit=max&auto=format&n=81UoWpotGPzGjPQ0&q=85&s=463183a5335f379b36cd9d1dcce49fa1 280w, https://mintcdn.com/morph-555d6c14/81UoWpotGPzGjPQ0/images/quickstart.jpeg?w=560&fit=max&auto=format&n=81UoWpotGPzGjPQ0&q=85&s=2ddcdadf91250e0ba8fd885bd64e7f9f 560w, https://mintcdn.com/morph-555d6c14/81UoWpotGPzGjPQ0/images/quickstart.jpeg?w=840&fit=max&auto=format&n=81UoWpotGPzGjPQ0&q=85&s=759fc04a9dce0ca0d7b8d3f298427042 840w, https://mintcdn.com/morph-555d6c14/81UoWpotGPzGjPQ0/images/quickstart.jpeg?w=1100&fit=max&auto=format&n=81UoWpotGPzGjPQ0&q=85&s=d1718bf71960876bf8997cce25d545a0 1100w, https://mintcdn.com/morph-555d6c14/81UoWpotGPzGjPQ0/images/quickstart.jpeg?w=1650&fit=max&auto=format&n=81UoWpotGPzGjPQ0&q=85&s=dae1af9e626ced2c86f767fff35282b9 1650w, https://mintcdn.com/morph-555d6c14/81UoWpotGPzGjPQ0/images/quickstart.jpeg?w=2500&fit=max&auto=format&n=81UoWpotGPzGjPQ0&q=85&s=fac0e61d4b0f5aad4c3b7423a9151efd 2500w" />

<img className="hidden dark:block" src="https://mintcdn.com/morph-555d6c14/81UoWpotGPzGjPQ0/images/quickstart.jpeg?fit=max&auto=format&n=81UoWpotGPzGjPQ0&q=85&s=4524d22ab335cb82edbcaf0553cb1cdc" alt="Morph Fast Apply Quickstart" data-og-width="1344" width="1344" data-og-height="768" height="768" data-path="images/quickstart.jpeg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/morph-555d6c14/81UoWpotGPzGjPQ0/images/quickstart.jpeg?w=280&fit=max&auto=format&n=81UoWpotGPzGjPQ0&q=85&s=463183a5335f379b36cd9d1dcce49fa1 280w, https://mintcdn.com/morph-555d6c14/81UoWpotGPzGjPQ0/images/quickstart.jpeg?w=560&fit=max&auto=format&n=81UoWpotGPzGjPQ0&q=85&s=2ddcdadf91250e0ba8fd885bd64e7f9f 560w, https://mintcdn.com/morph-555d6c14/81UoWpotGPzGjPQ0/images/quickstart.jpeg?w=840&fit=max&auto=format&n=81UoWpotGPzGjPQ0&q=85&s=759fc04a9dce0ca0d7b8d3f298427042 840w, https://mintcdn.com/morph-555d6c14/81UoWpotGPzGjPQ0/images/quickstart.jpeg?w=1100&fit=max&auto=format&n=81UoWpotGPzGjPQ0&q=85&s=d1718bf71960876bf8997cce25d545a0 1100w, https://mintcdn.com/morph-555d6c14/81UoWpotGPzGjPQ0/images/quickstart.jpeg?w=1650&fit=max&auto=format&n=81UoWpotGPzGjPQ0&q=85&s=dae1af9e626ced2c86f767fff35282b9 1650w, https://mintcdn.com/morph-555d6c14/81UoWpotGPzGjPQ0/images/quickstart.jpeg?w=2500&fit=max&auto=format&n=81UoWpotGPzGjPQ0&q=85&s=fac0e61d4b0f5aad4c3b7423a9151efd 2500w" />

## Overview

What is Morph for?
Morph Fast Apply looks like a new edit\_file tool you give your agent access to. That's it.
Claude will output lazily into this tool when it wants to make an edit.
In the tools execution, the Morph API will merge the lazy edit output by Claude/Gemini/etc. into the file.

If you like using Cursor - you already like the Fast Apply UX. Fast Apply is a concept [used in Cursor](https://web.archive.org/web/20240823050616/https://www.cursor.com/blog/instant-apply).

## How to use Morph Fast Apply

<Card title="Try the API Playground" icon="play" href="https://morphllm.com/dashboard/playground/apply" horizontal>
  Test the Apply Model with live examples in our interactive playground
</Card>

<Steps>
  <Step title="1. Add an edit_file tool to your agent">
    Add the `edit_file` tool to your agent. Use one of the formats below.

    <Tabs>
      <Tab title="General Prompt">
        ````xml Tool Description theme={null}
        Use this tool to make an edit to an existing file.

        This will be read by a less intelligent model, which will quickly apply the edit. You should make it clear what the edit is, while also minimizing the unchanged code you write.
        When writing the edit, you should specify each edit in sequence, with the special comment // ... existing code ... to represent unchanged code in between edited lines.

        For example:

        // ... existing code ...
        FIRST_EDIT
        // ... existing code ...
        SECOND_EDIT
        // ... existing code ...
        THIRD_EDIT
        // ... existing code ...

        You should still bias towards repeating as few lines of the original file as possible to convey the change.
        But, each edit should contain minimally sufficient context of unchanged lines around the code you're editing to resolve ambiguity.
        DO NOT omit spans of pre-existing code (or comments) without using the // ... existing code ... comment to indicate its absence. If you omit the existing code comment, the model may inadvertently delete these lines.
        If you plan on deleting a section, you must provide context before and after to delete it. If the initial code is ```code \n Block 1 \n Block 2 \n Block 3 \n code```, and you want to remove Block 2, you would output ```// ... existing code ... \n Block 1 \n  Block 3 \n // ... existing code ...```.
        Make sure it is clear what the edit should be, and where it should be applied.
        Make edits to a file in a single edit_file call instead of multiple edit_file calls to the same file. The apply model can handle many distinct edits at once.
        ````

        **Parameters:**

        * `target_filepath` (string, required): The path of the target file to modify
        * `instructions` (string, required): A single sentence written in the first person describing what the agent is changing. Used to help disambiguate uncertainty in the edit.
        * `code_edit` (string, required): Specify ONLY the precise lines of code that you wish to edit. Use `// ... existing code ...` for unchanged sections.
      </Tab>

      <Tab title="JSON Tool (Claude)">
        ````json Tool Definition theme={null}
        {
          "name": "edit_file",
          "description": "Use this tool to make an edit to an existing file.\n\nThis will be read by a less intelligent model, which will quickly apply the edit. You should make it clear what the edit is, while also minimizing the unchanged code you write.\nWhen writing the edit, you should specify each edit in sequence, with the special comment // ... existing code ... to represent unchanged code in between edited lines.\n\nFor example:\n\n// ... existing code ...\nFIRST_EDIT\n// ... existing code ...\nSECOND_EDIT\n// ... existing code ...\nTHIRD_EDIT\n// ... existing code ...\n\nYou should still bias towards repeating as few lines of the original file as possible to convey the change.\nBut, each edit should contain minimally sufficient context of unchanged lines around the code you're editing to resolve ambiguity.\nDO NOT omit spans of pre-existing code (or comments) without using the // ... existing code ... comment to indicate its absence. If you omit the existing code comment, the model may inadvertently delete these lines.\nIf you plan on deleting a section, you must provide context before and after to delete it. If the initial code is ```code \\n Block 1 \\n Block 2 \\n Block 3 \\n code```, and you want to remove Block 2, you would output ```// ... existing code ... \\n Block 1 \\n  Block 3 \\n // ... existing code ...```.\nMake sure it is clear what the edit should be, and where it should be applied.\nMake edits to a file in a single edit_file call instead of multiple edit_file calls to the same file. The apply model can handle many distinct edits at once.",
          "input_schema": {
            "type": "object",
            "properties": {
              "target_filepath": {
                "type": "string",
                "description": "Path of the target file to modify."
              },
              "instructions": {
                "type": "string",
                "description": "A single sentence instruction describing what you are going to do for the sketched edit. This is used to assist the less intelligent model in applying the edit. Use the first person to describe what you are going to do. Use it to disambiguate uncertainty in the edit."
              },
              "code_edit": {
                "type": "string",
                "description": "Specify ONLY the precise lines of code that you wish to edit. NEVER specify or write out unchanged code. Instead, represent all unchanged code using the comment of the language you're editing in - example: // ... existing code ..."
              }
            },
            "required": ["target_filepath", "instructions", "code_edit"]
          }
        }
        ````
      </Tab>

      <Tab title="Output Parsing (No Tool)">
        Instead of using tool calls, you can have the agent output code edits in markdown format that you can parse:

        ````markdown Agent Instruction theme={null}
        Use this approach to make edits to existing files by outputting code edits in a specific markdown format.

        This will be read by a less intelligent model, which will quickly apply the edit. You should make it clear what the edit is, while also minimizing the unchanged code you write.
        When writing the edit, you should specify each edit in sequence, with the special comment // ... existing code ... to represent unchanged code in between edited lines.

        For example:

        // ... existing code ...
        FIRST_EDIT
        // ... existing code ...
        SECOND_EDIT
        // ... existing code ...
        THIRD_EDIT
        // ... existing code ...

        You should still bias towards repeating as few lines of the original file as possible to convey the change.
        But, each edit should contain minimally sufficient context of unchanged lines around the code you're editing to resolve ambiguity.
        DO NOT omit spans of pre-existing code (or comments) without using the // ... existing code ... comment to indicate its absence. If you omit the existing code comment, the model may inadvertently delete these lines.
        If you plan on deleting a section, you must provide context before and after to delete it. If the initial code is ```code \n Block 1 \n Block 2 \n Block 3 \n code```, and you want to remove Block 2, you would output ```// ... existing code ... \n Block 1 \n  Block 3 \n // ... existing code ...```.
        Make sure it is clear what the edit should be, and where it should be applied.
        Make edits to a file in a single response instead of multiple responses to the same file. The apply model can handle many distinct edits at once.

        When you want to edit a file, output your code edits using this markdown format:

        ```filepath=path/to/file.js instruction=A single sentence describing what you're changing
        // ... existing code ...
        YOUR_CODE_EDIT_HERE
        // ... existing code ...
        ```

        The instruction should be written in the first person describing what you're changing. Used to help disambiguate uncertainty in the edit.
        ````
      </Tab>
    </Tabs>

    <Warning>
      **IMPORTANT:** The `instructions` param should be generated by the model not hardcoded.
      Example: "I am adding error handling to the user auth and removing the old auth functions"
    </Warning>

    <Info>
      **Why do I need the instructions to be generated by the model?**

      The `instructions` parameter provides crucial context for ambiguous edits, helping the apply model make correct decisions and achieve near 100% accuracy even in edge cases.
    </Info>
  </Step>

  <Step title="Merge with Morph Fast Apply">
    Your tool's execution should use Morph's API to merge the code. Then you should write the code to a file.

    <Accordion title="What to add to your System Prompt">
      Add this to your system prompt to enable proper code editing with Morph:

      ```markdown  theme={null}
      When the user is asking for edits to their code, use the edit_file tool to highlight the changes necessary and adds comments to indicate where unchanged code has been skipped. For example:

      // ... existing code ...
      {{ edit_1 }}
      // ... existing code ...
      {{ edit_2 }}
      // ... existing code ...

      Often this will mean that the start/end of the file will be skipped, but that's okay! Rewrite the entire file ONLY if specifically requested. Always provide a brief explanation of the updates, unless the user specifically requests only the code.

      These edit codeblocks are also read by a less intelligent language model, colloquially called the apply model, to update the file. To help specify the edit to the apply model, you will be very careful when generating the codeblock to not introduce ambiguity. You will specify all unchanged regions (code and comments) of the file with "// ... existing code ..." comment markers. This will ensure the apply model will not delete existing unchanged code or comments when editing the file.
      ```
    </Accordion>

    <CodeGroup>
      ```typescript TypeScript highlight={13} theme={null}
      import OpenAI from "openai";

      const openai = new OpenAI({
        apiKey: process.env.MORPH_API_KEY,
        baseURL: "https://api.morphllm.com/v1",
      });

      const response = await openai.chat.completions.create({
        model="morph-v3-fast",
        messages: [
          {
            role: "user",
            content: `<instruction>${instructions}</instruction>\n<code>${initialCode}</code>\n<update>${codeEdit}</update>`,
          },
        ],
      });

      const mergedCode = response.choices[0].message.content;
      ```

      ```python Python highlight={14} theme={null}
      import os
      from openai import OpenAI

      client = OpenAI(
          api_key=os.getenv("MORPH_API_KEY"),
          base_url="https://api.morphllm.com/v1"
      )

      response = client.chat.completions.create(
          model="morph-v3-fast",
          messages=[
              {
                  "role": "user",
                  "content": f"<instruction>{instructions}</instruction>\n<code>{initial_code}</code>\n<update>{code_edit}</update>"
              }
          ]
      )

      merged_code = response.choices[0].message.content
      ```

      ```bash cURL highlight={9} theme={null}
      curl -X POST "https://api.morphllm.com/v1/chat/completions" \
        -H "Authorization: Bearer $MORPH_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
          "model": "morph-v3-fast",
          "messages": [
            {
              "role": "user",
              "content": "<instruction>INSTRUCTIONS</instruction>\n<code>INITIAL_CODE</code>\n<update>CODE_EDIT</update>"
            }
          ]
        }'
      ```
    </CodeGroup>
  </Step>

  <Step title="Handle the Response">
    Extract the merged code from the API response. Use your filesystem to write the code to a file.

    **Response Format:**

    ```json  theme={null}
    final_code = response.choices[0].message.content
    ```

    **Extract the Final Code:**

    <CodeGroup>
      ```typescript extract_code.ts theme={null}
      const finalCode = response.choices[0].message.content;
      // Write to file or return to your application
      await fs.writeFile(targetFile, finalCode);
      ```

      ```python extract_code.py theme={null}
      final_code = response.choices[0].message.content
      # Write to file or return to your application
      with open(target_file, 'w') as f:
          f.write(final_code)
      ```

      ```bash cURL theme={null}
      # The response contains the merged code directly
      echo "$response" > output_file.js
      ```
    </CodeGroup>
  </Step>

  <Step title="Verifying Edits (Optional but Recommended)">
    We recommend passing the code changes back to the agent in UDiff format. This allows the agent to verify that the changes match its intent and make any necessary corrections.
    To save on tokens, another option is to check for linting errors and only pass the calculated udiff back when there are linting errors.

    <CodeGroup>
      ```typescript TypeScript theme={null}
      import { createTwoFilesPatch } from 'diff';

      // Generate UDiff between original and modified code
      const udiff = createTwoFilesPatch(
        targetFile, 
        targetFile,
        initialCode,
        mergedCode,
        '', 
        ''
      );

      // Send back to agent for verification
      console.log("Changes applied:", udiff);
      ```

      ```python Python theme={null}
      import difflib

      # Generate UDiff between original and modified code
      udiff = '\n'.join(difflib.unified_diff(
          initial_code.splitlines(keepends=True),
          merged_code.splitlines(keepends=True),
          fromfile=target_file,
          tofile=target_file
      ))

      # Send back to agent for verification
      print("Changes applied:", udiff)
      ```

      ```bash Bash theme={null}
      # Generate diff using standard Unix tools
      diff -u original_file.js modified_file.js

      # Or save both versions and diff them
      echo "$initial_code" > temp_original.js
      echo "$merged_code" > temp_modified.js
      diff -u temp_original.js temp_modified.js
      rm temp_original.js temp_modified.js
      ```
    </CodeGroup>

    This verification step helps catch any unexpected changes and ensures the applied edits match the agent's intentions.
  </Step>
</Steps>

## Next Steps

Ready to start building with Morph? Here's what to do next:

<Card title="Explore the Apply API" icon="code" href="/api-reference/endpoint/apply" horizontal>
  Learn about the Apply API endpoints for production use
</Card>

<Card title="Build Agentic Tools" icon="wrench" href="/guides/agent-tools" horizontal>
  Create edit\_file tools for AI agents and development environments
</Card>


# Apply Model

> Apply code changes with the highest accuracy and speed

# What is Fast Apply?

The Apply Model intelligently merges your original code with update snippets at **98% accuracy** and **10,500+ tokens/second**.
Companies like Cursor use this method for fast, reliable edits.

Methods like search and replace face high error rates and are slower because they need to output negative tokens and positive tokens.
Unlike diff-based methods, it preserves code structure, comments, and syntax while understanding context semantically.

<Card title="Try the API Playground" icon="play" href="/api-reference/endpoint/apply" horizontal>
  Test the Apply Model instantly with live examples
</Card>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
  <div>
    ## Why Choose Fast Apply?

    * **Ultra-fast**: 10,500 tokens/sec
    * **High accuracy**: 98% success rate in one pass
    * **Token efficient**: Processes only changed sections
  </div>

  <div>
    ### Models

    | Model              | Speed           | Accuracy | Best For            |
    | ------------------ | --------------- | -------- | ------------------- |
    | **morph-v3-fast**  | 10,500+ tok/sec | 96%      | Real-time edits     |
    | **morph-v3-large** | 2500+ tok/sec   | 98%      | Production systems  |
    | **auto**           | Variable        | \~98%    | Automatic selection |
  </div>
</div>

## Quick Start

<Steps>
  <Step title="Setup Client">
    ```python Python theme={null}
    from openai import OpenAI

    client = OpenAI(
        api_key="your-morph-api-key",
        base_url="https://api.morphllm.com/v1"
    )
    ```
  </Step>

  <Step title="Apply Changes">
    ```python Python theme={null}
    def apply_edit(instruction: str, original: str, update: str):
        response = client.chat.completions.create(
            model="morph-v3-fast",
            messages=[{
                "role": "user",
                "content": f"<instruction>{instruction}</instruction>\n<code>{original}</code>\n<update>{update}</update>"
            }]
        )
        return response.choices[0].message.content

    # Example
    original = """
    const a = 1
    const authenticateUser = () => {
      return "Authenticated"
    }
    """
    # These should be coming from your Agent
    instruction = "I will change the return text to be French"
    update = """
    // ... existing code ...
      return "Authentifié"
    }
    """

    final_code = apply_edit(instruction, original, update)
    ```
  </Step>
</Steps>

## Best Practices

**Update Snippets**: Use `// ... existing code ...` for unchanged sections:

```javascript  theme={null}
// Good
const authenticateUser = async (email, password) => {
  // ... existing code ...
  const result = await verifyUser(email, password)
  return result ? "Authenticated" : "Unauthenticated"
}
```

**Instructions**: Have the agent write clear, first-person descriptions to "disambiguate uncertainty in the edit":

* ✅ "I will add async/await error handling"
* ❌ "Change this function"

## Next Steps

<CardGroup cols={2}>
  <Card title="API Reference" icon="book" href="/guides/apply">
    Complete technical reference and error handling
  </Card>

  <Card title="Build AI Tools" icon="wrench" href="/guides/tools">
    Integration guide for AI agents
  </Card>
</CardGroup>
