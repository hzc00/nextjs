import { useRef, useState } from "react";
import { Paperclip, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ChatInputFormProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export const ChatInputForm = ({ input, handleInputChange, handleSubmit, isLoading }: ChatInputFormProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("File uploaded and vectorized successfully!");
      } else {
        const error = await response.json();
        toast.error("Upload failed", { description: error.message });
      }
    } catch (error) {
      toast.error("An error occurred during upload.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask a question or upload a document..."
            className="w-full bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl pl-12 pr-12 py-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            disabled={isLoading || isUploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-blue-500 transition-colors disabled:opacity-50"
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".txt,.pdf"
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || isLoading || isUploading}
          className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:hover:bg-blue-600 shadow-lg shadow-blue-500/20"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
      <p className="text-[10px] text-zinc-400 mt-2 text-center">
        Supported formats: PDF, TXT. Documents are automatically vectorized for retrieval.
      </p>
    </div>
  );
};
