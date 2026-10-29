# Image Upload Service

A simple image upload service built with Cloudflare Workers, R2 storage, and React.

## Features

- **Upload images** to R2 storage
- **Retrieve images** from R2
- **Delete images** from R2
- **Transform images** - Resize, change format, and adjust quality using WebAssembly
- **React UI** for easy image management
- **CDN support** with aggressive caching and CORS configuration

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create an R2 bucket:

   ```bash
   npx wrangler r2 bucket create image-uploads
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

   Note: Cloudflare authentication is required. Run `wrangler login` first.

## Available Scripts

- `npm run dev` - Start development server
- `npm run deploy` - Build and deploy to Cloudflare
- `npm run types` - Generate TypeScript types from Wrangler
- `npm run format` - Format code with oxfmt
- `npm run lint` - Lint code with oxlint
- `npm run check` - Run format, lint, and typecheck

## API Endpoints

### Upload Image

```bash
POST /images
Content-Type: image/jpeg

<image bytes>
```

Response:

```json
{
  "success": true,
  "key": "1234567890-uuid",
  "url": "/images/1234567890-uuid"
}
```

### Get Image

```bash
GET /images/:key
```

Returns the image bytes with appropriate content-type headers.

### Transform Image

```bash
GET /images/:key/transform?width=300&height=300&quality=80&format=webp
```

Transform images using WebAssembly (@cf-wasm/photon). Supports resizing, format conversion, and quality adjustment.

Parameters:

- `width` - Target width in pixels (optional, preserves aspect ratio if only width or height is specified)
- `height` - Target height in pixels (optional, preserves aspect ratio if only width or height is specified)
- `quality` - Image quality for JPEG output (1-100, default: 80)
- `format` - Output format (webp, jpg, default: jpg)

Returns the transformed image bytes with appropriate content-type headers.

### Delete Image

```bash
DELETE /images/:key
```

Response:

```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

## Web UI

The service includes a React-based web interface with three main sections:

### Upload Section
- Select and upload image files
- Shows upload progress and status
- Displays upload result with image key

### View Section
- Enter image key to retrieve images
- Preview uploaded images
- Delete images from storage

### Transform Section
- Transform images with resize, format conversion, and quality adjustment
- Preview transformed images
- Download transformed images to local storage

## Deploy

```bash
npm run deploy
```

This will build the project and deploy it to Cloudflare Workers using Wrangler.

## CDN Usage

This service can be used as a CDN for image hosting with CORS support and caching.

### Public CDN Mode (Default)

By default, images are publicly accessible and can be served from any origin:

```bash
# Upload an image (no auth required by default)
curl -X POST https://your-worker.workers.dev/images \
  -H "Content-Type: image/jpeg" \
  --data @image.jpg

# Response:
# {"success":true,"key":"1234567890-uuid","url":"/images/1234567890-uuid"}

# Access the image from any website
<img src="https://your-worker.workers.dev/images/1234567890-uuid" />
```

### Private CDN Mode (Optional)

To restrict upload and delete operations, set an `AUTH_TOKEN` environment variable:

```bash
# In wrangler.jsonc or via wrangler secret
npx wrangler secret put AUTH_TOKEN
```

Then use the token in requests:

```bash
# Upload with auth
curl -X POST https://your-worker.workers.dev/images \
  -H "Content-Type: image/jpeg" \
  -H "Authorization: Bearer your-secret-token" \
  --data @image.jpg

# Delete with auth
curl -X DELETE https://your-worker.workers.dev/images/1234567890-uuid \
  -H "Authorization: Bearer your-secret-token"
```

**Note:** GET requests (viewing images) remain public even with AUTH_TOKEN set, allowing CDN functionality while protecting management operations.

### CORS Configuration

To restrict access to specific origins, set `CORS_ALLOW_ORIGIN` in `wrangler.jsonc`:

```jsonc
{
  "vars": {
    "CORS_ALLOW_ORIGIN": "https://yourdomain.com",
  },
}
```

Or set it as a secret:

```bash
npx wrangler secret put CORS_ALLOW_ORIGIN
```

### Caching

Images are cached with aggressive caching headers:

- `Cache-Control: public, max-age=31536000, immutable` (1 year)
- ETag support for conditional requests
- 304 Not Modified responses for cached content

This ensures optimal CDN performance and reduced bandwidth costs.

## Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Cloudflare Workers (TypeScript)
- **Storage**: Cloudflare R2 (object storage)
- **Image Processing**: @cf-wasm/photon (WebAssembly)
- **Styling**: Tailwind CSS
- **Tools**: Wrangler (Cloudflare CLI), oxlint, oxfmt

## Project Structure

```
src/
  server.ts              # Cloudflare Worker with image API endpoints
  app.tsx                # Main React component with state management
  client.tsx             # React entry point
  components/
    UploadSection.tsx    # Image upload UI component
    ViewSection.tsx      # Image view/delete UI component
    TransformSection.tsx # Image transformation UI component
  styles.css             # Basic styles (imported but not actively used)
```

## License

MIT
