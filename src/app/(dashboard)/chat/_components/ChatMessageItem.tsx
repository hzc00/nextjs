import { UIMessage } from "@ai-sdk/react";
import { Database, FileText, Loader2, CheckCircle2 } from "lucide-react";

interface ChatMessageItemProps {
  message: UIMessage;
}

export const ChatMessageItem = ({ message: m }: ChatMessageItemProps) => {
  return (
    <div className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
          m.role === "user"
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-white text-zinc-900 border dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 rounded-bl-sm"
        }`}
      >
        {m.parts.map((part: any, i: number) => {
          if (part.type === 'text') {
            return (
              <div key={i} className="whitespace-pre-wrap leading-relaxed">
                {part.text}
              </div>
            );
          }

          if (part.type === 'reasoning') {
            return (
              <div key={i} className="text-zinc-500 text-sm mb-3 font-light border-l-2 border-zinc-200 dark:border-zinc-800 pl-3 py-1 italic">
                <div className="flex items-center gap-2 mb-1 opacity-70">
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse" />
                  Thinking...
                </div>
                <div className="whitespace-pre-wrap opacity-80">
                  {part.reasoning}
                </div>
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
                  {toolInvocation.toolName === 'queryInvestmentStats' ? (
                    <span className="flex items-center gap-1.5"><Database className="w-4 h-4 text-blue-500" /> Querying Investment DB...</span>
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
                {isDone && toolInvocation.toolName === 'queryInvestmentStats' && toolInvocation.result && (
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
  );
};
