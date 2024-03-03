import { Avatar, Box, Button, Divider, Spacer } from "@chakra-ui/react";
import { useState, type FC } from "react";

interface Props {
  tweetText: string;
  profileImageUrl?: string | undefined;
  onRequestPost: () => void;
  onClose: () => void;
}

const AskPostToastContent: FC<Props> = ({
  tweetText,
  profileImageUrl,
  onRequestPost,
  onClose,
}) => {
  const [isProgress, handleProgress] = useState(false);

  const onClickButton = () => {
    handleProgress(true);
    onRequestPost();
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Box display="flex">
        <Box>Bluesky へ投稿しますか？</Box>
      </Box>
      <Divider borderColor="gray.300" />
      <Box display="flex" gap={2}>
        <Avatar size="sm" src={profileImageUrl as unknown as string} />
        <Box as="pre" whiteSpace="pre-wrap" color="rgb(7, 10, 13)">
          {tweetText}
        </Box>
      </Box>
      <Divider borderColor="gray.300" />
      <Box display="flex">
        <Button
          size="sm"
          variant="ghost"
          fontWeight={400}
          isDisabled={isProgress}
          color={`var(--color-bluesky-font-blue)`}
          _hover={{ background: undefined }}
          _active={{ opacity: 0.2 }}
          onClick={onClose}
        >
          {`キャンセル`}
        </Button>
        <Spacer />
        <Button
          size="sm"
          borderRadius="full"
          isLoading={isProgress}
          color="#ffffff"
          bgGradient="linear(2.68344rad, var(--color-bluesky-button-gradation-from), var(--color-bluesky-button-gradation-to))"
          _hover={{ background: undefined }}
          _active={{ opacity: 0.2 }}
          onClick={onClickButton}
        >
          {`投稿する`}
        </Button>
      </Box>
    </Box>
  );
};

export default AskPostToastContent;
