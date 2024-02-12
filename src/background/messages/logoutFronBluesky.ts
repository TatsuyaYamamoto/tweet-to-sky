import { sendToBackground, type PlasmoMessaging } from "@plasmohq/messaging";

import { logoutFromBluesky } from "~helpers/bluesky";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface RequestBody {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ResponseBody {}

const handler: PlasmoMessaging.MessageHandler<
  RequestBody,
  ResponseBody
> = async (req, res) => {
  console.log(`[messaging:tab(${req.sender?.tab?.id})->background]`, req);

  await logoutFromBluesky();

  res.send({});
};

export default handler;

export const sendLogoutFromBluesky = (body: RequestBody = {}) => {
  console.log(`[messaging:tab(-)->background]`, body);
  return sendToBackground<RequestBody, ResponseBody>({
    name: "logoutFronBluesky",
    body,
  });
};
