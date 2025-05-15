# LLM Text Agent

A sophisticated coding agent built using the Mastra framework that leverages large language models and internet resources to assist with coding tasks. This agent is designed to help developers by providing code snippets, documentation, and debugging assistance.

## Features

- Built on the Mastra framework for agent-based systems
- Integration with OpenAI's language models
- Can navigate through the internet, and find the necessary documentation to provide coding assistance.

## Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/llm-txt-agent.git
cd llm-txt-agent
```

2. Install dependencies:
```bash
npm install
```

## Development

To run the project in development mode:

```bash
npm run dev
```

To interact with the agent with the playground UI, open your browser and navigate to:

```
http://localhost:4111
```

## Project Structure

```
src/
  mastra/
    index.ts        # Main Mastra configuration
    agents/         # Agent implementations
    tools/          # Custom tools and utilities
```

## Dependencies

- `@mastra/core` - Core Mastra framework
- `@mastra/libsql` - SQLite storage adapter
- `@mastra/memory` - Memory management utilities
- `@ai-sdk/openai` - OpenAI integration
- `zod` - Runtime type checking and validation