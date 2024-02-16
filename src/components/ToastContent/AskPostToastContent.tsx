import { Box, Button } from "@chakra-ui/react";
import { useState, type FC } from "react";

interface Props {
  tweetText: string;
  onRequestPost: () => void;
}

const AskPostToastContent: FC<Props> = ({ tweetText, onRequestPost }) => {
  const [isProgress, handleProgress] = useState(false);

  const onClickButton = () => {
    handleProgress(true);
    onRequestPost();
  };

  return (
    <Box>
      <Box>Bluesky へ投稿しますか？</Box>
      <Box
        as="pre"
        marginY={2}
        padding={2}
        backgroundColor="rgba(255, 255, 255, 0.2)"
        borderRadius={4}
        whiteSpace="pre-wrap"
      >
        {tweetText}
      </Box>
      <Box display="flex" justifyContent="flex-end">
        <Button size="sm" isLoading={isProgress} onClick={onClickButton}>
          投稿する
        </Button>
      </Box>
    </Box>
  );
};

export default AskPostToastContent;
