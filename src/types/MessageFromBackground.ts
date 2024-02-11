import { boolean, literal, object, string, union, type Output } from "valibot";

export const AskPostToBlueskyMessageSchema = object({
  type: literal("askPostToBluesky"),
  tweetId: string(),
});
export type AskPostToBlueskyMessage = Output<
  typeof AskPostToBlueskyMessageSchema
>;

export const NotifyPostResultMessageSchema = object({
  type: literal("notifyPostResult"),
  tweetId: string(),
  isSuccess: boolean(),
});
export type NotifyPostResultMessage = Output<
  typeof NotifyPostResultMessageSchema
>;

export const MessageFromBackgroundSchema = union([
  AskPostToBlueskyMessageSchema,
  NotifyPostResultMessageSchema,
]);

export type MessageFromBackground = Output<typeof MessageFromBackgroundSchema>;
