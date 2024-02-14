import offIconPath from "url:../../assets/icon-off@128x128.png";
import onIconPath from "url:../../assets/icon@128x128.png";

import { STORAGE_API_KEYS } from "~constants";

// set icon when Service Worker is initialized
chrome.storage.local.get((values: Record<string, unknown>) => {
  const icon = values[STORAGE_API_KEYS.BLUESKY_PROFILE]
    ? onIconPath
    : offIconPath;
  chrome.action.setIcon({ path: icon }).catch((e) => console.error(e));
});

// update icon when profile data is set or removed.
chrome.storage.local.onChanged.addListener(
  (changes: Record<string, { newValue?: unknown; oldValue?: unknown }>) => {
    const { newValue } = changes[STORAGE_API_KEYS.BLUESKY_PROFILE] ?? {};
    const icon = newValue ? onIconPath : offIconPath;
    chrome.action.setIcon({ path: icon }).catch((e) => console.error(e));
  },
);
