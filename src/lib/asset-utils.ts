// Utility functions for handling assets with basePath

/**
 * Get the correct path for static assets based on environment
 * @param assetPath - The path to the asset (e.g., '/exozen_logo.png')
 * @returns The correct path for the current environment
 */
export function getAssetPath(assetPath: string): string {
  // For production with basePath, we need to ensure the path is correct
  if (process.env.NODE_ENV === 'production') {
    // Remove leading slash if present and add basePath
    const cleanPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
    return `/v1/asset/${cleanPath}`;
  }
  
  // For development, return as-is
  return assetPath;
}

/**
 * Get the base URL for the application
 * @returns The base URL for the current environment
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side
    return window.location.origin;
  }
  
  // Server-side - return based on environment
  if (process.env.NODE_ENV === 'production') {
    return 'https://exozen.co.in';
  }
  
  return 'http://localhost:3000';
}

/**
 * Get the full URL for a static asset
 * @param assetPath - The path to the asset
 * @returns The full URL for the asset
 */
export function getAssetUrl(assetPath: string): string {
  const baseUrl = getBaseUrl();
  const assetPathWithBase = getAssetPath(assetPath);
  
  return `${baseUrl}${assetPathWithBase}`;
}
