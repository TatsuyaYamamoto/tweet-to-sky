import { Box } from "@chakra-ui/react";
import { type FC } from "react";

import BlueskyProfile from "~components/BlueskyProfile/BlueskyProfile";
import LoginForm, { type LoginInputs } from "~components/LoginForm";
import { useBluesky } from "~hooks/useBluesky";

const PopupApp: FC = () => {
  const { profile, login, logout } = useBluesky();

  const onRequestLogin = async (inputs: LoginInputs) => {
    await login(inputs.identifier, inputs.password);
  };

  const onRequestLogout = async () => {
    await logout();
  };

  return (
    <Box width={400} padding={2}>
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
