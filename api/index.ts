import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

let lastApiKey: string | null = null;
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "") {
    throw new Error("MISSING_KEY");
  }
  const isValidFormat = apiKey.startsWith("AIzaSy") || apiKey.startsWith("AQ");
  if (!isValidFormat) {
    throw new Error("INVALID_FORMAT");
  }
  if (!aiClient || lastApiKey !== apiKey) {
    lastApiKey = apiKey;
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Reusable function to call generateContent with automatic 3-time retry for 503 Overloaded errors
async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: Parameters<typeof ai.models.generateContent>[0],
  maxRetries = 3,
  delayMs = 1000
): Promise<ReturnType<typeof ai.models.generateContent>> {
  let attempt = 0;
  while (true) {
    try {
      attempt++;
      return await ai.models.generateContent(params);
    } catch (error: any) {
      const is503 = 
        error.status === 503 || 
        error.statusCode === 503 || 
        (error.message && error.message.includes("503")) ||
        (error.message && error.message.toLowerCase().includes("overloaded")) ||
        (error.message && error.message.toLowerCase().includes("service unavailable"));

      if (is503 && attempt < maxRetries) {
        console.warn(`[Gemini API] Attempt ${attempt} failed with 503/Overloaded. Retrying in ${delayMs * attempt}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
        continue;
      }
      throw error;
    }
  }
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.post(["/api/chat", "/chat"], async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Message parameter is required and must be a string." });
      return;
    }

    let ai;
    try {
      ai = getGeminiClient();
    } catch (keyError: any) {
      if (keyError.message === "INVALID_FORMAT") {
        res.json({
          text: `⚠️ **API Key không đúng định dạng!**

Mã API Key của Google Gemini **bắt buộc phải bắt đầu bằng 'AIzaSy' hoặc 'AQ'** (khoảng 39 ký tự trở lên). 

Vui lòng tạo một API Key mới bằng cách chọn **Create project** (Tạo dự án mới) trong Google AI Studio và sao chép mã đó dán lại vào phần Secrets/Environment Variables nhé!`,
          mock: true
        });
        return;
      }

      res.json({
        text: `Chào bạn! Tôi là **UrLab Physics Tutor**. Hiện tại API Key của Gemini chưa được cấu hình đầy đủ trên Workspace của hệ thống. 

Tuy nhiên, tôi vẫn có thể giải đáp các nguyên lý vật lý cho bạn một cách trực quan:
1. **Chu kỳ của con lắc đơn**: Xác định bởi công thức **T = 2π·√(L/g)**. Khi tăng chiều dài dây treo L, chu kỳ T sẽ dài ra (con lắc dao động chậm lại).
2. **Chu kỳ con lắc lò xo**: Xác định bởi công thức **T = 2π·√(m/k)**. Khi tăng khối lượng vật m thì chu kỳ T tăng, khi tăng độ cứng của lò xo k thì lò xo kéo kéo dứt khoát hơn nên chu kỳ T giảm.
3. **Giao thoa ánh sáng khe Young**: Khoảng vân **i = (λ·D) / a**. 
   - Nếu tăng bước sóng λ (ví dụ chuyển từ ánh sáng Lục sang Đỏ) hoặc kéo màn ra xa (tăng D) thì hệ vân dãn rộng ra (khoảng vân i tăng).
   - Nếu dịch hai khe ra xa nhau (tăng a) thì các vân xếp khít lại gần nhau hơn (khoảng vân i giảm).
   - Với hai chùm sáng bước sóng khác nhau, vị trí vân sáng trùng nhau tuân theo điều kiện: **k1·λ1 = k2·λ2**.

*Hãy cấu hình GEMINI_API_KEY trong Settings > Secrets để bắt đầu trò chuyện tương tác trực tuyến cùng AI nhé!*`,
        mock: true
      });
      return;
    }

    const systemInstruction = `You are "UrLab Tutor" - an encouraging, friendly, and highly visual AI Physics Tutor for 11th-grade students.
Your target audience is high school students who find physics dry or difficult.
Use clear, highly visual metaphors (like playground swings, water ripples, laser beams, rainbow colors) to explain equations and physical concepts.
Your tone should be warm, patient, and engaging. Avoid long text-heavy blocks; use formatting (bullet points, bold key terms, clear headers) to make concepts digestable.
Your currently helping them with:
- Chapter 1: Oscillations (Simple Pendulum, Spring-Mass oscillator, Period, Frequency, Amplitude, Gravity, restoring force).
- Chapter 2: Waves and Light Waves (Mechanical waves, frequency, wavelength, speed of wave, wave interference, diffraction, Young's double-slit Light interference, fringe width i = lambda * D / a, overlap of two different wavelengths).

CRITICAL FORMULA FORMATTING RULE: 
- Do NOT use LaTeX math equations (like \\frac, \\sqrt, \\pi, \\lambda, $ or $$ signs) as the student's browser cannot render raw LaTeX equations.
- Always write equations in a super clean, beautiful, and easy-to-read Unicode layout.
- For example, write: 
  * T = 2π·√(L/g)
  * T = 2π·√(m/k)
  * i = (λ·D) / a
  * λ = v / f
  * f = 1 / T
  * k1·λ1 = k2·λ2
- Use normal superscript for powers, like x² or t², instead of x^2. Always keep formulas simple, well-spaced, and highly readable.

If the student writes in Vietnamese (e.g., "con lắc đơn", "chu kỳ", "giao thoa ánh sáng", "khoảng vân"), reply in clear, friendly Vietnamese. If they write in English, reply in English.
Keep explanations concise, focused, and always relate the answer back to how they can experiment with variables on their screen (e.g., "Hãy thử thay đổi khoảng cách khe a hoặc bước sóng lambda trên thanh trượt và xem khoảng vân i thay đổi thế nào nhé!").
Keep safety rules in mind: speak only about high school physics/science and UrLab. If asked unrelated questions, politely guide them back to physics.`;

    const formattedContents = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        formattedContents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content || "" }]
        });
      }
    }
    formattedContents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Chat API Error:", error);
    const errMsg = error.message || "";
    if (errMsg.includes("API_KEY_INVALID") || errMsg.includes("API key not valid") || errMsg.includes("invalid api key")) {
      res.json({
        text: `⚠️ **Lỗi API Key không hợp lệ từ máy chủ Google!**

Khóa bạn nhập bắt đầu bằng \`AIzaSy\` hoặc \`AQ.\` nhưng Google báo lỗi là không hợp lệ (có thể khóa đã bị xóa, bị vô hiệu hóa, gõ thiếu ký tự hoặc chưa được liên kết thanh toán nếu bắt buộc).

Vui lòng tạo một API Key mới bằng cách chọn **Create project** (Tạo dự án mới) trong Google AI Studio và thử lại nhé!`,
        mock: true
      });
      return;
    }
    res.status(500).json({ error: error.message || "Failed to generate tutor response." });
  }
});

app.post(["/api/quiz", "/quiz"], async (req, res) => {
  const { topic } = req.body;
  const topicId = topic || "pendulum";

  const mockQuizQuestions: Record<string, Array<{ question: string, options: string[], correctAnswer: number, explanation: string }>> = {
    pendulum: [
      {
        question: "Một học sinh thực hiện thí nghiệm với con lắc đơn có chiều dài L. Nếu học sinh đó di chuyển thí nghiệm từ Trái Đất (g = 9.8 m/s²) lên Mặt Trăng (g_m = 1.62 m/s²) thì chu kỳ dao động T của con lắc sẽ biến đổi thế nào?",
        options: [
          "Chu kỳ T sẽ tăng lên đáng kể vì gia tốc g giảm.",
          "Chu kỳ T sẽ giảm đi vì trọng lực yếu hơn.",
          "Chu kỳ T giữ nguyên vì chiều dài L không đổi.",
          "Chu kỳ T sẽ bằng 0 vì trên Mặt Trăng không có khí quyển."
        ],
        correctAnswer: 0,
        explanation: "Chu kỳ con lắc đơn được xác định bởi công thức T = 2π·√(L/g). Do gia tốc trọng trường g ở Mặt Trăng nhỏ hơn g ở Trái Đất, mẫu số g giảm làm cho giá trị phân số L/g tăng lên, dẫn đến chu kỳ T tăng lên. Lúc này con lắc sẽ dao động chậm hơn!"
      },
      {
        question: "Lực đóng vai trò là lực kéo về (lực phục hồi) làm con lắc đơn dao động điều hòa quanh vị trí cân bằng (với góc lệch nhỏ) là lực nào?",
        options: [
          "Lực căng của sợi dây treo.",
          "Thành phần của trọng lực theo phương tiếp tuyến với quỹ đạo.",
          "Toàn bộ trọng lực tác dụng lên quả nặng.",
          "Lực quán tính ly tâm."
        ],
        correctAnswer: 1,
        explanation: "Lực kéo về của con lắc đơn chính là thành phần tiếp tuyến của trọng lực: Pt = -m·g·sin(θ). Lực này luôn hướng về vị trí cân bằng và kéo quả nặng quay lại khi lệch khỏi vị trí thấp nhất."
      }
    ],
    spring: [
      {
        question: "Một con lắc lò xo gồm vật nặng m và lò xo có độ cứng k đang dao động điều hòa. Nếu ta thay vật nặng bằng một vật khác có khối lượng lớn gấp 4 lần thì chu kỳ dao động riêng T của con lắc sẽ thay đổi như thế nào?",
        options: [
          "Tăng lên 4 lần.",
          "Giảm đi 2 lần.",
          "Tăng lên 2 lần.",
          "Giảm đi 4 lần."
        ],
        correctAnswer: 2,
        explanation: "Chu kỳ con lắc lò xo là T = 2π·√(m/k). Khi khối lượng m tăng lên 4 lần, chu kỳ T sẽ tăng lên √(4) = 2 lần. Do đó, hệ sẽ dao động chậm hơn và nặng nề hơn!"
      },
      {
        question: "Cơ năng của một con lắc lò xo dao động điều hòa được bảo toàn và có biểu thức liên hệ với độ cứng k và biên độ dao động A là biểu thức nào?",
        options: [
          "W = 1/2 · k · A",
          "W = 1/2 · m · A²",
          "W = 1/2 · k · A²",
          "W = m · g · A"
        ],
        correctAnswer: 2,
        explanation: "Cơ năng của con lắc lò xo dao động điều hòa bằng tổng động năng và thế năng tại mọi thời điểm, tỉ lệ thuận với bình phương biên độ dao động: W = 1/2 · k · A²."
      }
    ],
    wave: [
      {
        question: "Hai nguồn sóng nước kết hợp S1 và S2 dao động cùng pha, tạo ra hiện tượng giao thoa sóng trên mặt nước. Một điểm M nằm trên vùng giao thoa có hiệu đường truyền d2 - d1 = k·λ (với k là số nguyên, λ là bước sóng). Điểm M này dao động với biên độ như thế nào?",
        options: [
          "Dao động với biên độ cực tiểu (triệt tiêu lẫn nhau).",
          "Dao động với biên độ cực đại (hỗ trợ tăng cường nhau).",
          "Không dao động.",
          "Dao động với biên độ bằng một nửa biên độ của nguồn."
        ],
        correctAnswer: 1,
        explanation: "Trong hiện tượng giao thoa sóng với hai nguồn cùng pha, những điểm có hiệu đường truyền sóng bằng một số nguyên lần bước sóng (d2 - d1 = k·λ) là vị trí cực đại giao thoa, tại đó hai sóng gặp nhau cùng pha và hỗ trợ tăng cường lẫn nhau."
      },
      {
        question: "Một sóng cơ hình sin truyền dọc theo một sợi dây đàn hồi với tần số f = 10 Hz và tốc độ truyền v = 2 m/s. Bước sóng λ của sóng cơ này là bao nhiêu?",
        options: [
          "20 m",
          "0.2 m (20 cm)",
          "5 m",
          "0.5 m (50 cm)"
        ],
        correctAnswer: 1,
        explanation: "Bước sóng λ được tính theo công thức λ = v / f. Với v = 2 m/s và f = 10 Hz, ta có λ = 2 / 10 = 0.2 m = 20 cm."
      }
    ],
    light: [
      {
        question: "Trong thí nghiệm giao thoa ánh sáng khe Young, nếu học sinh thay thế nguồn sáng từ màu lục (λ = 530 nm) sang nguồn sáng màu đỏ (λ = 700 nm) trong khi giữ nguyên khoảng cách 2 khe a và khoảng cách đến màn D, khoảng vân i trên màn sẽ thay đổi như thế nào?",
        options: [
          "Khoảng vân i tăng lên, hệ vân dãn rộng ra.",
          "Khoảng vân i giảm đi, các vạch sát lại gần nhau.",
          "Khoảng vân i không đổi vì vị trí màn không thay đổi.",
          "Hệ vân biến mất hoàn toàn."
        ],
        correctAnswer: 0,
        explanation: "Khoảng vân giao thoa được xác định bằng công thức i = (λ·D)/a. Vì bước sóng màu đỏ (700 nm) lớn hơn màu lục (530 nm), khoảng vân i tỉ lệ thuận với λ nên khoảng vân i sẽ tăng lên, làm cho các vân dãn rộng ra xa nhau hơn."
      },
      {
        question: "Tại vị trí trung tâm (chính giữa) của màn quan sát trong thí nghiệm giao thoa ánh sáng khe Young là vân gì?",
        options: [
          "Luôn là vân sáng trung tâm (vân sáng bậc 0).",
          "Luôn là vân tối bậc 1.",
          "Có thể là vân sáng hoặc vân tối tùy thuộc vào bước sóng.",
          "Là một vạch màu đen hoàn toàn."
        ],
        correctAnswer: 0,
        explanation: "Tại tâm màn quan sát, hiệu đường đi từ hai khe S1 và S2 bằng 0 (d2 - d1 = 0). Do đó, hai sóng từ hai nguồn kết hợp luôn đồng pha và giao thoa tạo nên vân sáng trung tâm bậc 0."
      }
    ]
  };

  try {
    let ai;
    try {
      ai = getGeminiClient();
    } catch (keyError) {
      const questions = mockQuizQuestions[topicId] || mockQuizQuestions.pendulum;
      const randomIndex = Math.floor(Math.random() * questions.length);
      res.json({ ...questions[randomIndex], mock: true });
      return;
    }

    const topicLabels: Record<string, string> = {
      pendulum: "Con lắc đơn, chu kỳ, gia tốc g, chiều dài L (Vật lý 11 Chương 1)",
      spring: "Con lắc lò xo, độ cứng k, khối lượng m, cơ năng (Vật lý 11 Chương 1)",
      wave: "Sóng cơ học, tốc độ truyền sóng v, tần số f, bước sóng λ, giao thoa sóng nước (Vật lý 11 Chương 2)",
      light: "Giao thoa ánh sáng khe Young, khoảng vân i, bước sóng λ, khoảng cách khe a, màn D (Vật lý 11 Chương 2)"
    };

    const topicName = topicLabels[topicId] || topicLabels.pendulum;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `Tạo một câu hỏi trắc nghiệm vật lý 11 có đúng 4 lựa chọn (A, B, C, D) về chủ đề: "${topicName}". Hãy xuất ra định dạng JSON khớp hoàn toàn với schema yêu cầu. Câu hỏi cần mang tính giáo dục cao, kiểm tra hiểu biết định tính hoặc tính toán đơn giản, viết bằng tiếng Việt tự nhiên và thân thiện.` }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            question: { 
              type: "STRING",
              description: "Câu hỏi trắc nghiệm ngắn gọn, rõ ràng bằng tiếng Việt. Chú ý: Viết công thức vật lý dưới dạng ký tự unicode đẹp đẽ, ví dụ: T = 2π·√(L/g) thay vì dùng mã LaTeX."
            },
            options: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Mảng gồm đúng 4 câu trả lời lựa chọn (độ dài đúng bằng 4)"
            },
            correctAnswer: {
              type: "INTEGER",
              description: "Số nguyên từ 0 đến 3 tương ứng với vị trí câu trả lời đúng trong mảng options"
            },
            explanation: { 
              type: "STRING", 
              description: "Giải thích ngắn gọn, súc tích và dễ hiểu bằng tiếng Việt tại sao phương án đó là đúng, sử dụng công thức unicode."
            }
          },
          required: ["question", "options", "correctAnswer", "explanation"]
        },
        temperature: 0.9,
      }
    });

    if (response.text) {
      const parsedQuiz = JSON.parse(response.text.trim());
      res.json(parsedQuiz);
    } else {
      throw new Error("Empty response from Gemini quiz generator");
    }
  } catch (error: any) {
    console.error("Gemini Quiz API Error:", error);
    const questions = mockQuizQuestions[topicId] || mockQuizQuestions.pendulum;
    const randomIndex = Math.floor(Math.random() * questions.length);
    res.json(questions[randomIndex]);
  }
});


async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode serving static dist files...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`UrLab Server is successfully listening on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  setupViteOrStatic().catch((err) => {
    console.error("Error setting up server:", err);
    process.exit(1);
  });
}

export default app;
