/**
 * WordPress to Astro Content Collections Migration Script
 *
 * This script parses a WordPress XML export and converts posts to markdown files
 * with proper frontmatter for Astro Content Collections.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const POSTS_DIR = join(ROOT_DIR, 'src', 'content', 'posts');
const MEDIA_DIR = join(ROOT_DIR, 'public', 'media', 'blog');
const XML_FILE = join(ROOT_DIR, 'assets', 'downtoearthtechnology.WordPress.2026-01-23.xml');

// Ensure directories exist
if (!existsSync(POSTS_DIR)) mkdirSync(POSTS_DIR, { recursive: true });
if (!existsSync(MEDIA_DIR)) mkdirSync(MEDIA_DIR, { recursive: true });

// Simple XML parsing helpers
function extractCDATA(text) {
  const match = text.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return match ? match[1] : text.replace(/<[^>]+>/g, '').trim();
}

function extractTag(xml, tagName, namespace = '') {
  const fullTag = namespace ? `${namespace}:${tagName}` : tagName;
  const regex = new RegExp(`<${fullTag}[^>]*>([\\s\\S]*?)</${fullTag}>`, 'i');
  const match = xml.match(regex);
  return match ? extractCDATA(match[1]) : '';
}

function extractAllTags(xml, tagName, namespace = '') {
  const fullTag = namespace ? `${namespace}:${tagName}` : tagName;
  const regex = new RegExp(`<${fullTag}[^>]*>([\\s\\S]*?)</${fullTag}>`, 'gi');
  const matches = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    matches.push(extractCDATA(match[1]));
  }
  return matches;
}

function extractItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    items.push(match[1]);
  }
  return items;
}

function extractCategory(itemXml) {
  const catMatch = itemXml.match(/<category domain="category" nicename="([^"]+)"><!\[CDATA\[([^\]]+)\]\]><\/category>/);
  if (catMatch) {
    return {
      slug: catMatch[1],
      name: catMatch[2]
    };
  }
  return { slug: 'uncategorized', name: 'Uncategorized' };
}

function extractFeaturedImage(itemXml, allXml) {
  // Look for _thumbnail_id in postmeta
  const thumbIdMatch = itemXml.match(/<wp:meta_key><!\[CDATA\[_thumbnail_id\]\]><\/wp:meta_key>\s*<wp:meta_value><!\[CDATA\[(\d+)\]\]><\/wp:meta_value>/);
  if (thumbIdMatch && thumbIdMatch[1]) {
    const attachmentId = thumbIdMatch[1];
    // Find the attachment in the XML
    const attachmentRegex = new RegExp(`<item>[\\s\\S]*?<wp:post_id>${attachmentId}<\\/wp:post_id>[\\s\\S]*?<\\/item>`, 'i');
    const attachmentMatch = allXml.match(attachmentRegex);
    if (attachmentMatch) {
      const guidMatch = attachmentMatch[0].match(/<guid[^>]*><!\[CDATA\[(https?:\/\/[^\]]+)\]\]><\/guid>/);
      if (guidMatch) {
        return guidMatch[1];
      }
    }
  }
  return null;
}

function extractYoastDescription(itemXml) {
  const match = itemXml.match(/<wp:meta_key><!\[CDATA\[_yoast_wpseo_metadesc\]\]><\/wp:meta_key>\s*<wp:meta_value><!\[CDATA\[([\s\S]*?)\]\]><\/wp:meta_value>/);
  return match ? match[1].trim() : '';
}

// Clean Divi/WordPress shortcodes from content
function cleanContent(content) {
  if (!content) return '';

  let cleaned = content;

  // Remove Divi shortcodes
  cleaned = cleaned.replace(/\[et_pb_[^\]]*\]/g, '');
  cleaned = cleaned.replace(/\[\/et_pb_[^\]]*\]/g, '');

  // Remove WordPress block comments
  cleaned = cleaned.replace(/<!-- wp:[^>]+ -->/g, '');
  cleaned = cleaned.replace(/<!-- \/wp:[^>]+ -->/g, '');
  cleaned = cleaned.replace(/<!-- divi:[^>]+ -->/g, '');
  cleaned = cleaned.replace(/<!-- \/divi:[^>]+ -->/g, '');

  // Convert basic HTML to markdown
  // Headings
  cleaned = cleaned.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n');
  cleaned = cleaned.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n');
  cleaned = cleaned.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n');
  cleaned = cleaned.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n');
  cleaned = cleaned.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '\n##### $1\n');
  cleaned = cleaned.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '\n###### $1\n');

  // Links
  cleaned = cleaned.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // Bold/Strong
  cleaned = cleaned.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  cleaned = cleaned.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');

  // Italic/Em
  cleaned = cleaned.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
  cleaned = cleaned.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');

  // Lists
  cleaned = cleaned.replace(/<ul[^>]*>/gi, '\n');
  cleaned = cleaned.replace(/<\/ul>/gi, '\n');
  cleaned = cleaned.replace(/<ol[^>]*>/gi, '\n');
  cleaned = cleaned.replace(/<\/ol>/gi, '\n');
  cleaned = cleaned.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');

  // Blockquotes
  cleaned = cleaned.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '\n> $1\n');

  // Paragraphs
  cleaned = cleaned.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');

  // Line breaks
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');

  // Images - convert to markdown
  cleaned = cleaned.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
  cleaned = cleaned.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');

  // Remove remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  cleaned = cleaned.replace(/&nbsp;/g, ' ');
  cleaned = cleaned.replace(/&amp;/g, '&');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/&quot;/g, '"');
  cleaned = cleaned.replace(/&#8217;/g, "'");
  cleaned = cleaned.replace(/&#8216;/g, "'");
  cleaned = cleaned.replace(/&#8220;/g, '"');
  cleaned = cleaned.replace(/&#8221;/g, '"');
  cleaned = cleaned.replace(/&#8211;/g, '–');
  cleaned = cleaned.replace(/&#8212;/g, '—');
  cleaned = cleaned.replace(/&#038;/g, '&');

  // Clean up multiple newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Trim whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

// Download image to local media folder
async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = join(MEDIA_DIR, filename);

    if (existsSync(filepath)) {
      console.log(`  Image already exists: ${filename}`);
      resolve(`/media/blog/${filename}`);
      return;
    }

    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        downloadImage(response.headers.location, filename).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        console.log(`  Failed to download image: ${url} (${response.statusCode})`);
        resolve(null);
        return;
      }

      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        writeFileSync(filepath, buffer);
        console.log(`  Downloaded: ${filename}`);
        resolve(`/media/blog/${filename}`);
      });
      response.on('error', reject);
    }).on('error', reject);
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
}

function escapeYaml(str) {
  if (!str) return '""';
  // If string contains special characters, wrap in quotes
  if (str.includes(':') || str.includes('#') || str.includes('"') || str.includes("'") || str.includes('\n')) {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return `"${str}"`;
}

async function migratePost(itemXml, allXml, authorMap) {
  const status = extractTag(itemXml, 'status', 'wp');
  const postType = extractTag(itemXml, 'post_type', 'wp');

  // Only process published posts
  if (status !== 'publish' || postType !== 'post') {
    return null;
  }

  const title = extractTag(itemXml, 'title');
  const slug = extractTag(itemXml, 'post_name', 'wp');
  const pubDate = extractTag(itemXml, 'post_date', 'wp');
  const content = extractTag(itemXml, 'encoded', 'content');
  const excerpt = extractTag(itemXml, 'encoded', 'excerpt');
  const creatorLogin = extractTag(itemXml, 'creator', 'dc');
  const category = extractCategory(itemXml);
  const yoastDesc = extractYoastDescription(itemXml);
  const featuredImageUrl = extractFeaturedImage(itemXml, allXml);

  // Get author display name from map
  const author = authorMap[creatorLogin] || 'Down to Earth Technology';

  // Clean content
  const cleanedContent = cleanContent(content);

  // Skip posts with placeholder/lorem ipsum content
  if (cleanedContent.includes('Lorem ipsum') || cleanedContent.length < 200) {
    console.log(`  Skipping placeholder content: ${title}`);
    return null;
  }

  console.log(`\nProcessing: ${title}`);

  // Download featured image if available
  let featuredImagePath = '';
  let featuredImageAlt = '';
  if (featuredImageUrl) {
    const imageExt = featuredImageUrl.split('.').pop().split('?')[0];
    const imageFilename = `${slug}-featured.${imageExt}`;
    const localPath = await downloadImage(featuredImageUrl, imageFilename);
    if (localPath) {
      featuredImagePath = localPath;
      featuredImageAlt = title;
    }
  }

  // Build frontmatter
  const frontmatter = {
    title,
    description: yoastDesc || excerpt || '',
    excerpt: excerpt || yoastDesc || '',
    pubDate: formatDate(pubDate),
    author,
    category: category.name,
    categorySlug: category.slug,
    featuredImage: featuredImagePath,
    featuredImageAlt,
    draft: false
  };

  // Build markdown file content
  let markdown = '---\n';
  markdown += `title: ${escapeYaml(frontmatter.title)}\n`;
  markdown += `description: ${escapeYaml(frontmatter.description)}\n`;
  markdown += `excerpt: ${escapeYaml(frontmatter.excerpt)}\n`;
  markdown += `pubDate: ${frontmatter.pubDate}\n`;
  markdown += `author: ${escapeYaml(frontmatter.author)}\n`;
  markdown += `category: ${escapeYaml(frontmatter.category)}\n`;
  markdown += `categorySlug: ${escapeYaml(frontmatter.categorySlug)}\n`;
  if (frontmatter.featuredImage) {
    markdown += `featuredImage: ${escapeYaml(frontmatter.featuredImage)}\n`;
    markdown += `featuredImageAlt: ${escapeYaml(frontmatter.featuredImageAlt)}\n`;
  }
  markdown += `draft: ${frontmatter.draft}\n`;
  markdown += '---\n\n';
  markdown += cleanedContent;

  // Write file
  const filepath = join(POSTS_DIR, `${slug}.md`);
  writeFileSync(filepath, markdown, 'utf8');
  console.log(`  Created: ${slug}.md`);

  return slug;
}

async function main() {
  console.log('Starting WordPress to Astro migration...\n');

  // Read XML file
  const xml = readFileSync(XML_FILE, 'utf8');

  // Extract author mappings
  const authorMap = {};
  const authorRegex = /<wp:author>[\s\S]*?<wp:author_login><!\[CDATA\[([^\]]+)\]\]><\/wp:author_login>[\s\S]*?<wp:author_display_name><!\[CDATA\[([^\]]+)\]\]><\/wp:author_display_name>[\s\S]*?<\/wp:author>/gi;
  let authorMatch;
  while ((authorMatch = authorRegex.exec(xml)) !== null) {
    authorMap[authorMatch[1]] = authorMatch[2];
  }
  console.log(`Found ${Object.keys(authorMap).length} authors`);

  // Extract all items
  const items = extractItems(xml);
  console.log(`Found ${items.length} items in XML\n`);

  // Process each item
  let migrated = 0;
  let skipped = 0;

  for (const itemXml of items) {
    try {
      const result = await migratePost(itemXml, xml, authorMap);
      if (result) {
        migrated++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`Error processing item:`, error.message);
      skipped++;
    }
  }

  console.log(`\n\nMigration complete!`);
  console.log(`  Migrated: ${migrated} posts`);
  console.log(`  Skipped: ${skipped} items (drafts, pages, placeholders, etc.)`);
}

main().catch(console.error);
