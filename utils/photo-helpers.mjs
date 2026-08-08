import fs from "fs/promises";
import path from "path";
import OpenAI from "openai";

const PHOTO_DESCRIPTION_PROMPT =
  "Generate a one-sentence description for a photography portfolio, focusing on the subject, composition, and mood. Be creative and evocative. After the description, on a new line, provide a title in the format 'Title: [title here]'. The response must only contain the single sentence description and the title.";

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function convertDMSToDD(dms, ref) {
  if (!dms || dms.length !== 3) return null;

  const [degrees, minutes, seconds] = dms;
  const decimal = degrees + minutes / 60 + seconds / 3600;
  return ["S", "W"].includes(ref) ? -decimal : decimal;
}

export async function getPhotoDescription(imagePath, model) {
  const isOllama = model === "Ollama";

  try {
    const client = isOllama
      ? new OpenAI({
          baseURL: process.env.OLLAMA_API_URL || "http://localhost:11434",
          apiKey: "ollama",
        })
      : new OpenAI();
    const imageAsBase64 = await fs.readFile(imagePath, { encoding: "base64" });
    const response = await client.chat.completions.create({
      model: isOllama ? "llama3.2-vision" : "gpt-4-turbo",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PHOTO_DESCRIPTION_PROMPT },
            {
              type: "image_url",
              image_url: `data:image/jpeg;base64,${imageAsBase64}`,
            },
          ],
        },
      ],
    });

    return response.choices[0]?.message?.content || null;
  } catch (error) {
    console.error(
      `Error getting description from ${isOllama ? "Ollama" : "OpenAI"} for ${path.basename(imagePath)}:`,
      error.message,
    );
    return null;
  }
}

export async function reverseGeocode(lat, lon) {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.search = new URLSearchParams({
      format: "json",
      lat: String(lat),
      lon: String(lon),
    });
    const response = await fetch(url, {
      headers: { "User-Agent": "carteakey.dev photo importer" },
    });

    if (!response.ok) {
      throw new Error(`Nominatim returned ${response.status}`);
    }

    const { address = {} } = await response.json();
    return `${address.city || ""}, ${address.state || ""}, ${address.country || ""}`
      .replace(/ ,/g, "")
      .trim();
  } catch (error) {
    console.error("Error reverse geocoding:", error.message);
    return "Unknown";
  }
}
