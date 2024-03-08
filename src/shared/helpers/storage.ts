import type { AtpSessionData } from "@atproto/api";

import { Storage } from "@plasmohq/storage";

import type { ProfileViewDetailed } from "~shared/helpers/bluesky";

export interface StorageKeyValue {
  "bluesky:session": AtpSessionData;
  "bluesky:profile": ProfileViewDetailed;
}

export type StorageKey = keyof StorageKeyValue;

export const localAreaStorage = new Storage({ area: "local" });

export const getStorageValue = <
  Key extends StorageKey,
  Value extends StorageKeyValue[Key],
>(
  key: Key,
) => {
  return localAreaStorage.get<Value>(key);
};

export const setStorageValue = <
  Key extends StorageKey,
  Value extends StorageKeyValue[Key],
>(
  key: Key,
  value: Value,
) => {
  return localAreaStorage.set(key, value);
};

export const removeStorageValue = <Key extends StorageKey>(key: Key) => {
  return localAreaStorage.remove(key);
};
