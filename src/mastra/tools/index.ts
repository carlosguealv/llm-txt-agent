import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const documentationTool = createTool({
  id: 'find-llms-txt',
  description: 'Searches the internet for llms.txt, llms-full.txt, or openapi.yaml of a given library, fetches its content, and answers a question about it',
  inputSchema: z.object({
    library: z.string().describe('Name of the library to search for'),
  }),
  outputSchema: z.object({
    url: z.string().nullable().describe('URL of the documentation file if found, otherwise null'),
    found: z.boolean().describe('Whether a documentation file was found'),
    fileType: z.string().nullable().describe('Type of file found: llms.txt, llms-full.txt, or openapi.yaml'),
    message: z.string().describe('A message describing the result'),
    answer: z.string().nullable().describe('Answer to the question using the documentation file, or null if not found'),
  }),
  execute: async ({ context }) => {
    return await findDocFileAndAnswer(context.library);
  },
});

const findDocFileAndAnswer = async (library: string) => {
  const fileTypes = ['llms-full.txt', 'llms.txt', 'openapi.yaml'];

  for (const ftype of fileTypes) {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(library)}+${encodeURIComponent(ftype)}`;
    const response = await fetch(searchUrl);
    const html = await response.text();

    const urlRegex = new RegExp(`[\\w\\-.]+\\.[\\w\\-.]+\\S*\\/${ftype.replace('.', '\\.')}`, 'gi');
    const matches = html.match(urlRegex);
    const uniqueMatches = matches ? Array.from(new Set(matches)) : [];

    if (uniqueMatches.length > 0) {

      const url = uniqueMatches[0];
      let answer = null;
      try {
        const docResponse = await fetch(`https://${url}`);
        const docText = await docResponse.text();
        answer = docText || 'No direct answer found in the documentation file.';
      } catch (e) {
        answer = 'Could not fetch or process the documentation file.';
      }
      return {
        url,
        found: true,
        fileType: ftype,
        message: `Found ${ftype} for ${library}: ${url}`,
        answer,
      };
    }
  }
  // If no file found in any iteration, return this:
  return {
    url: null,
    found: false,
    fileType: null,
    message: `Could not find llms.txt, llms-full.txt, or openapi.yaml for ${library}`,
    answer: null,
  };
};
