#!/usr/bin/env node
/**
 * Media URL Obfuscation Script
 * Renames all media files to random UUIDs to prevent URL guessing
 * Preserves original filenames in manifest for downloads
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MEDIA_DIR = path.join(__dirname, 'media');
const MANIFEST_PATH = path.join(__dirname, 'media-manifest.json');

function generateUUID() {
    return crypto.randomUUID();
}

function obfuscateFiles() {
    // Read current manifest
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

    const newManifest = {
        images: [],
        videos: []
    };

    // Process images
    console.log('Processing images...');
    const imagesDir = path.join(MEDIA_DIR, 'images');

    for (const item of manifest.images) {
        const oldPath = path.join(__dirname, item.path);
        const ext = path.extname(item.filename);
        const uuid = generateUUID();
        const newFilename = uuid + ext;
        const newPath = path.join(imagesDir, newFilename);

        if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
            console.log(`  ${item.filename} -> ${newFilename}`);

            newManifest.images.push({
                filename: item.filename,  // Keep original for downloads
                path: `media/images/${newFilename}`,
                uuid: uuid
            });
        } else {
            console.warn(`  WARNING: File not found: ${oldPath}`);
        }
    }

    // Process videos
    console.log('\nProcessing videos...');
    const videosDir = path.join(MEDIA_DIR, 'videos');

    for (const item of manifest.videos) {
        const oldPath = path.join(__dirname, item.path);
        const ext = path.extname(item.filename);
        const uuid = generateUUID();
        const newFilename = uuid + ext;
        const newPath = path.join(videosDir, newFilename);

        if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
            console.log(`  ${item.filename} -> ${newFilename}`);

            newManifest.videos.push({
                filename: item.filename,  // Keep original for downloads
                path: `media/videos/${newFilename}`,
                uuid: uuid
            });
        } else {
            console.warn(`  WARNING: File not found: ${oldPath}`);
        }
    }

    // Also rename video thumbnails (stored as JPGs in images folder with same base name)
    console.log('\nProcessing video thumbnails...');
    for (let i = 0; i < manifest.videos.length; i++) {
        const video = manifest.videos[i];
        const videoBasename = path.basename(video.filename, '.mp4');
        const thumbOldPath = path.join(imagesDir, videoBasename + '.jpg');

        if (fs.existsSync(thumbOldPath)) {
            // Use same UUID as the video for matching
            const videoUUID = newManifest.videos[i].uuid;
            const thumbNewPath = path.join(imagesDir, videoUUID + '.jpg');
            fs.renameSync(thumbOldPath, thumbNewPath);
            console.log(`  ${videoBasename}.jpg -> ${videoUUID}.jpg`);
        }
    }

    // Write updated manifest
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(newManifest, null, 2));
    console.log('\nManifest updated successfully!');
    console.log(`\nObfuscated ${newManifest.images.length} images and ${newManifest.videos.length} videos.`);
}

// Run the obfuscation
obfuscateFiles();
