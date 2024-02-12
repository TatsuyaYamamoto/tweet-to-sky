import { useCallback } from "react";

import { Storage } from "@plasmohq/storage";
import { useStorage } from "@plasmohq/storage/hook";

import { sendLoginToBluesky } from "~background/messages/loginToBluesky";
import { sendLogoutFromBluesky } from "~background/messages/logoutFronBluesky";
import { STORAGE_API_KEYS } from "~constants";
import type { ProfileViewDetailed } from "~helpers/bluesky";

const localAreaStorage = new Storage({ area: "local" });

export const useBluesky = () => {
  const [savedProfile] = useStorage<ProfileViewDetailed>({
    key: STORAGE_API_KEYS.BLUESKY_PROFILE,
    instance: localAreaStorage,
  });

  const login = useCallback(async (identifier: string, password: string) => {
    return sendLoginToBluesky({ identifier, password });
  }, []);

  const logout = useCallback(async () => {
    return sendLogoutFromBluesky();
  }, []);

  return { login, logout, profile: savedProfile };
};
