import { BskyAgent, type AtpSessionData } from "@atproto/api";
import { useCallback, useEffect, useRef, useState } from "react";

import { Storage } from "@plasmohq/storage";
import { useStorage } from "@plasmohq/storage/hook";

import { BLUESKY_SERVICE, STORAGE_API_KEYS } from "~constants";

export type ProfileViewDetailed = Awaited<
  ReturnType<InstanceType<typeof BskyAgent>["getProfile"]>
>["data"];

export const useBlueskyApi = () => {
  const bskyAgentRef = useRef<BskyAgent>();
  const [profile, setProfile] = useState<ProfileViewDetailed>();
  const [savedSession, saveSession, { remove: removeSession }] =
    useStorage<AtpSessionData>({
      key: STORAGE_API_KEYS.BLUESKY_SESSION,
      instance: new Storage({ area: "local" }),
    });

  const createBskyAgent = useCallback(() => {
    return new BskyAgent({
      service: BLUESKY_SERVICE,
      persistSession: (event, data) => {
        console.log("[bsky agent]", `session:${event}`, data);

        if (event === "expired") {
          removeSession();
        }
      },
    });
  }, [removeSession]);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const agent = createBskyAgent();
      bskyAgentRef.current = agent;

      await agent.login({ identifier, password });

      if (!agent.session) {
        return;
      }

      console.log("[bsky agent] start session");

      const { data: profile } = await agent.getProfile({
        actor: agent.session.did,
      });
      setProfile(profile);

      // save session to resume after next popup
      await saveSession(agent.session);
    },
    [createBskyAgent, saveSession],
  );

  const logout = useCallback(() => {
    bskyAgentRef.current = undefined;
    removeSession();
    setProfile(undefined);
  }, [removeSession]);

  useEffect(() => {
    if (bskyAgentRef.current?.session) {
      // logging-in
      return;
    }

    if (savedSession) {
      // logging-out, but can try login with saved session

      const newAgent = createBskyAgent();
      bskyAgentRef.current = newAgent;

      void (async () => {
        console.log("[bsky agent] try resume session");

        const did = await newAgent
          .resumeSession(savedSession)
          .then(({ data }) => data.did);

        if (!did) {
          // fail to resume session due to expired token
          return;
        }

        try {
          const profile = await newAgent
            .getProfile({
              actor: did,
            })
            .then(({ data }) => data);
          setProfile(profile);
        } catch (e) {
          // TODO profile error handler
          console.error(e);
        }
      })();
    }
  }, [createBskyAgent, logout, savedSession]);

  return { login, logout, profile };
};
