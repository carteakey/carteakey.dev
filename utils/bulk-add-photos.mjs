#!/usr/bin/env node
import fs from "fs/promises";
import { readFileSync } from "fs";
import path from "path";
import sharp from "sharp";
import { load, dump } from "js-yaml";
import dotenv from "dotenv";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
  convertDMSToDD,
  getPhotoDescription,
  reverseGeocode,
  slugify,
} from "./photo-helpers.mjs";

dotenv.config();

const PHOTOS_YAML_PATH = "src/_data/photos.yaml";
const IMAGE_DIR = "src/static/img/photography";
const FAILED_DIR = "src/inbox/failed";

async function processImage(imagePath, argv) {
  console.log(`\nProcessing ${imagePath}...`);

  try {
    // Get image metadata
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    const { exif } = metadata;
    // With --max-edge the file is re-encoded upright and smaller, without
    // metadata (so no GPS ships); record the dimensions it will have.
    const upright = (metadata.orientation || 1) >= 5;
    const srcW = upright ? metadata.height : metadata.width;
    const srcH = upright ? metadata.width : metadata.height;
    const scale = argv.maxEdge
      ? Math.min(1, argv.maxEdge / Math.max(srcW, srcH))
      : 1;
    const width = Math.round(srcW * scale);
    const height = Math.round(srcH * scale);
    const exifReader = (await import("exif-reader")).default;
    const exifData = exif ? exifReader(exif) : {};

    const device = exifData?.Image?.Model || "Unknown";
    const make = exifData?.Image?.Make || "Unknown";
    const lens = exifData?.Photo?.LensModel || "Unknown";
    const focalLength = exifData?.Photo?.FocalLength
      ? `${exifData.Photo.FocalLength}mm`
      : "Unknown";
    const aperture = exifData?.Photo?.FNumber
      ? `f/${exifData.Photo.FNumber}`
      : "Unknown";
    const iso = exifData?.Photo?.ISOSpeedRatings || "Unknown";
    const shutterSpeed = exifData?.Photo?.ExposureTime
      ? `1/${Math.round(1 / exifData.Photo.ExposureTime)}s`
      : "Unknown";
    const exifDate = exifData?.Photo?.DateTimeOriginal
      ? new Date(exifData.Photo.DateTimeOriginal)
      : null;
    const gps = exifData?.GPSInfo;
    let locationFromExif = "Unknown";
    if (
      gps &&
      gps.GPSLatitude &&
      gps.GPSLongitude &&
      gps.GPSLatitudeRef &&
      gps.GPSLongitudeRef
    ) {
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
    rawDescription = await getPhotoDescription(imagePath, argv.model);

    if (!rawDescription) {
      throw new Error("Failed to get description from AI model.");
    }

    const titleMatch = rawDescription.match(/Title: (.*)/);
    title = titleMatch ? titleMatch[1].trim() : "Untitled";
    description = rawDescription.replace(/Title: .*/, "").trim();

    if (title === "Untitled" || description.length === 0) {
      throw new Error(
        `Could not parse title or description from the AI response. Raw response: ${rawDescription}`,
      );
    }

    // Move and rename the image
    const imageExt = argv.maxEdge ? ".jpeg" : path.extname(imagePath);
    const imageName = `${slugify(title)}${imageExt}`;
    const categoryDir = path.join(IMAGE_DIR, argv.category);
    const newImagePath = path.join(categoryDir, imageName);

    // Update photos.yaml
    const photosYaml = await fs.readFile(PHOTOS_YAML_PATH, "utf-8");
    const photos = load(photosYaml);

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
      date: exifDate
        ? exifDate.toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      width,
      height,
      description,
    };

    // --meta: extra fields from a cartebase manifest, keyed by file stem (osxphotos --filename "{uuid}").
    const extra = argv.meta?.photos?.[path.parse(imagePath).name];
    if (extra) {
      newPhoto.aestheticScore = extra.aesthetic;
      newPhoto.source = "cartebase-top-aesthetic";
    }

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
      await fs.writeFile(PHOTOS_YAML_PATH, dump(photos));
      if (argv.maxEdge) {
        await sharp(imagePath)
          .rotate()
          .resize({
            width: argv.maxEdge,
            height: argv.maxEdge,
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({ quality: 85, mozjpeg: true })
          .toFile(newImagePath);
        await fs.unlink(imagePath);
      } else {
        await fs.rename(imagePath, newImagePath); // Move the file
      }
      console.log(
        `Successfully processed and moved ${title} to ${newImagePath}`,
      );
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
    .option("max-edge", {
      type: "number",
      description:
        "Resize to this long edge and re-encode as JPEG without metadata (drops GPS)",
    })
    .option("meta", {
      type: "string",
      description:
        "cartebase manifest.json; adds aestheticScore to matching photos",
      coerce: (file) => JSON.parse(readFileSync(file, "utf-8")),
    })
    .help().argv;

  try {
    const files = await fs.readdir(argv.inboxDir);
    const imageFiles = files.filter((file) =>
      /\.(jpg|jpeg|png|webp)$/i.test(file),
    );

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
    if (error.code === "ENOENT") {
      console.error(
        `Error: The inbox directory '${argv.inboxDir}' does not exist.`,
      );
    } else {
      console.error("An unexpected error occurred:", error);
    }
  }
}

main().catch((error) =>
  console.error("Critical error in main execution:", error),
);
