import { sendToBackground, type PlasmoMessaging } from "@plasmohq/messaging";

import { logoutFromBluesky } from "~shared/helpers/bluesky";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface RequestBody {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ResponseBody {}

const handler: PlasmoMessaging.MessageHandler<
  RequestBody,
  ResponseBody
> = async (req, res) => {
  console.log(
    `[onMessage:logoutFromBluesky] tab(${req.sender?.tab?.id})->background`,
    "***",
  );

  await logoutFromBluesky();

  res.send({});
};

export default handler;

export const sendLogoutFromBluesky = async (body: RequestBody = {}) => {
  console.log(`[messaging:logoutFronBluesky] tab(-)->background`, "***");
  const res = await sendToBackground<RequestBody, ResponseBody>({
    name: "logoutFronBluesky",
    body,
  });
  console.log(`[messaging:logoutFronBluesky] tab(-)<-background`, "***");

  return res;
};
