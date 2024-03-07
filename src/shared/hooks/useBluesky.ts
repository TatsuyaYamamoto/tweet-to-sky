import type { AtpSessionData } from "@atproto/api";
import { jwtDecode } from "jwt-decode";
import { useCallback, useMemo } from "react";

import { Storage } from "@plasmohq/storage";
import { useStorage } from "@plasmohq/storage/hook";

import { sendLoginToBluesky } from "~background/messages/loginToBluesky";
import { sendLogoutFromBluesky } from "~background/messages/logoutFronBluesky";
import { STORAGE_API_KEYS } from "~shared/constants";
import type { ProfileViewDetailed } from "~shared/helpers/bluesky";
import { isTokenExpired } from "~shared/helpers/jwt";

const localAreaStorage = new Storage({ area: "local" });

export const useBluesky = () => {
  const [savedProfile] = useStorage<ProfileViewDetailed>({
    key: STORAGE_API_KEYS.BLUESKY_PROFILE,
    instance: localAreaStorage,
  });
  const [savedSession] = useStorage<AtpSessionData>({
    key: STORAGE_API_KEYS.BLUESKY_SESSION,
    instance: localAreaStorage,
  });

  const login = useCallback((identifier: string, password: string) => {
    return sendLoginToBluesky({ identifier, password });
  }, []);

  const logout = useCallback(async () => {
    return sendLogoutFromBluesky();
  }, []);

  const checkIsSessionAvailable = useCallback(() => {
    if (!savedSession) {
      return false;
    }

    const accessToken = jwtDecode(savedSession.accessJwt);
    if (!isTokenExpired(accessToken)) {
      return true;
    }

    const refreshToken = jwtDecode(savedSession.refreshJwt);
    return !isTokenExpired(refreshToken);
  }, [savedSession]);

  const profileUrl = useMemo(() => {
    return `https://bsky.app/profile/${savedProfile?.handle}`;
  }, [savedProfile]);

  return {
    login,
    logout,
    profile: savedProfile,
    checkIsSessionAvailable,
    profileUrl,
  };
};
