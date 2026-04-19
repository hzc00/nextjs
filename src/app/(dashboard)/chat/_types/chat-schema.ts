import { z } from "zod";

// 这里定义与聊天相关的类型
// 虽然 useChat 有自带类型，但业务相关的 Schema 放在这里方便统一管理

export const chatInputSchema = z.object({
  text: z.string().min(1, "Message cannot be empty"),
});

export type ChatInputSchema = z.infer<typeof chatInputSchema>;

export const chatDefaultValues: ChatInputSchema = {
  text: "",
};
