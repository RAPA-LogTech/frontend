/**
 * Format utilities for consistent data presentation
 */

/**
 * Format ISO timestamp to HH:MM:SS format
 * @param timestamp ISO 8601 timestamp string (e.g., "2026-03-02T10:30:21Z")
 * @returns Formatted time string (e.g., "10:30:21")
 */
export const formatTimestamp = (timestamp: string | number): string => {
  try {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  } catch {
    return timestamp as string;
  }
};
