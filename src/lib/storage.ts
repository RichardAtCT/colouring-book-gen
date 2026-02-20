import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export async function uploadImage(
  buffer: Buffer,
  key: string,
  _contentType = "image/png"
): Promise<string> {
  const filePath = path.join(UPLOADS_DIR, key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
  return `/uploads/${key}`;
}

export async function getImage(key: string): Promise<Buffer> {
  const filePath = path.join(UPLOADS_DIR, key);
  return readFile(filePath);
}

export function generateImageKey(generationId: string, suffix = ""): string {
  const date = new Date().toISOString().slice(0, 10);
  return `generations/${date}/${generationId}${suffix}.png`;
}

/**
 * Read image bytes from a data: URL, local /uploads/ path, or remote http URL.
 */
export async function readImageFromUrl(url: string): Promise<Buffer> {
  if (url.startsWith("data:")) {
    const base64 = url.split(",")[1];
    return Buffer.from(base64!, "base64");
  }

  if (url.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", url);
    return readFile(filePath);
  }

  // Remote URL fallback
  const response = await fetch(url);
  return Buffer.from(await response.arrayBuffer());
}
