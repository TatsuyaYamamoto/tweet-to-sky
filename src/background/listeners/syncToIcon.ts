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
  const changed = changes[storageKey];
  if (!changed) {
    // ignore non-target value
    return;
  }
  const newValue = changed.newValue as unknown;
  const oldValue = changed.oldValue as unknown;

  // is logged-in
  if (!oldValue && newValue) {
    chrome.action.setIcon({ path: onIconPath }).catch((e) => console.error(e));
  }

  // is logged-out
  if (oldValue && !newValue) {
    chrome.action.setIcon({ path: offIconPath }).catch((e) => console.error(e));
  }
});
