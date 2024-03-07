import { sendToBackground, type PlasmoMessaging } from "@plasmohq/messaging";

import { postToBluesky, type BlueskyEmbedImage } from "~shared/helpers/bluesky";
import { restoreTweetText } from "~shared/helpers/twitter";

interface PostToBlueskyBody {
  tweetId: string;
  images?: BlueskyEmbedImage[];
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
  const logPrefix = `[onMessage:postToBluesky]`;
  console.log(`${logPrefix} tab(${req.sender?.tab?.id})->background`, req);

  if (!req.body) {
    console.error(`${logPrefix} no body is received.`);
    return;
  }

  const { tweetId, images } = req.body;

  const tweetText = restoreTweetText(tweetId);
  if (!tweetText) {
    console.error(`${logPrefix} tweet text (id: ${tweetId}) is not stored.`);
    return;
  }

  try {
    await postToBluesky(tweetText, images);
    res.send({ isSuccess: true, tweetId });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "unknown error";
    console.error(`${logPrefix} ${errorMessage}`, e);
    res.send({ isSuccess: false, errorMessage });
  }
};

export default onPostToBluesky;

export const sendPostToBluesky = async (
  tweetId: string,
  images: BlueskyEmbedImage[],
) => {
  const logPrefix = `[messaging:postToBlueskytab]`;
  const body = { tweetId, images };

  console.log(`${logPrefix} tab(-)->background`, body);
  const res = await sendToBackground<PostToBlueskyBody, PostToBlueskyResponse>({
    name: "postToBluesky",
    body,
  });
  console.log(`${logPrefix} tab(-)<-background`, res);

  return res;
};
