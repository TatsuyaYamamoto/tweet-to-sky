import { Avatar, Box, Button } from "@chakra-ui/react";
import { type FC } from "react";

import ProfileCounter from "~components/Profile/ProfileCounter";
import { type ProfileViewDetailed } from "~hooks/useBlueskyApi";

interface ProfileProps {
  profile: ProfileViewDetailed;
  onRequestLogout: () => void;
}

const Profile: FC<ProfileProps> = ({ profile, onRequestLogout }) => {
  return (
    <Box width="100%">
      <Box height={100}>
        <Box backgroundColor="rgb(0, 112, 255)" height="100%" />
      </Box>
      <Box paddingTop={4} paddingBottom={2} paddingX={7}>
        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button size="sm" borderRadius={1000}>
            {`Bluesky を表示する`}
          </Button>
          <Button size="sm" borderRadius={1000} onClick={onRequestLogout}>
            {`ログアウト`}
          </Button>
        </Box>
        <Box
          fontSize="34px"
          letterSpacing="0.25px"
          fontWeight="500"
          color="rgb(8, 10, 12)"
        >
          {profile.displayName || profile.handle}
        </Box>
        <Box
          fontSize="15px"
          letterSpacing="0.25px"
          fontWeight="400"
          color="rgb(69, 86, 104)"
        >
          {`@${profile.handle}`}
        </Box>
        <Box display="flex" gap={4}>
          <ProfileCounter
            count={profile.followsCount ?? 0}
            unit={"follows"}
            handle={profile.handle}
          />
          <ProfileCounter
            count={profile.followersCount ?? 0}
            unit={"人をフォロー中"}
            handle={profile.handle}
          />
          <ProfileCounter
            count={profile.postsCount ?? 0}
            unit={"posts"}
            handle={profile.handle}
          />
        </Box>
      </Box>
      <Avatar position="absolute" top={68} left={4} size="lg" />
    </Box>
  );
};

export default Profile;
