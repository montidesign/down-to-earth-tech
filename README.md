# Down to Earth Technology Website

Corporate website and blog for Down to Earth Technology, built with Astro and Tailwind CSS.

## Tech Stack

- **Framework**: [Astro](https://astro.build) v5
- **Styling**: [Tailwind CSS](https://tailwindcss.com) v4
- **CMS**: [Decap CMS](https://decapcms.org) (formerly Netlify CMS)
- **Hosting**: Cloudflare Pages
- **Fonts**: Montserrat, Cuprum, Roboto (via Fontsource)

## Project Structure

```
/
├── public/
│   ├── admin/           # Decap CMS admin interface
│   │   ├── index.html
│   │   └── config.yml
│   └── media/
│       └── blog/        # Blog post featured images
├── src/
│   ├── components/      # Reusable Astro components
│   ├── content/
│   │   └── posts/       # Blog posts (Markdown files)
│   ├── layouts/         # Page layouts
│   └── pages/           # Route pages
├── scripts/             # Utility scripts
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The site will be available at `http://localhost:4321`

## Content Management System (CMS)

The blog is managed through Decap CMS, a Git-based headless CMS that provides a user-friendly editing interface.

### Accessing the CMS

#### Local Development

1. Start the CMS proxy server (required for local editing):
   ```bash
   npm run cms
   ```

2. In a separate terminal, start the dev server:
   ```bash
   npm run dev
   ```

   Or run both together:
   ```bash
   npm run dev:cms
   ```

3. Open the CMS admin interface:
   ```
   http://localhost:4321/admin/index.html
   ```

4. Click "Login" to access the editorial interface.

#### Production

On the live site, access the CMS at:
```
https://your-domain.com/admin/index.html
```

You'll need to authenticate with your Netlify Identity or Git Gateway credentials.

### Using the CMS

#### Creating a New Post

1. Navigate to the CMS admin (`/admin/index.html`)
2. Click "Blog Posts" in the left sidebar
3. Click "New Blog Posts" button
4. Fill in the required fields:
   - **Title**: Post headline
   - **Publish Date**: When the post should be dated
   - **Author**: Select from the dropdown
   - **Category**: Select the topic category
   - **Category Slug**: Select the matching URL slug
   - **Featured Image**: Upload or select an image
   - **Body**: Write your content using the rich text editor

5. Click "Publish" to save and publish, or "Save" to save as draft

#### Editing Existing Posts

1. Navigate to the CMS admin
2. Click "Blog Posts"
3. Select the post you want to edit
4. Make your changes
5. Click "Publish" to save

#### Post Fields

| Field | Required | Description |
|-------|----------|-------------|
| Title | Yes | The post headline |
| Meta Description | No | SEO description (150-160 chars ideal) |
| Excerpt | No | Short summary for archive pages |
| Publish Date | Yes | Publication date |
| Author | Yes | Post author name |
| Category | Yes | Topic category |
| Category Slug | Yes | URL-friendly category name |
| Featured Image | No | Main image for post |
| Featured Image Alt | No | Accessibility text for image |
| Draft | No | Toggle to hide from live site |
| Body | Yes | Main post content (Markdown) |

### Media Management

- Blog images are stored in `public/media/blog/`
- Upload images through the CMS media library
- Images are automatically served from `/media/blog/` on the live site

## Commands

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server at `localhost:4321` |
| `npm run cms` | Start Decap CMS proxy server |
| `npm run dev:cms` | Start both CMS proxy and dev server |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |

## Deployment

The site is deployed to Cloudflare Pages with automatic builds triggered on push to the `master` branch.

### Initial Setup

#### Step 1: Create GitHub OAuth App

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: `Down to Earth Tech CMS`
   - **Homepage URL**: `https://your-site.pages.dev` (or your custom domain)
   - **Authorization callback URL**: `https://your-site.pages.dev/api/callback`
4. Click "Register application"
5. Copy the **Client ID**
6. Click "Generate a new client secret" and copy the **Client Secret**

#### Step 2: Create Cloudflare Pages Project

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Workers & Pages** → **Create application** → **Pages**
3. Click **Connect to Git**
4. Select your GitHub repository
5. Configure the build settings:
   - **Project name**: `down-to-earth-tech` (or your preferred name)
   - **Production branch**: `master`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. Click **Save and Deploy**

#### Step 3: Add Environment Variables

1. In your Cloudflare Pages project, go to **Settings** → **Environment variables**
2. Add the following variables (for Production):

   | Variable | Value |
   |----------|-------|
   | `GITHUB_CLIENT_ID` | Your GitHub OAuth App Client ID |
   | `GITHUB_CLIENT_SECRET` | Your GitHub OAuth App Client Secret |

3. Click **Save**

#### Step 4: Update CMS Configuration

Update `public/admin/config.yml` with your actual values:

```yaml
backend:
  name: github
  repo: your-username/your-repo  # e.g., down-to-earth-tech/website
  branch: master
  base_url: https://your-site.pages.dev  # Your Cloudflare Pages URL
  auth_endpoint: /api/auth
```

#### Step 5: (Optional) Add Custom Domain

1. In Cloudflare Pages, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `downtoearthtech.net`)
4. Follow the DNS configuration instructions
5. Update the GitHub OAuth App callback URL to use your custom domain

### Build Settings

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Node.js version**: 18+

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth App Client Secret |

### Automatic Deployments

Once configured, Cloudflare Pages will automatically:
- Build and deploy when you push to `master`
- Create preview deployments for pull requests
- Provide deployment URLs for each build

## Blog Categories

- Business Camera Systems
- Business Server
- Business Surveillance Networks
- Computer Network Support
- IT Consulting
- IT Network Support
- Lenovo Servers
- Managed IT Services
- Managed Software IT Consulting Services
- Point of Sale Systems (POS)
- Remote Access Server Support
- Remote IT Services

## Contributing

1. Create a feature branch from `master`
2. Make your changes
3. Test locally with `npm run dev`
4. Submit a pull request

## License

Proprietary - Down to Earth Technology
