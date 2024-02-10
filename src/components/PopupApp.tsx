import { Box } from "@chakra-ui/react";
import { type FC } from "react";

import LoginForm, { type LoginInputs } from "~components/LoginForm";
import BlueskyProfile from "~components/BlueskyProfile/BlueskyProfile";
import TwitterProfile from "~components/TwitterProfile";
import { useBlueskyApi } from "~hooks/useBlueskyApi";
import { useTwitter } from "~hooks/useTwitter";

const PopupApp: FC = () => {
  const { profile, login, logout } = useBlueskyApi();
  const { screenName, setScreenName } = useTwitter();

  const onRequestLogin = async (inputs: LoginInputs) => {
    await login(inputs.identifier, inputs.password);
  };

  const onRequestLogout = () => {
    logout();
  };

  return (
    <Box width={400} padding={2}>
      <Box width="100%" boxShadow="base" padding={2}>
        <TwitterProfile
          screenName={screenName ?? ""}
          onChangeScreenName={setScreenName}
        />
      </Box>

      <Box padding={2} textAlign="center">{`↓`}</Box>

      <Box width="100%" boxShadow="base" padding={2}>
        {profile ? (
          <BlueskyProfile profile={profile} onRequestLogout={onRequestLogout} />
        ) : (
          <LoginForm onRequestLogin={onRequestLogin} />
        )}
      </Box>
    </Box>
  );
};

export default PopupApp;
