import { Box } from "@chakra-ui/react";
import { type FC } from "react";

import LoginForm, { type LoginInputs } from "~components/LoginForm";
import Profile from "~components/Profile/Profile";
import { useBlueskyApi } from "~hooks/useBlueskyApi";

const PopupApp: FC = () => {
  const { profile, login, logout } = useBlueskyApi();

  const onRequestLogin = async (inputs: LoginInputs) => {
    await login(inputs.identifier, inputs.password);
  };

  const onRequestLogout = () => {
    logout();
  };

  return (
    <Box width={400}>
      {profile ? (
        <Profile profile={profile} onRequestLogout={onRequestLogout} />
      ) : (
        <LoginForm onRequestLogin={onRequestLogin} />
      )}
    </Box>
  );
};

export default PopupApp;
