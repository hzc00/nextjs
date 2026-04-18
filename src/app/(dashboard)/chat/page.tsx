"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef } from "react";
import { Paperclip, Send, Loader2, Database, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ChatPage() {
  const { messages, sendMessage, status } = useChat({
    api: '/api/chat',
    onError: (error: Error) => {
      toast.error("An error occurred during chat.", { description: error.message });
    }
  });

  const [input, setInput] = useState("");
  const isLoading = status === "submitted" || status === "streaming";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const loadingToast = toast.loading(`Uploading ${file.name}...`);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(`Successfully uploaded and indexed ${file.name}`, { id: loadingToast });
      } else {
        toast.error("Upload failed", { description: data.error, id: loadingToast });
      }
    } catch (error: any) {
      console.error("Upload error", error);
      toast.error("An error occurred during upload.", { id: loadingToast });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-5xl mx-auto w-full p-4 md:p-8">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">AI Assistant</h1>
        <p className="text-zinc-500 text-sm">Dual-modality: Database Queries & Document Retrieval</p>
      </div>

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
            <div key={m.id} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white text-zinc-900 border dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 rounded-bl-sm"
                }`}
              >
                {/* Render Parts (Text, Tools, etc.) */}
                {m.parts.map((part, i) => {
                  console.log(part)
                  if (part.type === 'text') {
                    return (
                      <div key={i} className="whitespace-pre-wrap leading-relaxed">
                        {part.text}
                      </div>
                    );
                  }
                  
                  if (part.type === 'tool-invocation') {
                    const toolInvocation = part.toolInvocation;
                    const toolCallId = toolInvocation.toolCallId;
                    const isDone = 'result' in toolInvocation;
                    
                    return (
                      <div key={toolCallId} className="mt-3 p-3 bg-zinc-50/80 dark:bg-black/40 rounded-xl text-sm border dark:border-zinc-800 flex flex-col gap-2">
                        <div className="flex items-center gap-2 font-medium">
                          {!isDone ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                          {toolInvocation.toolName === 'queryAssets' ? (
                            <span className="flex items-center gap-1.5"><Database className="w-4 h-4 text-blue-500" /> Querying Assets...</span>
                          ) : toolInvocation.toolName === 'queryTransactions' ? (
                            <span className="flex items-center gap-1.5"><Send className="w-4 h-4 text-orange-500" /> Querying Transactions...</span>
                          ) : toolInvocation.toolName === 'queryPortfolioPerformance' ? (
                            <span className="flex items-center gap-1.5"><Database className="w-4 h-4 text-green-500" /> Calculating Performance...</span>
                          ) : toolInvocation.toolName === 'searchDocuments' ? (
                            <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-purple-500" /> Searching Knowledge Base...</span>
                          ) : (
                            <span>Using Tool: {toolInvocation.toolName}</span>
                          )}
                        </div>
                        
                        {isDone && toolInvocation.toolName === 'searchDocuments' && toolInvocation.result?.results && (
                          <div className="text-xs text-zinc-500 italic border-l-2 border-purple-200 dark:border-purple-900 pl-2 mt-1">
                            Retrieved {toolInvocation.result.results.length} relevant document snippets.
                          </div>
                        )}
                        {isDone && toolInvocation.toolName.startsWith('query') && toolInvocation.result && (
                          <div className="text-xs text-zinc-500 italic border-l-2 border-blue-200 dark:border-blue-900 pl-2 mt-1">
                            Database query completed successfully.
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  return null;
                })}
              </div>
            </div>
          ))
        )}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
           <div className="flex justify-start">
             <div className="max-w-[85%] rounded-2xl p-4 bg-white border dark:bg-zinc-900 dark:border-zinc-800 rounded-bl-sm shadow-sm flex items-center gap-2">
               <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
               <span className="text-sm text-zinc-500">Thinking...</span>
             </div>
           </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 items-center bg-white dark:bg-zinc-900 p-2.5 rounded-[2rem] border shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept=".txt,.pdf"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isLoading}
          className="p-3 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors rounded-full shrink-0"
          title="Upload Document (PDF/TXT)"
        >
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
        </button>
        
        <input
          className="flex-1 bg-transparent px-2 py-2 outline-none text-[15px]"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask a question or upload a document..."
          disabled={isLoading || isUploading}
        />
        
        <button
          type="submit"
          disabled={isLoading || isUploading || !input.trim()}
          className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
