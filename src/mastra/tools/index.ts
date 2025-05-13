import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

interface GeocodingResponse {
  results: {
    latitude: number;
    longitude: number;
    name: string;
  }[];
}
interface WeatherResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    weather_code: number;
  };
}

export const weatherTool = createTool({
  id: 'get-weather',
  description: 'Get current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('City name'),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    feelsLike: z.number(),
    humidity: z.number(),
    windSpeed: z.number(),
    windGust: z.number(),
    conditions: z.string(),
    location: z.string(),
  }),
  execute: async ({ context }) => {
    return await getWeather(context.location);
  },
});

const getWeather = async (location: string) => {
  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const geocodingResponse = await fetch(geocodingUrl);
  const geocodingData = (await geocodingResponse.json()) as GeocodingResponse;

  if (!geocodingData.results?.[0]) {
    throw new Error(`Location '${location}' not found`);
  }

  const { latitude, longitude, name } = geocodingData.results[0];

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code`;

  const response = await fetch(weatherUrl);
  const data = (await response.json()) as WeatherResponse;

  return {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windGust: data.current.wind_gusts_10m,
    conditions: getWeatherCondition(data.current.weather_code),
    location: name,
  };
};

function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return conditions[code] || 'Unknown';
}

export const documentationTool = createTool({
  id: 'find-llms-txt',
  description: 'Searches the internet for llms.txt, llms-full.txt, or openapi.yaml of a given library, fetches its content, and answers a question about it',
  inputSchema: z.object({
    library: z.string().describe('Name of the library to search for'),
    question: z.string().describe('A question to answer using the documentation file'),
  }),
  outputSchema: z.object({
    url: z.string().nullable().describe('URL of the documentation file if found, otherwise null'),
    found: z.boolean().describe('Whether a documentation file was found'),
    fileType: z.string().nullable().describe('Type of file found: llms.txt, llms-full.txt, or openapi.yaml'),
    message: z.string().describe('A message describing the result'),
    answer: z.string().nullable().describe('Answer to the question using the documentation file, or null if not found'),
  }),
  execute: async ({ context }) => {
    return await findDocFileAndAnswer(context.library, context.question);
  },
});

const findDocFileAndAnswer = async (library: string, question: string) => {
  const fileTypes = ['llms-full.txt', 'llms.txt', 'openapi.yaml'];

  for (const ftype of fileTypes) {
    const searchUrl = `https://www.google.com/search?q=filetype:txt ${library}+${ftype}`;
    const response = await fetch(searchUrl);
    const html = await response.text();

    const urlRegex = new RegExp(`https?:\\/\\/[\\w\\-.]+\\.[\\w\\-.]+\\S*(${ftype})`, 'gi');
    const matches = html.match(urlRegex);
    const uniqueMatches = matches ? Array.from(new Set(matches)) : [];

    if (uniqueMatches.length > 0) {

      const url = uniqueMatches[0];
      let answer = null;
      try {
        const docResponse = await fetch(url);
        const docText = await docResponse.text();
        const lowerQ = question.toLowerCase();
        const lines = docText.split('\n');
        const foundLine = lines.find(line => line.toLowerCase().includes(lowerQ));
        answer = foundLine || 'No direct answer found in the documentation file.';
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
