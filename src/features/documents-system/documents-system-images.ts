import "server-only";
import { join } from "node:path";
import sharp from "sharp";

export type StaticImageSize = {
  width: number;
  height: number;
};

const cache = new Map<string, Promise<StaticImageSize>>();

const FALLBACK: StaticImageSize = { width: 1600, height: 900 };

const resolveAbsolute = (publicPath: string): string => {
  const trimmed = publicPath.startsWith("/") ? publicPath.slice(1) : publicPath;
  return join(process.cwd(), "public", trimmed);
};

const readSize = async (absolutePath: string): Promise<StaticImageSize> => {
  try {
    const meta = await sharp(absolutePath).metadata();
    if (meta.width && meta.height) {
      return { width: meta.width, height: meta.height };
    }
  } catch {
    // fall through
  }
  return FALLBACK;
};

export const getStaticImageSize = (publicPath: string): Promise<StaticImageSize> => {
  const cached = cache.get(publicPath);
  if (cached) return cached;

  const pending = readSize(resolveAbsolute(publicPath));
  cache.set(publicPath, pending);
  return pending;
};
