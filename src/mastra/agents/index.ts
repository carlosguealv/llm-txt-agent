import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { documentationTool } from '../tools';

export const docsAgent = new Agent({
  name: 'Code Agent With Documentation Retrieval',
  instructions: `
      You are a helpful coding assistant that provides accurate documentation and code help.

      Your primary function is to help users understand code and documentation. When responding:
      - Ask for clarification if the request is unclear
      - Provide code examples when relevant
      - Identify the libraries or frameworks in use
      - Use the documentationTool to find relevant documentation
      - Explain complex concepts in simple terms
      - Focus on best practices and proper implementation
      - Keep responses concise but informative

      Use the documentationTool to fetch relevant documentation and code references.
`,
  model: openai('gpt-4o-mini'),
  tools: { documentationTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
    options: {
      lastMessages: 10,
      semanticRecall: false,
      threads: {
        generateTitle: false,
      },
    },
  }),
});
