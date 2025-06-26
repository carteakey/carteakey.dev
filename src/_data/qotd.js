import OpenAI from 'openai';
import { AssetCache } from "@11ty/eleventy-fetch";
import axios from 'axios';

async function checkOpenRouterAvailable() {
  try {
    if (!process.env['OPENROUTER_API_KEY']) {
      console.log('OpenRouter API key not found');
      return false;
    }
    return true;
  } catch (e) {
    console.log('OpenRouter not available, checking other providers');
    return false;
  }
}

async function checkOllamaAvailable() {
  try {
    const ollamaUrl = process.env['OLLAMA_API_URL'] || 'http://localhost:11434/v1';
    await axios.get(ollamaUrl.replace('/v1', '/api/tags'), { timeout: 2000 });
    return true;
  } catch (e) {
    console.log('Ollama not available, falling back to ChatGPT');
    return false;
  }
}

export default async function () {
  let qotd = new AssetCache("qotd");

  if (qotd.isCacheValid("1d")) {
    return qotd.getCachedValue();
  }

  try {
    const useOpenRouter = await checkOpenRouterAvailable();
    
    if (useOpenRouter) {
      // Primary: OpenRouter
      const client = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env['OPENROUTER_API_KEY'],
        defaultHeaders: {
          'HTTP-Referer': process.env['SITE_URL'] || 'https://carteakey.dev',
          'X-Title': process.env['SITE_NAME'] || 'carteakey.dev',
        },
      });

      const completion = await client.chat.completions.create({
        model: process.env['OPENROUTER_MODEL'] || 'openai/gpt-4o-mini',
        messages: [
          {
            role: "user",
            content: "Tell me a rare inspirational quote and its author. Just the quote and the author in plain text, please.",
          },
        ],
      });

      const result = {
        quote: completion.choices[0].message.content,
        provider: 'OpenRouter'
      };

      await qotd.save(result, "json");
      return result;
    }

    const useOllama = await checkOllamaAvailable();
    
    if (useOllama) {
      // Secondary: Ollama
      const client = new OpenAI({
        baseURL: process.env['OLLAMA_API_URL'] || 'http://localhost:11434/v1',
        apiKey: 'ollama', // required but unused
      });

      const completion = await client.chat.completions.create({
        model: process.env['OLLAMA_MODEL'] || "llama3.1:8b-instruct-q6_K",
        messages: [
          {
            role: "user",
            content: "Tell me a rare inspirational quote and its author. Just the quote and the author in plain text, please.",
          },
        ],
      });

      const result = {
        quote: completion.choices[0].message.content,
        provider: 'Ollama'
      };

      await qotd.save(result, "json");
      return result;
    } else {
      // Tertiary: OpenAI
      const client = new OpenAI({
        apiKey: process.env['OPENAI_API_KEY'],
      });

      const completion = await client.chat.completions.create({
        model: process.env['OPENAI_MODEL'] || "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: "Tell me a rare inspirational quote and its author. Just the quote and the author in plain text, please.",
          },
        ],
      });

      const result = {
        quote: completion.choices[0].message.content,
        provider: 'OpenAI'
      };

      await qotd.save(result, "json");
      return result;
    }
  } catch (e) {
    console.log(e);
    const result = {
      quote: "The illiterate of the 21st century will not be those who cannot read and write, but those who cannot learn, unlearn, and relearn. - Alvin Toffler",
      provider: 'Fallback'
    };
    
    await qotd.save(result, "json");
    return result;
  }
}
