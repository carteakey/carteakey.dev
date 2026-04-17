#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import yaml from "js-yaml";
import axios from "axios";
import OpenAI from "openai";
import inquirer from "inquirer";
import dotenv from "dotenv";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

dotenv.config();

const PHOTOS_YAML_PATH = "src/_data/photos.yaml";
const IMAGE_DIR = "src/static/img/photography";

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
    console.log("Using Ollama API URL:", ollamaUrl);
    const client = new OpenAI({
      baseURL: ollamaUrl,
      apiKey: "ollama", // required but unused
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
    console.error("Error getting description from Ollama:", error.message);
    if (error.response) console.error(error.response.data);
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
    console.error("Error getting description from OpenAI:", error.message);
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

async function main() {
  const argv = yargs(hideBin(process.argv))
    .option("dry-run", {
      alias: "d",
      type: "boolean",
      description: "Run the script without saving changes",
    })
    .help().argv;

  const { imagePath } = await inquirer.prompt([
    {
      type: "input",
      name: "imagePath",
      message: "What is the path to the image file?",
      filter: (input) => {
        // Handle paths that are quoted or have escaped spaces, e.g. from drag-and-drop
        return input.trim().replace(/^['"]|['"]$/g, "").replace(/\\ /g, " ");
      },
      validate: async (input) => {
        try {
          await fs.access(input);
          return true;
        } catch {
          return "File not found. Please provide a valid path.";
        }
      },
    },
  ]);

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

  const { model } = await inquirer.prompt([
    {
      type: "list",
      name: "model",
      message: "Which AI model would you like to use for the description?",
      choices: ["Ollama", "OpenAI"],
    },
  ]);

  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "category",
      message: "What is the category of the photo?",
      choices: ["real", "virtual"],
    },
    {
      type: "input",
      name: "date",
      message: "What is the date of the photo (YYYY-MM-DD)?",
      default: exifDate ? exifDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    },
    {
      type: "input",
      name: "location",
      message: "What is the location of the photo?",
      default: locationFromExif,
      when: (answers) => answers.category === "real",
    },
    {
      type: "input",
      name: "game",
      message: "What game is the photo from?",
      when: (answers) => answers.category === "virtual",
    },
    {
      type: "input",
      name: "platform",
      message: "What platform was the game played on?",
      when: (answers) => answers.category === "virtual",
    },
  ]);

  // Combine answers
  const allAnswers = { imagePath, ...answers };

  // Generate description and title
  let description, title;
  let rawDescription;
  if (model === "Ollama") {
    rawDescription = await getOllamaDescription(imagePath);
  } else {
    rawDescription = await getOpenAIDescription(imagePath);
  }

  if (!rawDescription) {
    console.error("Failed to get description. Aborting.");
    return;
  }

  const titleMatch = rawDescription.match(/Title: (.*)/);
  title = titleMatch ? titleMatch[1].trim() : "Untitled";
  description = rawDescription.replace(/Title: .*/, "").trim();

  if (title === "Untitled" || description.length === 0) {
    console.error("Could not parse title or description from the AI response. Aborting.");
    console.log("Raw response:", rawDescription);
    return;
  }

  // Move and rename the image
  const originalImageName = path.basename(imagePath);
  const imageExt = path.extname(originalImageName);
  let imageName;
  if (title !== "Untitled" && title.length > 0) {
    imageName = `${slugify(title)}${imageExt}`;
  } else {
    imageName = originalImageName;
  }
  const newImagePath = path.join(IMAGE_DIR, allAnswers.category, imageName);

  // Update photos.yaml
  const photosYaml = await fs.readFile(PHOTOS_YAML_PATH, "utf-8");
  const photos = yaml.load(photosYaml);

  const newPhoto = {
    title,
    category: allAnswers.category,
    path: `/img/photography/${allAnswers.category}/${imageName}`,
    device,
    make,
    lens,
    focalLength,
    aperture,
    iso,
    shutterSpeed,
    date: allAnswers.date,
    width,
    height,
    description,
  };

  if (allAnswers.category === "real") {
    newPhoto.location = allAnswers.location || "Unknown";
  } else if (allAnswers.category === "virtual") {
    newPhoto.game = allAnswers.game || "Unknown";
    newPhoto.platform = allAnswers.platform || "Unknown";
  }

  photos.unshift(newPhoto);

  if (argv.dryRun) {
    console.log("\n--- DRY RUN ---");
    console.log("New photo data:");
    console.log(JSON.stringify(newPhoto, null, 2));
    console.log("\nImage would be copied to:", newImagePath);
  } else {
    await fs.writeFile(PHOTOS_YAML_PATH, yaml.dump(photos));
    await fs.copyFile(imagePath, newImagePath);
    console.log(`Successfully added ${title} to photos.yaml`);
  }
}

main().catch((error) => console.error("Error processing image:", error));
