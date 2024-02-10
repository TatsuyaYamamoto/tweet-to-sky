import { literal, object, string, union, type Output } from "valibot";

export const PostToBlueskyMessageSchema = object({
  type: literal("postToBluesky"),
  value: string(),
});

export type DetectTweetMessage = Output<typeof PostToBlueskyMessageSchema>;

export const MessageFromBackgroundSchema = union([PostToBlueskyMessageSchema]);

export type MessageFromBackground = Output<typeof MessageFromBackgroundSchema>;
