"use server";

import { DEFAULT_COOKIE_OPTIONS } from "@lib/environment";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";

/**
 * Retrieves the value of a cookie by its name.
 *
 * @param {string} name - The name of the cookie to retrieve.
 * @return {Promise<string | undefined>} A promise that resolves to the cookie value as a string, or undefined if the cookie does not exist.
 */
export async function getFromCookie(name: string): Promise<string | undefined> {
  return (await cookies()).get(name)?.value;
}

/**
 * Retrieves and parses a value of generic type T from a cookie by its name.
 *
 * @param {string} name - The name of the cookie to retrieve the value from.
 * @return {Promise<T | undefined>} A promise that resolves to the parsed value of type T if found and valid, or undefined if the cookie is not found or the value cannot be parsed.
 */
export async function getTFromCookie<T>(name: string): Promise<T | undefined> {
  const value = await getFromCookie(name);
  if (!value) {
    return undefined;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

/**
 * Sets a cookie with the specified name, value, and options.
 *
 * @param {string} name - The name of the cookie to set.
 * @param {string} value - The value to assign to the cookie.
 * @param {ResponseCookie} [options] - Optional settings for the cookie, such as expiration or path.
 * @return {Promise<void>} Resolves when the cookie has been successfully set.
 */
export async function setToCookie(
  name: string,
  value: string,
  options?: Omit<ResponseCookie, "name" | "value">
): Promise<void> {
  (await cookies()).set(name, value, options ?? DEFAULT_COOKIE_OPTIONS);
}

/**
 * Deletes a cookie with the specified name.
 *
 * @param {string} name - The name of the cookie to be deleted.
 * @return {Promise<void>} A promise that resolves when the cookie has been successfully deleted.
 */
export async function deleteFromToCookie(name: string): Promise<void> {
  (await cookies()).delete(name);
}
