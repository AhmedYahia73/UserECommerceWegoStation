/**
 * Resolves localized text from a JSON translation object.
 * Returns text in the requested language, or falls back to defaultLang or the first available language key.
 */
export function getLocalizedText(
  value: any,
  requestedLang?: string,
  defaultLang = "ar"
): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "object") {
    if (requestedLang && value[requestedLang]) {
      return value[requestedLang];
    }
    if (value[defaultLang]) {
      return value[defaultLang];
    }
    const values = Object.values(value);
    if (values.length > 0 && typeof values[0] === "string") {
      return values[0] as string;
    }
  }
  return "";
}

/**
 * Builds Google Maps URL from lat and lng coordinates
 */
export function getGoogleMapsUrl(
  lat?: string | number | null,
  lng?: string | number | null
): string | null {
  if (lat !== undefined && lat !== null && lng !== undefined && lng !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return null;
}
