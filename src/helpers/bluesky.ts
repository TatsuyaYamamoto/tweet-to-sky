import { BskyAgent } from "@atproto/api";

import { BLUESKY_SERVICE } from "~constants";
import {
  getBskySession,
  removeBskyProfile,
  removeBskySession,
  saveBskyProfile,
  saveBskySession,
} from "~helpers/storage";

export type ProfileViewDetailed = Awaited<
  ReturnType<InstanceType<typeof BskyAgent>["getProfile"]>
>["data"];

let bskyAgent: BskyAgent | null = null;

const createBskyAgent = () => {
  return new BskyAgent({
    service: BLUESKY_SERVICE,
    persistSession: async (event, data) => {
      console.log("[bsky agent]", `session:${event}`, data);

      if (event === "expired") {
        await logoutFromBluesky();
      }
    },
  });
};

export const loginToBluesky = async (identifier: string, password: string) => {
  bskyAgent = createBskyAgent();
  const { data } = await bskyAgent.login({ identifier, password });

  if (!bskyAgent.session) {
    bskyAgent = null;
    throw new Error(
      "login to bluesky was successful, but the agent has no session",
    );
  }

  const { data: profile } = await bskyAgent.getProfile({ actor: data.did });

  await Promise.all([
    saveBskySession(bskyAgent.session),
    saveBskyProfile(profile),
  ]);

  return profile;
};

export const logoutFromBluesky = async () => {
  bskyAgent = null;

  await Promise.all([removeBskySession(), removeBskyProfile()]);
};

export const postToBluesky = async (text: string) => {
  if (!bskyAgent) {
    const session = await getBskySession();
    if (!session) {
      throw new Error("no session data is in storage.");
    }
    bskyAgent = createBskyAgent();
    await bskyAgent.resumeSession(session);
  }

  return bskyAgent.post({ text });
};
