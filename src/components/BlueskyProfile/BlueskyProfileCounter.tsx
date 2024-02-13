import { Box } from "@chakra-ui/react";
import { type FC } from "react";

interface ProfileCounterProps {
  count: number;
  unit: string;
  handle: string;
}

const BlueskyProfileCounter: FC<ProfileCounterProps> = ({
  count,
  unit,
  handle,
}) => {
  return (
    <Box
      as="a"
      href={`https://bsky.app/profile/${handle}/followers`}
      display="flex"
    >
      <Box
        fontSize="15px"
        letterSpacing="0.25px"
        color="rgb(8, 10, 12)"
        fontWeight="700"
        marginRight={1}
      >
        {count}
      </Box>
      <Box
        fontSize="15px"
        letterSpacing="0.25px"
        fontWeight="400"
        color="rgb(69, 86, 104)"
      >
        {unit}
      </Box>
    </Box>
  );
};

export default BlueskyProfileCounter;
