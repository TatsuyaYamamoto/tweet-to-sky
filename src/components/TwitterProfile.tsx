import { Box, Input, InputGroup, InputLeftAddon } from "@chakra-ui/react";
import {  type ChangeEventHandler, type FC } from "react";

interface TwitterProfileCardProps {
  screenName: string;
  onChangeScreenName: (value: string) => void;
}

const TwitterProfile: FC<TwitterProfileCardProps> = ({
  screenName,
  onChangeScreenName,
}) => {
  const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    onChangeScreenName(e.target.value);
  };

  return (
    <Box>
      <InputGroup>
        <InputLeftAddon>{`@`}</InputLeftAddon>
        <Input value={screenName} onChange={onChange} />
      </InputGroup>
    </Box>
  );
};

export default TwitterProfile;
