import { BskyAgent, type AtpSessionData } from "@atproto/api";
import { useEffect, useMemo, useState } from "react";

import { Storage } from "@plasmohq/storage";
import { useStorage } from "@plasmohq/storage/hook";

type ProfileViewDetailed = Awaited<
  ReturnType<InstanceType<typeof BskyAgent>["getProfile"]>
>["data"];

export const useBlueskyApi = (service = "https://bsky.social") => {
  const agent = useMemo(() => {
    return new BskyAgent({ service });
  }, [service]);
  const [profile, setProfile] = useState<ProfileViewDetailed>();
  const [session, setSession] = useStorage<AtpSessionData>({
    key: "session",
    instance: new Storage({ area: "local" }),
  });

  const getProfile = async () => {
    if (!agent.session) {
      return;
    }
    const { data: profile } = await agent.getProfile({
      actor: agent.session.did,
    });
    setProfile(profile);
  };

  const login = async (identifier: string, password: string) => {
    await agent.login({ identifier, password });

    if (agent.session) {
      console.log("start session");
      await Promise.all([setSession(agent.session), getProfile()]);
    }
  };

  useEffect(() => {
    if (!agent.session && session) {
      agent.resumeSession(session).then((res) => {
        console.log("resume session", res);

        return getProfile();
      });
    }
  }, [agent, session]);

  return { login, profile };
};
