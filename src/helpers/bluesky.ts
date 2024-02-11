import { BskyAgent, type AtpSessionData } from "@atproto/api";

import { Storage } from "@plasmohq/storage";

import { BLUESKY_SERVICE, STORAGE_API_KEYS } from "~constants";

export {};

let bskyAgent: BskyAgent | null = null;

export const postToBluesky = async (text: string) => {
  if (!bskyAgent) {
    bskyAgent = new BskyAgent({ service: BLUESKY_SERVICE });

    const session = await new Storage({ area: "local" }).get<AtpSessionData>(
      STORAGE_API_KEYS.BLUESKY_SESSION,
    );

    if (!session) {
      return;
    }

    await bskyAgent.resumeSession(session);
  }

  await bskyAgent.post({ text });
};
