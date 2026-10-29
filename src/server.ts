import { PhotonImage, SamplingFilter, resize } from "@cf-wasm/photon/workerd";

interface Env {
  IMAGES_BUCKET: R2Bucket;
  AUTH_TOKEN?: string;
  CORS_ALLOW_ORIGIN?: string;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    const url = new URL(request.url);

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return handleCorsRequest(request, env);
    }

    // Handle image upload and transformation routes
    if (url.pathname.startsWith("/images")) {
      return handleImageRequest(request, env, url);
    }

    // Serve static files - let Vite handle these in development
    // In production, the Cloudflare plugin serves the built assets

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

function handleCorsRequest(_request: Request, env: Env): Response {
  const corsHeaders = {
    "Access-Control-Allow-Origin": env.CORS_ALLOW_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  return new Response(null, { headers: corsHeaders });
}

function addCorsHeaders(headers: Headers, env: Env): void {
  headers.set("Access-Control-Allow-Origin", env.CORS_ALLOW_ORIGIN || "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function checkAuth(request: Request, env: Env): boolean {
  // If AUTH_TOKEN is not set, allow all requests (public CDN mode)
  if (!env.AUTH_TOKEN) {
    return true;
  }

  // Check for Authorization header
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return false;
  }

  // Support both "Bearer <token>" and plain token formats
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  return token === env.AUTH_TOKEN;
}

async function handleImageRequest(request: Request, env: Env, url: URL): Promise<Response> {
  const pathParts = url.pathname.split("/").filter(Boolean);

  if (pathParts[0] !== "images") {
    return new Response("Invalid path", { status: 400 });
  }

  // POST /images - Upload image (requires auth if AUTH_TOKEN is set)
  if (request.method === "POST" && pathParts.length === 1) {
    if (!checkAuth(request, env)) {
      const headers = new Headers();
      addCorsHeaders(headers, env);
      return new Response("Unauthorized", { status: 401, headers });
    }
    return uploadImage(request, env);
  }

  // GET /images/:id - Retrieve image (public for CDN usage)
  if (request.method === "GET" && pathParts.length === 2) {
    return getImage(request, env, pathParts[1]);
  }

  // GET /images/:id/transform - Transform image using Cloudflare Images
  if (request.method === "GET" && pathParts.length === 3 && pathParts[2] === "transform") {
    return transformImage(request, env, pathParts[1], url);
  }

  // DELETE /images/:id - Delete image (requires auth if AUTH_TOKEN is set)
  if (request.method === "DELETE" && pathParts.length === 2) {
    if (!checkAuth(request, env)) {
      const headers = new Headers();
      addCorsHeaders(headers, env);
      return new Response("Unauthorized", { status: 401, headers });
    }
    return deleteImage(request, env, pathParts[1]);
  }

  return new Response("Method not allowed", { status: 405 });
}

async function uploadImage(request: Request, env: Env): Promise<Response> {
  try {
    if (!request.body) {
      const headers = new Headers();
      addCorsHeaders(headers, env);
      return new Response("Missing request body", { status: 400, headers });
    }

    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.startsWith("image/")) {
      const headers = new Headers();
      addCorsHeaders(headers, env);
      return new Response("Invalid content type, must be an image", { status: 400, headers });
    }

    // Generate a unique key for the image
    const key = `${Date.now()}-${crypto.randomUUID()}`;

    // Upload to R2
    await env.IMAGES_BUCKET.put(key, request.body, {
      httpMetadata: {
        contentType: contentType,
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
      },
    });

    const headers = new Headers();
    addCorsHeaders(headers, env);
    headers.set("Content-Type", "application/json");

    return new Response(
      JSON.stringify({
        success: true,
        key,
        url: `/images/${key}`,
      }),
      { headers },
    );
  } catch (error) {
    console.error("Upload error:", error);
    const headers = new Headers();
    addCorsHeaders(headers, env);
    return new Response("Failed to upload image", { status: 500, headers });
  }
}

async function getImage(request: Request, env: Env, key: string): Promise<Response> {
  try {
    const object = await env.IMAGES_BUCKET.get(key);

    if (object === null) {
      const headers = new Headers();
      addCorsHeaders(headers, env);
      return new Response("Image not found", { status: 404, headers });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);

    // Add CORS headers for CDN usage
    addCorsHeaders(headers, env);

    // Add cache headers for better CDN performance
    // Cache for 1 year (31536000 seconds) - images rarely change
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    // Handle If-None-Match for caching
    const ifNoneMatch = request.headers.get("If-None-Match");
    if (ifNoneMatch && ifNoneMatch === object.httpEtag) {
      return new Response(null, { status: 304, headers });
    }

    return new Response(object.body, {
      headers,
    });
  } catch (error) {
    console.error("Get image error:", error);
    const headers = new Headers();
    addCorsHeaders(headers, env);
    return new Response("Failed to retrieve image", { status: 500, headers });
  }
}

async function transformImage(
  _request: Request,
  env: Env,
  key: string,
  url: URL,
): Promise<Response> {
  try {
    const object = await env.IMAGES_BUCKET.get(key);

    if (object === null) {
      const headers = new Headers();
      addCorsHeaders(headers, env);
      return new Response("Image not found", { status: 404, headers });
    }

    // Get the image bytes
    const imageBytes = await object.arrayBuffer();
    const uint8Array = new Uint8Array(imageBytes);

    // Create PhotonImage instance
    const photonImage = PhotonImage.new_from_byteslice(uint8Array);

    // Get transformation parameters
    const width = url.searchParams.get("width");
    const height = url.searchParams.get("height");
    const quality = url.searchParams.get("quality");
    const format = url.searchParams.get("format");

    // Resize if width or height is specified
    let outputImage = photonImage;
    if (width || height) {
      const newWidth = width ? parseInt(width, 10) : photonImage.get_width();
      const newHeight = height ? parseInt(height, 10) : photonImage.get_height();

      // Calculate aspect ratio if only one dimension is specified
      let finalWidth = newWidth;
      let finalHeight = newHeight;

      if (width && !height) {
        const aspectRatio = photonImage.get_height() / photonImage.get_width();
        finalHeight = Math.round(newWidth * aspectRatio);
      } else if (height && !width) {
        const aspectRatio = photonImage.get_width() / photonImage.get_height();
        finalWidth = Math.round(newHeight * aspectRatio);
      }

      // Resize and get the new image
      outputImage = resize(photonImage, finalWidth, finalHeight, SamplingFilter.Lanczos3);
    }

    // Convert to requested format (default to JPEG)
    let outputBytes;
    let outputContentType = "image/jpeg";

    if (format === "webp") {
      outputBytes = outputImage.get_bytes_webp();
      outputContentType = "image/webp";
    } else {
      // Default to JPEG (with quality if specified)
      const jpegQuality = quality ? parseInt(quality, 10) : 80;
      outputBytes = outputImage.get_bytes_jpeg(jpegQuality);
    }

    // Clean up
    photonImage.free();
    if (outputImage !== photonImage) {
      outputImage.free();
    }

    const headers = new Headers();
    addCorsHeaders(headers, env);
    headers.set("Content-Type", outputContentType);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(outputBytes as unknown as BodyInit, { headers });
  } catch (error) {
    console.error("Transform image error:", error);
    const headers = new Headers();
    addCorsHeaders(headers, env);
    return new Response(
      `Failed to transform image: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 500, headers },
    );
  }
}

async function deleteImage(_request: Request, env: Env, key: string): Promise<Response> {
  try {
    await env.IMAGES_BUCKET.delete(key);

    const headers = new Headers();
    addCorsHeaders(headers, env);
    headers.set("Content-Type", "application/json");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Image deleted successfully",
      }),
      { headers },
    );
  } catch (error) {
    console.error("Delete image error:", error);
    const headers = new Headers();
    addCorsHeaders(headers, env);
    return new Response("Failed to delete image", { status: 500, headers });
  }
}
