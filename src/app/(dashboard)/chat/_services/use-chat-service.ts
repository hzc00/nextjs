import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { toast } from "sonner";
import { UIMessage } from "@ai-sdk/react";

export const useChatService = () => {
  const { messages, sendMessage, status } = useChat({
    api: '/api/chat', // 回归 URL 模式
    onError: (error: Error) => {
        toast.error("An error occurred during chat.", { description: error.message });
    }
  });

  const [input, setInput] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  return {
    messages,
    sendMessage,
    status,
    input,
    setInput,
    handleInputChange,
    handleSubmit
  };
};
