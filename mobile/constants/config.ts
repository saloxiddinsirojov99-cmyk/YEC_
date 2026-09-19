export const DEFAULT_API_URL = 'https://yec-market-backend.onrender.com/api/v1';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '') ||
  DEFAULT_API_URL;

// Derive root URL by stripping trailing /api/v1 or /api
export const BACKEND_ROOT_URL = API_URL
  .replace(/\/api(\/v1)?\/?$/, '');

export const API_TIMEOUT_MS = 15000;

export const CLIENT_PLATFORM = 'mobile';
