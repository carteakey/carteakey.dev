import OpenAI from "openai";
import { AssetCache } from "@11ty/eleventy-fetch";
import quotes from "./quotes.js";

function cleanQuoteText(raw) {
  if (!raw || typeof raw !== "string") return "";
  return raw
    .trim()
    .replace(/^```[a-z]*\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();
}

function getRandomLocalQuote() {
  const available = Array.isArray(quotes)
    ? quotes.filter(
        (item) => !(item && typeof item === "object" && item.enabled === false),
      )
    : [];

  if (!available.length) {
    return {
      quote:
        "The illiterate of the 21st century will not be those who cannot read and write, but those who cannot learn, unlearn, and relearn. - Alvin Toffler",
      provider: "Fallback",
    };
  }

  const picked = available[Math.floor(Math.random() * available.length)];
  const rawText = (picked.quote || "").trim();
  const text = rawText.replace(/\s*\n+\s*/g, " ");
  const author = (picked.author || "").trim();
  const formatted = author ? `${text} - ${author}` : text;

  return {
    quote: formatted,
    rawQuote: text,
    author,
    provider: "Saved Lines",
  };
}

async function getOpenRouterQuote() {
  const apiKey = process.env["OPENROUTER_API_KEY"];
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const client = new OpenAI({
    baseURL:
      process.env["OPENROUTER_API_URL"] || "https://openrouter.ai/api/v1",
    apiKey,
    timeout: 10000,
    defaultHeaders: {
      "HTTP-Referer": process.env["SITE_URL"] || "https://carteakey.dev",
      "X-Title": process.env["SITE_NAME"] || "carteakey.dev",
    },
  });

  const configuredModel = process.env["OPENROUTER_MODEL"];
  const candidateModels = [
    configuredModel,
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "nvidia/nemotron-3.5-lightning:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "thinkingmachines/inkling:free",
  ].filter(Boolean);

  const uniqueModels = [...new Set(candidateModels)];

  let lastError = null;
  for (const model of uniqueModels) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content:
              "Tell me a rare inspirational quote and its author. Just the quote and the author in plain text, please.",
          },
        ],
      });

      const content = completion.choices?.[0]?.message?.content;
      const cleaned = cleanQuoteText(content);
      if (cleaned) {
        return {
          quote: cleaned,
          provider: `OpenRouter (${model})`,
        };
      }
    } catch (err) {
      lastError = err;
      console.warn(`OpenRouter model ${model} failed:`, err.message || err);
    }
  }

  throw lastError || new Error("All OpenRouter candidate models failed");
}

async function checkOllamaAvailable() {
  try {
    const ollamaUrl =
      process.env["OLLAMA_API_URL"] || "http://localhost:11434/v1";
    const response = await fetch(ollamaUrl.replace("/v1", "/api/tags"), {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch (e) {
    return false;
  }
}

async function getOllamaQuote() {
  const client = new OpenAI({
    baseURL: process.env["OLLAMA_API_URL"] || "http://localhost:11434/v1",
    apiKey: "ollama", // required by sdk but unused
    timeout: 8000,
  });

  const completion = await client.chat.completions.create({
    model: process.env["OLLAMA_MODEL"] || "llama3.1:8b-instruct-q6_K",
    messages: [
      {
        role: "user",
        content:
          "Tell me a rare inspirational quote and its author. Just the quote and the author in plain English text, please.",
      },
    ],
  });

  const content = completion.choices?.[0]?.message?.content;
  const cleaned = cleanQuoteText(content);
  return {
    quote: cleaned,
    provider: "Ollama",
  };
}

async function getOpenAIQuote() {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const client = new OpenAI({
    apiKey,
    timeout: 10000,
  });

  const completion = await client.chat.completions.create({
    model: process.env["OPENAI_MODEL"] || "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content:
          "Tell me a rare inspirational quote and its author. Just the quote and the author in plain text, please.",
      },
    ],
  });

  const content = completion.choices?.[0]?.message?.content;
  const cleaned = cleanQuoteText(content);
  return {
    quote: cleaned,
    provider: "OpenAI",
  };
}

async function generateQuote() {
  if (process.env["OPENROUTER_API_KEY"]) {
    try {
      return await getOpenRouterQuote();
    } catch (error) {
      console.warn(
        "OpenRouter QOTD failed, trying other providers:",
        error.message || error,
      );
    }
  }

  const useOllama = await checkOllamaAvailable();
  if (useOllama) {
    try {
      return await getOllamaQuote();
    } catch (error) {
      console.warn(
        "Ollama QOTD failed, trying other providers:",
        error.message || error,
      );
    }
  }

  if (process.env["OPENAI_API_KEY"]) {
    try {
      return await getOpenAIQuote();
    } catch (error) {
      console.warn("OpenAI QOTD failed:", error.message || error);
    }
  }

  console.log(
    "No external AI providers succeeded for QOTD, pulling random quote from saved lines.",
  );
  return getRandomLocalQuote();
}

export default async function () {
  let qotd = new AssetCache("qotd");

  if (qotd.isCacheValid("1d")) {
    const cached = await qotd.getCachedValue();
    // Bypass cache if it holds the legacy static Alvin Toffler fallback
    if (
      cached &&
      cached.quote &&
      cached.provider !== "Fallback" &&
      !cached.quote.includes("Alvin Toffler")
    ) {
      return cached;
    }
  }

  try {
    const result = await generateQuote();
    await qotd.save(result, "json");
    return result;
  } catch (e) {
    console.warn(
      "QOTD generation failed, falling back to saved quotes:",
      e.message || e,
    );
    const result = getRandomLocalQuote();
    await qotd.save(result, "json");
    return result;
  }
}
