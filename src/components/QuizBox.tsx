import React, { useState, useEffect } from "react";
import { HelpCircle, CheckCircle2, XCircle, Sparkles, RefreshCw, Trophy, ArrowRight, BrainCircuit } from "lucide-react";
import { QuizQuestion } from "../types";
import katex from "katex";
import "katex/dist/katex.min.css";

interface QuizBoxProps {
  experimentId: "pendulum" | "spring" | "wave" | "light";
}

export default function QuizBox({ experimentId }: QuizBoxProps) {
  const [topic, setTopic] = useState<string>(experimentId);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const formatQuizText = (text: string) => {
    if (!text) return null;

    const tokens: Array<{ type: "text" | "inline-math" | "block-math"; content: string }> = [];
    let currentIndex = 0;

    const mathRegex = /(\$\$([\s\S]*?)\$\$)|(\\\[([\s\S]*?)\\\])|(\$([^\$\n]+?)\$)|(\\\(([\s\S]*?)\\\))/g;

    let match;
    while ((match = mathRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      
      if (matchIndex > currentIndex) {
        tokens.push({
          type: "text",
          content: text.substring(currentIndex, matchIndex),
        });
      }

      if (match[1] !== undefined) {
        tokens.push({ type: "block-math", content: match[2] });
      } else if (match[3] !== undefined) {
        tokens.push({ type: "block-math", content: match[4] });
      } else if (match[5] !== undefined) {
        tokens.push({ type: "inline-math", content: match[6] });
      } else if (match[7] !== undefined) {
        tokens.push({ type: "inline-math", content: match[8] });
      }

      currentIndex = mathRegex.lastIndex;
    }

    if (currentIndex < text.length) {
      tokens.push({
        type: "text",
        content: text.substring(currentIndex),
      });
    }

    return tokens.map((token, idx) => {
      if (token.type === "block-math") {
        try {
          const html = katex.renderToString(token.content, {
            displayMode: true,
            throwOnError: false,
          });
          return (
            <div
              key={`block-math-${idx}`}
              className="my-3 overflow-x-auto py-2 text-center bg-slate-50/70 rounded-xl px-3 border border-slate-100 scrollbar-thin select-all"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (err) {
          return <span key={`err-${idx}`}>$${token.content}$$</span>;
        }
      } else if (token.type === "inline-math") {
        try {
          const html = katex.renderToString(token.content, {
            displayMode: false,
            throwOnError: false,
          });
          return (
            <span
              key={`inline-math-${idx}`}
              className="inline-block px-0.5 align-middle font-serif"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (err) {
          return <span key={`err-${idx}`}>${token.content}$</span>;
        }
      } else {
        const boldRegex = /\*\*(.*?)\*\*/g;
        const parts: React.ReactNode[] = [];
        let lastBoldIdx = 0;
        let boldMatch;

        while ((boldMatch = boldRegex.exec(token.content)) !== null) {
          if (boldMatch.index > lastBoldIdx) {
            parts.push(token.content.substring(lastBoldIdx, boldMatch.index));
          }
          parts.push(
            <strong key={`bold-${idx}-${boldMatch.index}`} className="font-semibold text-slate-900">
              {boldMatch[1]}
            </strong>
          );
          lastBoldIdx = boldRegex.lastIndex;
        }

        if (lastBoldIdx < token.content.length) {
          parts.push(token.content.substring(lastBoldIdx));
        }

        return <span key={`text-${idx}`}>{parts.length > 0 ? parts : token.content}</span>;
      }
    });
  };

  // Auto update topic when the lab experiment tab changes
  useEffect(() => {
    setTopic(experimentId);
    // Automatically load the first question for the new topic
    handleGenerateQuestion(experimentId);
  }, [experimentId]);

  const handleGenerateQuestion = async (selectedTopic = topic) => {
    setLoading(true);
    setSelectedAnswer(null);
    setHasSubmitted(false);
    setError(null);

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: selectedTopic }),
      });

      if (!res.ok) {
        throw new Error("Không thể kết nối tới máy chủ AI.");
      }

      const data = await res.json();
      if (data.question && Array.isArray(data.options)) {
        setQuestion(data);
      } else {
        throw new Error("Dữ liệu câu hỏi bị lỗi định dạng.");
      }
    } catch (err: any) {
      console.error("Quiz Fetch Error:", err);
      setError("Đã xảy ra lỗi khi tạo câu hỏi. Vui lòng bấm thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerClick = (optionIndex: number) => {
    if (hasSubmitted) return; // Prevent changing answer after submission
    setSelectedAnswer(optionIndex);
    setHasSubmitted(true);
    
    // Update score
    const isCorrect = optionIndex === question?.correctAnswer;
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));
  };

  // Human-readable labels for options
  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-4">
        <div className="flex items-center gap-2.5">
          <BrainCircuit className="h-6 w-6 text-purple-600 animate-pulse" />
          <div>
            <h3 className="text-lg font-bold text-slate-900">Trắc Nghiệm AI 11</h3>
            <p className="text-xs text-slate-500 font-medium">Học vui vẻ bằng câu hỏi phản xạ 4 lựa chọn</p>
          </div>
        </div>

        {/* Score Board */}
        <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-xl text-purple-700 font-bold text-sm">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span>Điểm số: {score.correct}/{score.total}</span>
        </div>
      </div>

      {/* Topic Information (Locked to Active Lab) */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-150 p-3.5 rounded-2xl">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đang kiểm tra chủ đề:</span>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-black rounded-xl border border-purple-200">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
          </span>
          {topic === "pendulum"
            ? "CON LẮC ĐƠN"
            : topic === "spring"
            ? "CON LẮC LÒ XO"
            : topic === "wave"
            ? "GIAO THOA SÓNG"
            : "GIAO THOA ÁNH SÁNG"}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3.5">
          <div className="relative flex items-center justify-center">
            <RefreshCw className="h-10 w-10 text-purple-600 animate-spin" />
            <Sparkles className="h-4 w-4 text-amber-400 absolute animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">Tutor AI đang chuẩn bị câu hỏi...</p>
            <p className="text-xs text-slate-500 mt-1">Sắp xong rồi! Đề bài đang được tùy chỉnh riêng cho bạn.</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center space-y-3">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button
            id="quiz-error-retry"
            onClick={() => handleGenerateQuestion()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Thử lại ngay
          </button>
        </div>
      ) : question ? (
        <div className="space-y-5">
          {/* Question Text */}
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 bg-purple-600 h-full" />
            <div className="flex items-start gap-2.5">
              <HelpCircle className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
              <div className="text-sm sm:text-base font-bold text-slate-850 leading-relaxed select-text">
                {formatQuizText(question.question)}
              </div>
            </div>
          </div>

          {/* 4 Choices list */}
          <div className="grid grid-cols-1 gap-3">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = question.correctAnswer === index;
              
              let optionStyle = "border-slate-200 hover:border-purple-300 hover:bg-purple-50/20";
              let badgeStyle = "bg-slate-100 text-slate-600 group-hover:bg-purple-100 group-hover:text-purple-700";

              if (hasSubmitted) {
                if (isCorrect) {
                  optionStyle = "bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold shadow-sm shadow-emerald-100";
                  badgeStyle = "bg-emerald-500 text-white";
                } else if (isSelected) {
                  optionStyle = "bg-rose-50 border-rose-350 text-rose-950 font-medium";
                  badgeStyle = "bg-rose-500 text-white";
                } else {
                  optionStyle = "opacity-50 border-slate-200 cursor-not-allowed";
                  badgeStyle = "bg-slate-100 text-slate-500";
                }
              }

              return (
                <button
                  id={`quiz-option-${index}`}
                  key={index}
                  onClick={() => handleAnswerClick(index)}
                  disabled={hasSubmitted}
                  className={`flex items-center gap-3.5 w-full text-left p-3.5 rounded-xl border text-sm transition-all group select-none ${
                    !hasSubmitted ? "cursor-pointer hover:translate-x-1 active:scale-99" : ""
                  } ${optionStyle}`}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg font-bold text-xs shrink-0 transition-colors ${badgeStyle}`}>
                    {optionLabels[index]}
                  </span>
                  <span className="flex-1 text-slate-800 font-medium text-xs sm:text-sm">{formatQuizText(option)}</span>
                  
                  {hasSubmitted && isCorrect && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  )}
                  {hasSubmitted && isSelected && !isCorrect && (
                    <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Area */}
          {hasSubmitted && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-2.5 animate-fadeIn">
              <div className="flex items-center gap-2 text-slate-850 font-bold text-sm">
                <Sparkles className="h-4.5 w-4.5 text-amber-500" />
                <span>Giải thích từ Tutor AI</span>
              </div>
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium select-text">
                {formatQuizText(question.explanation)}
              </div>
              
              {/* Next Question action */}
              <div className="pt-2 flex justify-end">
                <button
                  id="quiz-next-question"
                  onClick={() => handleGenerateQuestion()}
                  className="flex items-center gap-1.5 px-4.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-purple-100 cursor-pointer hover:translate-x-0.5 active:scale-95"
                >
                  Câu hỏi tiếp theo
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <button
            id="quiz-init-start"
            onClick={() => handleGenerateQuestion()}
            className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-md"
          >
            Bắt đầu làm trắc nghiệm
          </button>
        </div>
      )}
    </div>
  );
}
