import { type AtpSessionData } from "@atproto/api";

import { Storage } from "@plasmohq/storage";

import { STORAGE_API_KEYS } from "~constants";
import type { ProfileViewDetailed } from "~helpers/bluesky";

const localAreaStorage = new Storage({ area: "local" });

export const getBskySession = () => {
  return localAreaStorage.get<AtpSessionData>(STORAGE_API_KEYS.BLUESKY_SESSION);
};

export const saveBskySession = (value: AtpSessionData) => {
  return localAreaStorage.set(STORAGE_API_KEYS.BLUESKY_SESSION, value);
};

export const removeBskySession = () => {
  return localAreaStorage.remove(STORAGE_API_KEYS.BLUESKY_SESSION);
};

export const saveBskyProfile = (value: ProfileViewDetailed) => {
  return localAreaStorage.set(STORAGE_API_KEYS.BLUESKY_PROFILE, value);
};

export const removeBskyProfile = () => {
  return localAreaStorage.remove(STORAGE_API_KEYS.BLUESKY_PROFILE);
};
