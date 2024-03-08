import offIconPath from "url:../../../assets/icon-off@128x128.png";
import onIconPath from "url:../../../assets/icon@128x128.png";

import type { StorageKey } from "~shared/helpers/storage";

const storageKey = "bluesky:session" satisfies StorageKey;

// set icon when Service Worker is initialized
chrome.storage.local.get(storageKey, (values) => {
  const value = values[storageKey] as unknown;
  const icon = value ? onIconPath : offIconPath;
  chrome.action.setIcon({ path: icon }).catch((e) => console.error(e));
});

// update icon when profile data is set or removed.
chrome.storage.local.onChanged.addListener((changes) => {
  const newValue = changes[storageKey]?.newValue as unknown;
  const icon = newValue ? onIconPath : offIconPath;
  chrome.action.setIcon({ path: icon }).catch((e) => console.error(e));
});
