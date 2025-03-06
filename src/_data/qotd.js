import OpenAI from 'openai';
import { AssetCache } from "@11ty/eleventy-fetch";
import axios from 'axios';

async function checkOllamaAvailable() {
  try {
    const ollamaUrl = process.env['OLLAMA_API_URL'] || 'http://localhost:11434/v1';
    await axios.get(ollamaUrl.replace('/v1', '/api/tags'));
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
    const useOllama = await checkOllamaAvailable();
    
    if (useOllama) {
      const client = new OpenAI({
        baseURL: process.env['OLLAMA_API_URL'] || 'http://localhost:11434/v1',
        apiKey: 'ollama', // required but unused
      });

      const completion = await client.chat.completions.create({
        model: process.env['OLLAMA_MODEL'] || "llama3.1:8b-instruct-q6_K",
        messages: [
          {
            role: "user",
            content: "Tell me a rare inspirational quote and its author. Just the quote and the author, please.",
          },
        ],
      });

      return {
        quote: completion.choices[0].message.content,
        provider: 'Ollama'
      };
    } else {
      // Fallback to OpenAI
      const client = new OpenAI({
        apiKey: process.env['OPENAI_API_KEY'],
      });

      const completion = await client.chat.completions.create({
        model: process.env['OPENAI_MODEL'] || "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: "Tell me a rare inspirational quote and its author",
          },
        ],
      });

      return {
        quote: completion.choices[0].message.content,
        provider: 'ChatGPT'
      };
    }
  } catch (e) {
    console.log(e);
    return {
      quote: "The illiterate of the 21st century will not be those who cannot read and write, but those who cannot learn, unlearn, and relearn. - Alvin Toffler",
      provider: 'Fallback'
    };
  }
}
