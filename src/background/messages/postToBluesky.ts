import { sendToBackground, type PlasmoMessaging } from "@plasmohq/messaging";

import { postToBluesky } from "~helpers/bluesky";
import { restoreTweetText } from "~helpers/twitter";

interface PostToBlueskyBody {
  tweetId: string;
}

type PostToBlueskyResponse =
  | {
      isSuccess: true;
      tweetId: string;
    }
  | {
      isSuccess: false;
      errorMessage: string;
    };

const onPostToBluesky: PlasmoMessaging.MessageHandler<
  PostToBlueskyBody,
  PostToBlueskyResponse
> = async (req, res) => {
  console.log(
    `[onMessage:postToBluesky] tab(${req.sender?.tab?.id})->background`,
    req,
  );

  const tweetId = req.body?.tweetId;
  if (!tweetId) {
    return;
  }

  const tweetText = restoreTweetText(tweetId);
  if (!tweetText) {
    return;
  }

  try {
    await postToBluesky(tweetText);
    return res.send({ isSuccess: true, tweetId });
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : "unknown error";
    return res.send({ isSuccess: false, errorMessage });
  }
};

export default onPostToBluesky;

export const sendPostToBluesky = async (tweetId: string) => {
  const body = { tweetId };

  console.log(`[messaging:postToBlueskytab] tab(-)->background`, body);
  const res = await sendToBackground<PostToBlueskyBody, PostToBlueskyResponse>({
    name: "postToBluesky",
    body,
  });
  console.log(`[messaging:postToBlueskytab] tab(-)<-background`, res);

  return res;
};
