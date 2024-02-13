import { Avatar, Box, Button, Image as ChakraImage } from "@chakra-ui/react";
import { useEffect, useRef, useState, type FC } from "react";

import BlueskyProfileCounter from "~components/BlueskyProfile/BlueskyProfileCounter";
import type { ProfileViewDetailed } from "~helpers/bluesky";

interface ProfileProps {
  profile: ProfileViewDetailed;
  onRequestLogout: () => void;
  onRequestOpenBluesky: () => void;
}

const BlueskyProfile: FC<ProfileProps> = ({
  profile,
  onRequestLogout,
  onRequestOpenBluesky,
}) => {
  const bannerWrapperElRef = useRef<HTMLDivElement>(null);
  const [bannerWrapperElHeight, setBannerWrapperElHeight] = useState(0);

  useEffect(() => {
    if (bannerWrapperElRef.current) {
      setBannerWrapperElHeight(bannerWrapperElRef.current.offsetHeight);
    }
  }, []);

  return (
    <Box width="100%" position="relative">
      {/* bluesky の banner は 3000px x 1000px で返却される */}
      <Box ref={bannerWrapperElRef} aspectRatio={3}>
        <ChakraImage
          src={profile.banner ?? ""}
          fallback={<Box backgroundColor="rgb(0, 112, 255)" height="100%" />}
        />
      </Box>
      <Box paddingY={4} paddingX={4}>
        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button size="sm" borderRadius={1000} onClick={onRequestOpenBluesky}>
            {`Bluesky を表示する`}
          </Button>
          <Button size="sm" borderRadius={1000} onClick={onRequestLogout}>
            {`ログアウト`}
          </Button>
        </Box>
        <Box
          fontSize="34px"
          lineHeight="38px"
          letterSpacing="0.25px"
          fontWeight="500"
          color="rgb(8, 10, 12)"
        >
          {/* bluesky の display は空文字の可能性がある*/}
          {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
          {profile.displayName || profile.handle}
        </Box>
        <Box
          fontSize="15px"
          letterSpacing="0.25px"
          fontWeight="400"
          color="rgb(69, 86, 104)"
          marginBottom={1}
        >
          {`@${profile.handle}`}
        </Box>
        <Box display="flex" gap={4}>
          <BlueskyProfileCounter
            count={profile.followsCount ?? 0}
            unit={"follows"}
            handle={profile.handle}
          />
          <BlueskyProfileCounter
            count={profile.followersCount ?? 0}
            unit={"人をフォロー中"}
            handle={profile.handle}
          />
          <BlueskyProfileCounter
            count={profile.postsCount ?? 0}
            unit={"posts"}
            handle={profile.handle}
          />
        </Box>
      </Box>
      <Avatar
        position="absolute"
        top={bannerWrapperElHeight}
        left={4}
        transform="translateY(-50%)"
        size="lg"
        src={profile.avatar ?? ""}
      />
    </Box>
  );
};

export default BlueskyProfile;
