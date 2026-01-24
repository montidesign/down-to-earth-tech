/**
 * Script to download featured images from the live site and update post frontmatter
 *
 * Usage: node scripts/download-featured-images.js
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const POSTS_DIR = './src/content/posts';
const MEDIA_DIR = './public/media/blog';
const LIVE_SITE = 'https://downtoearthtech.net';

// Ensure media directory exists
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

// Helper to fetch a URL and return the body
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Follow redirect
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Helper to download an image file
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location, filepath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download: ${res.statusCode}`));
        return;
      }
      const file = fs.createWriteStream(filepath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Delete failed file
        reject(err);
      });
    }).on('error', reject);
  });
}

// Extract featured image from page HTML using schema.org data
function extractFeaturedImage(html) {
  // Try to find primaryImageOfPage in JSON-LD
  const jsonLdMatch = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
        const data = JSON.parse(jsonContent);

        // Look for primaryImageOfPage
        if (data.primaryImageOfPage) {
          const imgData = data.primaryImageOfPage;
          return {
            url: imgData.contentUrl || imgData.url,
            alt: imgData.caption || ''
          };
        }

        // Look in @graph for WebPage with primaryImageOfPage
        if (data['@graph']) {
          for (const item of data['@graph']) {
            if (item['@type'] === 'WebPage' && item.primaryImageOfPage) {
              const imgRef = item.primaryImageOfPage;
              // Find the actual image data
              if (typeof imgRef === 'object' && imgRef['@id']) {
                const imgItem = data['@graph'].find(i => i['@id'] === imgRef['@id']);
                if (imgItem) {
                  return {
                    url: imgItem.contentUrl || imgItem.url,
                    alt: imgItem.caption || ''
                  };
                }
              }
            }
            // Also check ImageObject directly
            if (item['@type'] === 'ImageObject' && item.contentUrl) {
              return {
                url: item.contentUrl,
                alt: item.caption || ''
              };
            }
          }
        }
      } catch (e) {
        // Continue if JSON parse fails
      }
    }
  }

  // Fallback: try og:image meta tag
  const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  if (ogMatch) {
    return { url: ogMatch[1], alt: '' };
  }

  // Fallback: try twitter:image
  const twitterMatch = html.match(/<meta\s+name="twitter:image"\s+content="([^"]+)"/i);
  if (twitterMatch) {
    return { url: twitterMatch[1], alt: '' };
  }

  return null;
}

// Parse frontmatter from markdown file
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const frontmatterLines = match[1].split('\n');
  const frontmatter = {};
  let currentKey = null;

  for (const line of frontmatterLines) {
    const keyMatch = line.match(/^(\w+):\s*(.*)$/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      let value = keyMatch[2].trim();
      // Handle quoted strings
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      frontmatter[currentKey] = value;
    }
  }

  return {
    frontmatter,
    body: match[2],
    raw: match[1]
  };
}

// Update frontmatter in markdown file
function updateFrontmatter(filepath, featuredImage, featuredImageAlt) {
  let content = fs.readFileSync(filepath, 'utf-8');
  const parsed = parseFrontmatter(content);

  if (!parsed) {
    console.log(`  Could not parse frontmatter for ${filepath}`);
    return false;
  }

  // Check if featuredImage already exists
  if (parsed.raw.includes('featuredImage:')) {
    // Update existing
    content = content.replace(
      /featuredImage:.*$/m,
      `featuredImage: "${featuredImage}"`
    );
  } else {
    // Add before draft field or at end of frontmatter
    const insertPoint = content.indexOf('draft:');
    if (insertPoint !== -1) {
      content = content.slice(0, insertPoint) +
        `featuredImage: "${featuredImage}"\n` +
        content.slice(insertPoint);
    }
  }

  // Handle featuredImageAlt
  if (parsed.raw.includes('featuredImageAlt:')) {
    content = content.replace(
      /featuredImageAlt:.*$/m,
      `featuredImageAlt: "${featuredImageAlt.replace(/"/g, '\\"')}"`
    );
  } else {
    const insertPoint = content.indexOf('draft:');
    if (insertPoint !== -1) {
      content = content.slice(0, insertPoint) +
        `featuredImageAlt: "${featuredImageAlt.replace(/"/g, '\\"')}"\n` +
        content.slice(insertPoint);
    }
  }

  fs.writeFileSync(filepath, content, 'utf-8');
  return true;
}

// Main function
async function main() {
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  console.log(`Found ${files.length} posts to process\n`);

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const filepath = path.join(POSTS_DIR, file);
    const slug = file.replace('.md', '');

    console.log(`Processing: ${slug}`);

    // Check if already has featured image
    const content = fs.readFileSync(filepath, 'utf-8');
    const parsed = parseFrontmatter(content);

    if (parsed && parsed.frontmatter.featuredImage &&
        !parsed.frontmatter.featuredImage.startsWith('http')) {
      console.log(`  Already has local featured image, skipping`);
      skipped++;
      continue;
    }

    try {
      // Fetch the live page
      const liveUrl = `${LIVE_SITE}/${slug}/`;
      console.log(`  Fetching: ${liveUrl}`);
      const html = await fetchUrl(liveUrl);

      // Extract featured image info
      const imageInfo = extractFeaturedImage(html);

      if (!imageInfo || !imageInfo.url) {
        console.log(`  No featured image found`);
        failed++;
        continue;
      }

      console.log(`  Found image: ${imageInfo.url}`);

      // Download the image
      const imageUrl = imageInfo.url;
      const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
      const imageName = `${slug}${ext}`;
      const localPath = path.join(MEDIA_DIR, imageName);

      if (fs.existsSync(localPath)) {
        console.log(`  Image already downloaded`);
      } else {
        console.log(`  Downloading to: ${localPath}`);
        await downloadImage(imageUrl, localPath);
      }

      // Update frontmatter
      const publicPath = `/media/blog/${imageName}`;
      const altText = imageInfo.alt || `Featured image for ${parsed?.frontmatter?.title || slug}`;

      if (updateFrontmatter(filepath, publicPath, altText)) {
        console.log(`  Updated frontmatter`);
        processed++;
      }

      // Small delay to avoid hammering the server
      await new Promise(r => setTimeout(r, 200));

    } catch (error) {
      console.log(`  Error: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Processed: ${processed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
}

main().catch(console.error);
