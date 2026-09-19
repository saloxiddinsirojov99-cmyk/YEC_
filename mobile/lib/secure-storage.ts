import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'yec_access_token';
const REFRESH_TOKEN_KEY = 'yec_refresh_token';

// In-memory fallback for web environment (Expo Web preview)
const memoryStore = new Map<string, string>();

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryStore.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return memoryStore.get(key) ?? null;
  }
  return await SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryStore.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

/**
 * Access Token Management
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    return await getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('[SecureStorage] Error getting access token:', error);
    return null;
  }
}

export async function setAccessToken(token: string): Promise<void> {
  try {
    await setItem(ACCESS_TOKEN_KEY, token);
  } catch (error) {
    console.error('[SecureStorage] Error setting access token:', error);
  }
}

export async function removeAccessToken(): Promise<void> {
  try {
    await deleteItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('[SecureStorage] Error deleting access token:', error);
  }
}

/**
 * Refresh Token Management
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    return await getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('[SecureStorage] Error getting refresh token:', error);
    return null;
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  try {
    await setItem(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error('[SecureStorage] Error setting refresh token:', error);
  }
}

export async function removeRefreshToken(): Promise<void> {
  try {
    await deleteItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('[SecureStorage] Error deleting refresh token:', error);
  }
}

/**
 * Clear all security tokens (used on Logout)
 */
export async function clearAuthTokens(): Promise<void> {
  await Promise.all([removeAccessToken(), removeRefreshToken()]);
}

export const clearTokens = clearAuthTokens;

