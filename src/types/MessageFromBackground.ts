import { array, literal, object, string, union, type Output } from "valibot";

export const PostToBlueskyMessageSchema = object({
  type: literal("postToBluesky"),
  value: string(),
});

export type DetectTweetMessage = Output<typeof PostToBlueskyMessageSchema>;

export const RequestAccountListMessageSchema = object({
  type: literal("requestAccountList"),
});

export type RequestAccountListMessage = Output<
  typeof RequestAccountListMessageSchema
>;

export const RequestAccountListResultMessageSchema = object({
  type: literal("requestAccountListResult"),
  value: object({
    users: array(
      object({
        screen_name: string(),
        user_id: string(),
      }),
    ),
  }),
});

export type RequestAccountListResultMessage = Output<
  typeof RequestAccountListResultMessageSchema
>;

export const MessageFromBackgroundSchema = union([
  PostToBlueskyMessageSchema,
  RequestAccountListMessageSchema,
  RequestAccountListResultMessageSchema,
]);

export type MessageFromBackground = Output<typeof MessageFromBackgroundSchema>;
