import { BskyAgent, type AtpSessionData } from "@atproto/api";
import { useCallback, useEffect, useRef, useState } from "react";

import { Storage } from "@plasmohq/storage";
import { useStorage } from "@plasmohq/storage/hook";

export type ProfileViewDetailed = Awaited<
  ReturnType<InstanceType<typeof BskyAgent>["getProfile"]>
>["data"];

export const useBlueskyApi = (service = "https://bsky.social") => {
  const bskyAgentRef = useRef<BskyAgent>();
  const [profile, setProfile] = useState<ProfileViewDetailed>();
  const [savedSession, saveSession, { remove: removeSession }] =
    useStorage<AtpSessionData>({
      key: "session",
      instance: new Storage({ area: "local" }),
    });

  const createBskyAgent = useCallback(
    (service: string) => {
      return new BskyAgent({
        service,
        persistSession: (event, data) => {
          console.log("[bsky agent]", `session:${event}`, data);

          if (event === "expired") {
            removeSession();
          }
        },
      });
    },
    [removeSession],
  );

  const login = useCallback(
    async (identifier: string, password: string) => {
      const agent = createBskyAgent(service);
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
    [createBskyAgent, saveSession, service],
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

      const newAgent = createBskyAgent(service);
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
  }, [createBskyAgent, service, logout, savedSession]);

  return { login, logout, profile };
};
