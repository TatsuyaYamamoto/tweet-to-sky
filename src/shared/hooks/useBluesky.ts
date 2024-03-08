import { jwtDecode } from "jwt-decode";
import { useCallback, useMemo } from "react";

import { sendLoginToBluesky } from "~background/messages/loginToBluesky";
import { sendLogoutFromBluesky } from "~background/messages/logoutFronBluesky";
import { isTokenExpired } from "~shared/helpers/jwt";
import { useStorageApi } from "~shared/hooks/useStorageApi";

export const useBluesky = () => {
  const [savedProfile] = useStorageApi("bluesky:profile");
  const [savedSession] = useStorageApi("bluesky:session");

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
