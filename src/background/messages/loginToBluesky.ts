import { sendToBackground, type PlasmoMessaging } from "@plasmohq/messaging";

import { loginToBluesky, type ProfileViewDetailed } from "~shared/helpers/bluesky";

interface RequestBody {
  identifier: string;
  password: string;
}

type ResponseBody =
  | {
      isSuccess: true;
      profile: ProfileViewDetailed;
    }
  | { isSuccess: false };

const handler: PlasmoMessaging.MessageHandler<
  RequestBody,
  ResponseBody
> = async (req, res) => {
  console.log(
    `[onMessage:loginToBluesky] tab(${req.sender?.tab?.id})->background`,
    "***",
  );

  const { identifier, password } = req.body ?? {};
  if (!identifier || !password) {
    res.send({ isSuccess: false });
    return;
  }

  try {
    const profile = await loginToBluesky(identifier, password);
    res.send({ isSuccess: true, profile });
  } catch (e) {
    console.error(e);
    res.send({ isSuccess: false });
  }
};

export default handler;

export const sendLoginToBluesky = async (body: RequestBody) => {
  console.log(`[messaging:loginToBluesky] tab(-)->background`, "***");
  const res = await sendToBackground<RequestBody, ResponseBody>({
    name: "loginToBluesky",
    body,
  });
  console.log(`[messaging:loginToBluesky] tab(-)<-background`, "***");

  return res;
};
