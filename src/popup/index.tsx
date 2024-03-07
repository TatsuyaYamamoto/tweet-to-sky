import { Box, Image as ChakraImage, ChakraProvider } from "@chakra-ui/react";
import type { FC } from "react";
import offIconPath from "url:../../assets/icon-off@128x128.png";

import BlueskyProfile from "~components/BlueskyProfile/BlueskyProfile";
import LoginForm, { type LoginInputs } from "~components/LoginForm";
import { useBluesky } from "~hooks/useBluesky";

const PopupIndex: FC = () => {
  const { profile, profileUrl, login, logout } = useBluesky();

  const onRequestLogin = async (inputs: LoginInputs) => {
    return login(inputs.identifier, inputs.password);
  };

  const onRequestLogout = async () => {
    await logout();
  };

  const onRequestOpenBluesky = () => {
    return chrome.tabs.create({
      url: profileUrl,
    });
  };

  return (
    <ChakraProvider>
      <Box width={400} padding={2}>
        <Box width="100%" boxShadow="base" borderRadius="md" overflow="hidden">
          {profile ? (
            <BlueskyProfile
              profile={profile}
              onRequestLogout={onRequestLogout}
              onRequestOpenBluesky={onRequestOpenBluesky}
            />
          ) : (
            <>
              <Box display="flex" justifyContent="center">
                <ChakraImage width={16} src={offIconPath} />
              </Box>
              <LoginForm onRequestLogin={onRequestLogin} />
            </>
          )}
        </Box>
      </Box>
    </ChakraProvider>
  );
};

export default PopupIndex;
