import crypto from "crypto";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with proper precedence
 * Used by ShadCN components
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a short code from a long URL using SHA-256 hash
 * @param url - The original long URL
 * @param length - Desired length of the short code (default: 7)
 * @returns A unique short code
 */
export function generateShortCode(url: string, length: number = 7): string {
  // Create SHA-256 hash of the URL
  const hash = crypto.createHash("sha256").update(url).digest("hex");

  // Take first 'length' characters of the hash
  // Using base62 encoding for URL-friendly characters
  const shortCode = hash.substring(0, length);

  return shortCode;
}

/**
 * Generates a random short code (alternative method)
 * Useful when hash collisions occur
 * @param length - Desired length of the short code (default: 7)
 * @returns A random short code
 */
export function generateRandomShortCode(length: number = 7): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }

  return result;
}

/**
 * Validates if a URL is valid
 * @param url - URL to validate
 * @returns boolean
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
