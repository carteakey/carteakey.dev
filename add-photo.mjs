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

const OLLAMA_API_URL = process.env.OLLAMA_API_URL ? `${process.env.OLLAMA_API_URL}/api/generate` : "http://localhost:11434/api/generate";
const PHOTOS_YAML_PATH = "src/_data/photos.yaml";
const IMAGE_DIR = "src/static/img/photography";

async function getOllamaDescription(imagePath) {
  try {
    const imageAsBase64 = await fs.readFile(imagePath, { encoding: "base64" });
    const response = await axios.post(OLLAMA_API_URL, {
      model: "llava",
      prompt:
        "Describe this image for a photography portfolio. Focus on the subject, composition, and mood. Be creative and evocative. Generate a title as well, in the format Title: [title here]",
      images: [imageAsBase64],
      stream: false,
    });
    return response.data.response;
  } catch (error) {
    console.error("Error getting description from Ollama:", error.message);
    return null;
  }
}

async function getOpenAIDescription(imagePath) {
  try {
    const openai = new OpenAI();
    const imageAsBase64 = await fs.readFile(imagePath, { encoding: "base64" });
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this image for a photography portfolio. Focus on the subject, composition, and mood. Be creative and evocative. Generate a title as well, in the format Title: [title here]",
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
    return `${address.city || ''}, ${address.state || ''}, ${address.country || ''}`.replace(/ ,/g, '').trim();
  } catch (error) {
    console.error('Error reverse geocoding:', error.message);
    return 'Unknown';
  }
}

async function main() {
  const argv = yargs(hideBin(process.argv))
    .option('dry-run', {
      alias: 'd',
      type: 'boolean',
      description: 'Run the script without saving changes',
    })
    .help()
    .argv;

  const { imagePath } = await inquirer.prompt([
    {
      type: "input",
      name: "imagePath",
      message: "What is the path to the image file?",
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
  const exifReader = (await import('exif-reader')).default;
  const exifData = exif ? exifReader(exif) : {};
  const device = exifData?.image?.Model || "Unknown";
  const make = exifData?.image?.Make || "Unknown";
  const lens = exifData?.exif?.LensModel || "Unknown";
  const focalLength = exifData?.exif?.FocalLength ? `${exifData.exif.FocalLength}mm` : "Unknown";
  const aperture = exifData?.exif?.FNumber ? `f/${exifData.exif.FNumber}` : "Unknown";
  const iso = exifData?.exif?.ISO || "Unknown";
  const shutterSpeed = exifData?.exif?.ExposureTime ? `1/${Math.round(1 / exifData.exif.ExposureTime)}s` : "Unknown";
  const exifDate = exifData?.exif?.DateTimeOriginal ? new Date(exifData.exif.DateTimeOriginal) : null;
  const gps = exifData?.gps;
  let locationFromExif = "Unknown";
  if (gps && gps.GPSLatitude && gps.GPSLongitude) {
    locationFromExif = await reverseGeocode(gps.GPSLatitude, gps.GPSLongitude);
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
      default: exifDate ? exifDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
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
  if (model === 'Ollama') {
    rawDescription = await getOllamaDescription(imagePath);
  } else {
    rawDescription = await getOpenAIDescription(imagePath);
  }

  if (rawDescription) {
    const titleMatch = rawDescription.match(/Title: (.*)/);
    title = titleMatch ? titleMatch[1] : "Untitled";
    description = rawDescription.replace(/Title: .*/, "").trim();
  } else {
    title = "Untitled";
    description = "No description available.";
  }

  // Move and rename the image
  const imageName = path.basename(imagePath);
  const newImagePath = path.join(IMAGE_DIR, allAnswers.category, imageName);
  await fs.copyFile(imagePath, newImagePath);

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

main().catch(error => console.error("Error processing image:", error));
