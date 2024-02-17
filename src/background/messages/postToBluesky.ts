import { sendToBackground, type PlasmoMessaging } from "@plasmohq/messaging";

import { postToBluesky } from "~helpers/bluesky";
import { restoreTweetText } from "~helpers/twitter";

interface PostToBlueskyBody {
  tweetId: string;
}

interface PostToBlueskyResponse {
  tweetId: string;
  isSuccess: boolean;
}

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

  const isSuccess = await postToBluesky(tweetText)
    .then(() => {
      return true;
    })
    .catch((e) => {
      console.error(e);
      return false;
    });

  res.send({
    tweetId,
    isSuccess,
  });
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
