import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { ChatMessage } from "../types";

interface ChatBotProps {
  activeExperiment: "pendulum" | "wave" | "spring" | "light";
  params: any;
}

export default function ChatBot({ activeExperiment, params }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Chào bạn! Tôi là **UrLab Physics Tutor** - Gia sư Vật lý thông minh của bạn. 🌟\n\nTôi ở đây để giúp bạn hiểu rõ các khái niệm về **Dao động (Chương 1)** và **Sóng (Chương 2)**. \n\nTôi đã được **đồng bộ trực tiếp** với các thông số mô phỏng trên màn hình của bạn! Bạn thay đổi các thanh trượt hay thông số gì, tôi đều sẽ nhìn thấy thời gian thực để trả lời chính xác nhất.\n\n*Ví dụ bạn có thể hỏi:*\n- *\"Hãy giải thích tại sao khi tăng chiều dài L thì chu kỳ con lắc T lại dài hơn?\"*\n- *\"Tính chu kỳ lý thuyết với số liệu tôi đang chạy trên màn hình đi!\"*\n- *\"Sóng dọc và sóng ngang khác nhau như thế nào?\"*\n\nHãy nhắn câu hỏi của bạn xuống bên dưới nhé!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputValue.trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const history = messages
         .filter((m) => m.id !== "welcome")
         .map((m) => ({
           role: m.role,
           content: m.content
         }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: query,
          history: history,
          screenState: {
            activeExperiment,
            params
          }
        })
      });

      if (!res.ok) {
        throw new Error(`Mã lỗi máy chủ: ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let botResponse = "";

      const botMsgId = `bot-${Date.now()}`;
      // Add initial empty bot message
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          role: "assistant",
          content: "",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      let buffer = "";
      let isDone = false;
      while (reader && !isDone) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let boundary = buffer.indexOf("\n");
        while (boundary !== -1) {
          const line = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 1);

          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") {
              isDone = true;
              break;
            } else {
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                if (parsed.text !== undefined) {
                  botResponse += parsed.text;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === botMsgId ? { ...msg, content: botResponse } : msg
                    )
                  );
                }
              } catch (e) {
                // Ignore incomplete JSON chunks
              }
            }
          }
          boundary = buffer.indexOf("\n");
        }
      }

    } catch (err: any) {
      console.error("Chat Error:", err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Gia sư đang bận hoặc có lỗi kết nối đến API. Hãy kiểm tra cài đặt GEMINI_API_KEY và thử lại nhé!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa lịch sử trò chuyện không?")) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Chào bạn! Tôi là **UrLab Physics Tutor** - Gia sư Vật lý thông minh của bạn. 🌟\n\nTôi ở đây để giúp bạn hiểu rõ các khái niệm về **Dao động (Chương 1)** và **Sóng (Chương 2)**. \n\nHãy hỏi tôi bất kỳ câu hỏi nào nhé!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const cleanMathExpressions = (text: string): string => {
    if (!text) return "";
    let clean = text;

    clean = clean.replace(/\$\$(.*?)\$\$/g, "$1");
    clean = clean.replace(/\$(.*?)\$/g, "$1");
    clean = clean.replace(/\\\[(.*?)\\\]/g, "$1");
    clean = clean.replace(/\\\((.*?)\\\)/g, "$1");

    clean = clean.replace(/\\pi/g, "π");
    clean = clean.replace(/\\lambda/g, "λ");
    clean = clean.replace(/\\sqrt/g, "√");
    clean = clean.replace(/\\omega/g, "ω");
    clean = clean.replace(/\\theta/g, "θ");
    clean = clean.replace(/\\Delta/g, "Δ");
    clean = clean.replace(/\\cdot/g, "·");
    clean = clean.replace(/\\times/g, "×");
    clean = clean.replace(/\\pm/g, "±");

    const fracRegex = /\\frac\s*\{(.*?)\}\s*\{(.*?)\}/g;
    while (fracRegex.test(clean)) {
      clean = clean.replace(fracRegex, "($1 / $2)");
    }

    const sqrtBracesRegex = /√\s*\{(.*?)\}/g;
    while (sqrtBracesRegex.test(clean)) {
      clean = clean.replace(sqrtBracesRegex, "√($1)");
    }

    clean = clean.replace(/_\{(.*?)\}/g, "$1");

    return clean;
  };

  const formatMessageText = (text: string) => {
    const cleanedText = cleanMathExpressions(text);
    return cleanedText.split("\n").map((line, index) => {
      let displayLine = line;
      let isBullet = false;
      const trimmed = line.trim();
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        isBullet = true;
        // Strip leading list marker
        displayLine = line.replace(/^\s*[-*]\s/, "");
      } else if (trimmed === "-" || trimmed === "*") {
        isBullet = true;
        displayLine = "";
      }

      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIdx = 0;
      let match;
      
      while ((match = boldRegex.exec(displayLine)) !== null) {
        if (match.index > lastIdx) {
          parts.push(displayLine.substring(lastIdx, match.index));
        }
        parts.push(<strong key={match.index} className="font-bold text-slate-900">{match[1]}</strong>);
        lastIdx = boldRegex.lastIndex;
      }
      if (lastIdx < displayLine.length) {
        parts.push(displayLine.substring(lastIdx));
      }

      return (
        <p key={index} className={`leading-relaxed ${isBullet ? "pl-4 list-item list-disc ml-4" : "mt-1"}`}>
          {parts.length > 0 ? parts : displayLine}
        </p>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-96 max-w-[calc(100vw-2rem)] h-[480px] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-300">
          <div className="bg-gradient-to-r from-blue-600 to-teal-500 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <div className="bg-white/10 p-1.5 rounded-lg">
                <Sparkles className="h-4.5 w-4.5 text-teal-300 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight">UrLab Tutor AI</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] text-teal-100 font-medium">Đồng bộ phòng Lab</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                className="p-1 hover:bg-white/10 rounded-md transition-colors"
                title="Xóa cuộc trò chuyện"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-md transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white text-slate-800 rounded-bl-none border border-slate-200/60"
                  }`}
                >
                  <div className="space-y-1">
                    {formatMessageText(msg.content)}
                  </div>
                  <span className={`block text-[9px] mt-1 text-right ${
                    msg.role === "user" ? "text-blue-200" : "text-slate-400"
                  }`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-800 border border-slate-200/60 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  <span>Tutor AI đang tính toán giải thích...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-150 bg-white flex gap-2">
            <input
              id="chatbot-input-field"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Hỏi về dao động, chu kỳ, hoặc sóng..."
              className="flex-1 px-3 py-2 text-xs text-slate-850 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none placeholder:text-slate-400"
            />
            <button
              id="chatbot-send-btn"
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 disabled:scale-100 transition-all cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button
        id="chatbot-floating-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-teal-500 text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-blue-500/10 group"
      >
        <MessageSquare className="h-6 w-6 group-hover:rotate-6 transition-transform" />
      </button>
    </div>
  );
}
