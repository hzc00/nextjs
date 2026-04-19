"use client";

import { Database, Loader2 } from "lucide-react";
import { useChatService } from "./_services/use-chat-service";
import { ChatHeader } from "./_components/ChatHeader";
import { ChatMessageItem } from "./_components/ChatMessageItem";
import { ChatInputForm } from "./_components/ChatInputForm";

export default function ChatPage() {
  const { messages, status, input, handleInputChange, handleSubmit } = useChatService();

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-5xl mx-auto w-full p-4 md:p-8">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto mb-6 p-4 space-y-6 rounded-2xl border bg-white/50 backdrop-blur-xl shadow-sm dark:bg-zinc-950/50 dark:border-zinc-800">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-blue-500/20 blur animate-pulse" />
              <Database className="w-16 h-16 text-blue-500 relative z-10" />
            </div>
            <div className="text-center">
              <p className="font-medium text-lg text-zinc-700 dark:text-zinc-300">How can I help you today?</p>
              <p className="text-sm mt-2 max-w-md">Try asking: <span className="italic">"我今天有多少个标的是红盘的？"</span> or upload a document and ask: <span className="italic">"根据上传的文件，规定是什么？"</span></p>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <ChatMessageItem key={m.id} message={m} />
          ))
        )}
        
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
           <div className="flex justify-start">
             <div className="max-w-[85%] rounded-2xl p-4 bg-white border dark:bg-zinc-900 dark:border-zinc-800 rounded-bl-sm shadow-sm flex items-center gap-2">
               <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
               <span className="text-sm text-zinc-500 font-medium tracking-wide">Thinking...</span>
             </div>
           </div>
        )}
      </div>

      <ChatInputForm 
        input={input} 
        handleInputChange={handleInputChange} 
        handleSubmit={handleSubmit} 
        isLoading={isLoading} 
      />
    </div>
  );
}
