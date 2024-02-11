import { Box, Button } from "@chakra-ui/react";
import type { FC } from "react";

interface Props {
  onRequestPost: () => void;
}

const AskPostToastContent: FC<Props> = ({ onRequestPost }) => {
  return (
    <Box>
      <Box>送信しますか？</Box>
      <Box>hogehogheohgeohgoehgoehgoehgoehgoehgoehgoehg</Box>
      <Box>
        <Button onClick={onRequestPost}>送信する</Button>
      </Box>
    </Box>
  );
};

export default AskPostToastContent;
