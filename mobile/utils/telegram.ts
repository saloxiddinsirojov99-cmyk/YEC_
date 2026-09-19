import { Linking } from 'react-native';

export const TELEGRAM_BOT_USERNAME = 'YEC_Toshkent_bot';

/**
 * Generates both native tg:// and https:// URLs for bot deep linking.
 * Uses the exact 'user_join_<token>' parameter format expected by backend.
 */
export function getTelegramJoinUrls(token?: string | null) {
  const safeParam = token ? `user_join_${token}` : 'user_join';
  const nativeUrl = `tg://resolve?domain=${TELEGRAM_BOT_USERNAME}&start=${safeParam}`;
  const webUrl = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${safeParam}`;

  return { nativeUrl, webUrl };
}

/**
 * Attempts to launch Telegram app directly via native protocol;
 * falls back to browser URL (t.me) if native app is not installed.
 */
export async function openTelegramBot(token?: string | null): Promise<boolean> {
  const { nativeUrl, webUrl } = getTelegramJoinUrls(token);

  try {
    const supported = await Linking.canOpenURL(nativeUrl);
    if (supported) {
      await Linking.openURL(nativeUrl);
      return true;
    }
  } catch {
    // Native protocol not available
  }

  try {
    await Linking.openURL(webUrl);
    return true;
  } catch (err) {
    console.warn('[Telegram] Could not open URL:', err);
    return false;
  }
}
