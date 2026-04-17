#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import yaml from "js-yaml";
import axios from "axios";
import OpenAI from "openai";
import dotenv from "dotenv";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

dotenv.config();

const PHOTOS_YAML_PATH = "src/_data/photos.yaml";
const IMAGE_DIR = "src/static/img/photography";
const FAILED_DIR = "src/inbox/failed";

// --- Utility Functions (from add-photo.mjs) ---

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

function convertDMSToDD(dms, ref) {
  if (!dms || dms.length !== 3) return null;
  const [degrees, minutes, seconds] = dms;
  let dd = degrees + minutes / 60 + seconds / 3600;
  if (ref === "S" || ref === "W") {
    dd = dd * -1;
  }
  return dd;
}

async function getOllamaDescription(imagePath) {
  try {
    const ollamaUrl = (process.env["OLLAMA_API_URL"] || "http://localhost:11434");
    const client = new OpenAI({
      baseURL: ollamaUrl,
      apiKey: "ollama",
    });

    const imageAsBase64 = await fs.readFile(imagePath, { encoding: "base64" });
    const response = await client.chat.completions.create({
      model: "llama3.2-vision",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Generate a one-sentence description for a photography portfolio, focusing on the subject, composition, and mood. Be creative and evocative. After the description, on a new line, provide a title in the format 'Title: [title here]'. The response must only contain the single sentence description and the title.",
            },
            {
              type: "image_url",
              image_url: `data:image/jpeg;base64,${imageAsBase64}`,
            },
          ],
        },
      ],
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error(`Error getting description from Ollama for ${path.basename(imagePath)}:`, error.message);
    return null;
  }
}

async function getOpenAIDescription(imagePath) {
  try {
    const openai = new OpenAI();
    const imageAsBase64 = await fs.readFile(imagePath, { encoding: "base64" });
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Generate a one-sentence description for a photography portfolio, focusing on the subject, composition, and mood. Be creative and evocative. After the description, on a new line, provide a title in the format 'Title: [title here]'. The response must only contain the single sentence description and the title.",
            },
            {
              type: "image_url",
              image_url: `data:image/jpeg;base64,${imageAsBase64}`,
            },
          ],
        },
      ],
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error(`Error getting description from OpenAI for ${path.basename(imagePath)}:`, error.message);
    return null;
  }
}

async function reverseGeocode(lat, lon) {
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const { address } = response.data;
    return `${address.city || ""}, ${address.state || ""}, ${address.country || ""}`.replace(/ ,/g, "").trim();
  } catch (error) {
    console.error("Error reverse geocoding:", error.message);
    return "Unknown";
  }
}

async function processImage(imagePath, argv) {
  console.log(`\nProcessing ${imagePath}...`);

  try {
    // Get image metadata
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    const { width, height, exif } = metadata;
    const exifReader = (await import("exif-reader")).default;
    const exifData = exif ? exifReader(exif) : {};

    const device = exifData?.Image?.Model || "Unknown";
    const make = exifData?.Image?.Make || "Unknown";
    const lens = exifData?.Photo?.LensModel || "Unknown";
    const focalLength = exifData?.Photo?.FocalLength ? `${exifData.Photo.FocalLength}mm` : "Unknown";
    const aperture = exifData?.Photo?.FNumber ? `f/${exifData.Photo.FNumber}` : "Unknown";
    const iso = exifData?.Photo?.ISOSpeedRatings || "Unknown";
    const shutterSpeed = exifData?.Photo?.ExposureTime ? `1/${Math.round(1 / exifData.Photo.ExposureTime)}s` : "Unknown";
    const exifDate = exifData?.Photo?.DateTimeOriginal ? new Date(exifData.Photo.DateTimeOriginal) : null;
    const gps = exifData?.GPSInfo;
    let locationFromExif = "Unknown";
    if (gps && gps.GPSLatitude && gps.GPSLongitude && gps.GPSLatitudeRef && gps.GPSLongitudeRef) {
      const lat = convertDMSToDD(gps.GPSLatitude, gps.GPSLatitudeRef);
      const lon = convertDMSToDD(gps.GPSLongitude, gps.GPSLongitudeRef);
      if (lat !== null && lon !== null) {
        locationFromExif = await reverseGeocode(lat, lon);
      }
    }

    // Generate description and title
    let description, title;
    let rawDescription;
    console.log(`Using ${argv.model} model for description...`);
    if (argv.model === "Ollama") {
      rawDescription = await getOllamaDescription(imagePath);
    } else {
      rawDescription = await getOpenAIDescription(imagePath);
    }

    if (!rawDescription) {
      throw new Error("Failed to get description from AI model.");
    }

    const titleMatch = rawDescription.match(/Title: (.*)/);
    title = titleMatch ? titleMatch[1].trim() : "Untitled";
    description = rawDescription.replace(/Title: .*/, "").trim();

    if (title === "Untitled" || description.length === 0) {
      throw new Error(`Could not parse title or description from the AI response. Raw response: ${rawDescription}`);
    }

    // Move and rename the image
    const imageExt = path.extname(imagePath);
    const imageName = `${slugify(title)}${imageExt}`;
    const categoryDir = path.join(IMAGE_DIR, argv.category);
    const newImagePath = path.join(categoryDir, imageName);

    // Update photos.yaml
    const photosYaml = await fs.readFile(PHOTOS_YAML_PATH, "utf-8");
    const photos = yaml.load(photosYaml);

    const newPhoto = {
      title,
      category: argv.category,
      path: `/img/photography/${argv.category}/${imageName}`,
      device,
      make,
      lens,
      focalLength,
      aperture,
      iso,
      shutterSpeed,
      date: exifDate ? exifDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      width,
      height,
      description,
    };

    if (argv.category === "real") {
      newPhoto.location = locationFromExif;
    } else if (argv.category === "virtual") {
      newPhoto.game = "Unknown"; // Default values, can be changed later
      newPhoto.platform = "Unknown";
    }

    photos.unshift(newPhoto);

    if (argv.dryRun) {
      console.log("\n--- DRY RUN ---");
      console.log("New photo data:");
      console.log(JSON.stringify(newPhoto, null, 2));
      console.log("\nImage would be moved to:", newImagePath);
      console.log("Original image would be deleted:", imagePath);
    } else {
      await fs.mkdir(categoryDir, { recursive: true });
      await fs.writeFile(PHOTOS_YAML_PATH, yaml.dump(photos));
      await fs.rename(imagePath, newImagePath); // Move the file
      console.log(`Successfully processed and moved ${title} to ${newImagePath}`);
    }
    return true;
  } catch (error) {
    console.error(`Failed to process ${imagePath}:`, error.message);
    if (!argv.dryRun) {
      await fs.mkdir(FAILED_DIR, { recursive: true });
      const failedPath = path.join(FAILED_DIR, path.basename(imagePath));
      await fs.rename(imagePath, failedPath);
      console.log(`Moved failed image to ${failedPath}`);
    }
    return false;
  }
}

async function main() {
  const argv = yargs(hideBin(process.argv))
    .option("inbox-dir", {
      alias: "i",
      type: "string",
      description: "Directory with images to process",
      default: "src/static/img/photography/inbox",
    })
    .option("model", {
      alias: "m",
      type: "string",
      description: "AI model to use for description",
      choices: ["Ollama", "OpenAI"],
      default: "Ollama",
    })
    .option("category", {
      alias: "c",
      type: "string",
      description: "Category for the photos",
      choices: ["real", "virtual"],
      required: true,
    })
    .option("dry-run", {
      alias: "d",
      type: "boolean",
      description: "Run the script without saving changes",
    })
    .help().argv;

  try {
    const files = await fs.readdir(argv.inboxDir);
    const imageFiles = files.filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file));

    if (imageFiles.length === 0) {
      console.log(`No images found in ${argv.inboxDir}.`);
      return;
    }

    console.log(`Found ${imageFiles.length} images to process.`);

    for (const imageFile of imageFiles) {
      const imagePath = path.join(argv.inboxDir, imageFile);
      await processImage(imagePath, argv);
    }

    console.log("\nBulk processing complete.");
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Error: The inbox directory '${argv.inboxDir}' does not exist.`);
    } else {
      console.error("An unexpected error occurred:", error);
    }
  }
}

main().catch((error) => console.error("Critical error in main execution:", error));
