import express from "express";
import path from "path";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

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
  maxRetries = 6,
  initialDelayMs = 1000
): Promise<ReturnType<typeof ai.models.generateContent>> {
  let attempt = 0;
  while (true) {
    try {
      attempt++;
      return await ai.models.generateContent(params);
    } catch (error: any) {
      const errorStr = `${error.status} ${error.statusCode} ${error.message} ${JSON.stringify(error)}`.toLowerCase();
      const isTransient = 
        error.status === 503 || 
        error.statusCode === 503 || 
        error.status === 429 || 
        error.statusCode === 429 ||
        errorStr.includes("503") ||
        errorStr.includes("429") ||
        errorStr.includes("overloaded") ||
        errorStr.includes("service unavailable") ||
        errorStr.includes("high demand") ||
        errorStr.includes("temporary") ||
        errorStr.includes("unavailable") ||
        errorStr.includes("resource_exhausted") ||
        errorStr.includes("resource exhausted") ||
        errorStr.includes("rate limit") ||
        errorStr.includes("rate_limit");

      if (isTransient && attempt < maxRetries) {
        const delay = initialDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500;
        console.warn(`[Gemini API Quiz] Attempt ${attempt} failed with transient error. Retrying in ${delay.toFixed(0)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

function getFriendlyErrorMessage(errorMsg: string): string {
  if (!errorMsg) return "Đã xảy ra lỗi không xác định khi kết nối với AI.";
  
  const msgLower = errorMsg.toLowerCase();
  
  // 1. Quota / Rate limit (RESOURCE_EXHAUSTED / 429)
  if (
    msgLower.includes("resource_exhausted") || 
    msgLower.includes("quota") || 
    msgLower.includes("429") || 
    msgLower.includes("limit") ||
    msgLower.includes("exceeded")
  ) {
    return "Gia sư AI tạm thời hết lượt yêu cầu miễn phí (RESOURCE_EXHAUSTED / Quota Exceeded). Hệ thống dùng thử miễn phí thường giới hạn số câu hỏi trong mỗi phút. Bạn vui lòng đợi khoảng 30 giây rồi gửi lại câu hỏi nhé! ⏳";
  }
  
  // 2. Overloaded or Service Unavailable (503 / 500)
  if (
    msgLower.includes("overloaded") || 
    msgLower.includes("503") || 
    msgLower.includes("unavailable") || 
    msgLower.includes("busy")
  ) {
    return "Hệ thống Google Gemini đang bị quá tải hoặc bận (503 Service Unavailable). Bạn vui lòng thử lại sau vài giây nhé! 🔄";
  }
  
  // 3. API Key issues
  if (
    msgLower.includes("key") || 
    msgLower.includes("api_key") || 
    msgLower.includes("unauthorized") || 
    msgLower.includes("400") || 
    msgLower.includes("invalid")
  ) {
    return "Khóa API (GEMINI_API_KEY) chưa được cấu hình chính xác hoặc đã hết hiệu lực. Bạn vui lòng kiểm tra lại cấu hình API Key trong mục Settings > Secrets.";
  }

  // 4. Try parsing JSON if errorMsg contains nested JSON from SDK error response
  try {
    if (errorMsg.trim().startsWith("{")) {
      const parsed = JSON.parse(errorMsg);
      if (parsed.error?.message) {
        return getFriendlyErrorMessage(parsed.error.message);
      }
    }
    const jsonMatch = errorMsg.match(/\{.*\}/s);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error?.message) {
        return getFriendlyErrorMessage(parsed.error.message);
      }
    }
  } catch (e) {
    // Ignore JSON parsing errors
  }

  // Fallback simplified clean error message
  return `Máy chủ gặp sự cố kết nối (${errorMsg.replace(/https?:\/\/[^\s]+/g, '').substring(0, 150)}...)`;
}

function getLocalBackupResponse(message: string, screenState: any): string {
  const msgLower = message.toLowerCase().trim();
  let response = "";

  const activeExp = screenState?.activeExperiment || "";
  const params = screenState?.params || {};

  let currentStatsInfo = "";
  if (activeExp === "pendulum") {
    const L = params.length || 1.5;
    const g = params.gravity || 9.8;
    const m = params.mass || 1.0;
    const T = (2 * Math.PI * Math.sqrt(L / g)).toFixed(3);
    const omega = Math.sqrt(g / L).toFixed(2);
    currentStatsInfo = `\n\n**📊 Thông số thí nghiệm hiện tại (Con lắc đơn):**
- Chiều dài dây treo ℓ = **${L} m**
- Gia tốc trọng trường g = **${g} m/s²**
- Khối lượng quả nặng m = **${m} kg**
- 👉 **Chu kỳ dao động lý thuyết: T = 2π·√(ℓ/g) ≈ ${T} giây**
- 👉 **Tần số góc: ω = √(g/ℓ) ≈ ${omega} rad/s**`;
  } else if (activeExp === "spring") {
    const k = params.k || 40;
    const m = params.mass || 1.0;
    const T = (2 * Math.PI * Math.sqrt(m / k)).toFixed(3);
    const omega = Math.sqrt(k / m).toFixed(2);
    currentStatsInfo = `\n\n**📊 Thông số thí nghiệm hiện tại (Con lắc lò xo):**
- Độ cứng lò xo k = **${k} N/m**
- Khối lượng vật nặng m = **${m} kg**
- 👉 **Chu kỳ dao động lý thuyết: T = 2π·√(m/k) ≈ ${T} giây**
- 👉 **Tần số góc: ω = √(k/m) ≈ ${omega} rad/s**`;
  } else if (activeExp === "wave") {
    const f = params.frequency || 1.5;
    const v = params.speed || 100;
    const lambda = (v / f).toFixed(1);
    currentStatsInfo = `\n\n**📊 Thông số thí nghiệm hiện tại (Giao thoa sóng):**
- Tần số nguồn f = **${f} Hz**
- Tốc độ truyền sóng v = **${v} mm/s**
- 👉 **Bước sóng lan truyền lý thuyết: λ = v/f ≈ ${lambda} mm**`;
  } else if (activeExp === "light") {
    const a = params.a || 1.0;
    const D = params.D || 2.0;
    const lambda = params.lambda1 || 650;
    const i = ((lambda * 1e-9 * D) / (a * 1e-3) * 1e3).toFixed(3);
    currentStatsInfo = `\n\n**📊 Thông số thí nghiệm hiện tại (Giao thoa ánh sáng):**
- Khoảng cách hai khe a = **${a} mm**
- Khoảng cách đến màn D = **${D} m**
- Bước sóng ánh sáng λ = **${lambda} nm**
- 👉 **Khoảng vân lý thuyết: i = (λ·D)/a ≈ ${i} mm**`;
  }

  const containsAny = (keywords: string[]) => keywords.some(kw => msgLower.includes(kw));

  if (containsAny(["chào", "hello", "hi", "bạn là ai", "tutor", "giúp", "who are you"])) {
    response = `👋 Chào bạn! Tôi là **UrLab Tutor AI** - gia sư ảo đồng hành cùng bạn tại phòng thí nghiệm vật lý UrLab.
    
Tôi có thể hướng dẫn bạn hiểu sâu các bài học trong Sách giáo khoa Vật lý 11 (Kết nối tri thức), giải đáp công thức, giải thích hiện tượng và hướng dẫn làm các thí nghiệm về:
1. **Con lắc đơn** (Chu kỳ, năng lượng, lực kéo về)
2. **Con lắc lò xo** (Tần số, thế năng đàn hồi, định luật Hooke)
3. **Giao thoa sóng cơ** (Cực đại, cực tiểu, bước sóng)
4. **Giao thoa ánh sáng** (Thí nghiệm khe Young, tính khoảng vân i)

Hãy nhập bất kỳ câu hỏi nào bên dưới, tôi sẽ giải đáp chi tiết ngay nhé!`;
  } else if (containsAny(["con lắc đơn", "con lac don", "pendulum"]) || (containsAny(["chu kỳ", "chu ky"]) && containsAny(["dây", "day", "g", "l", "chiều dài", "chieu dai"]))) {
    response = `💡 **Kiến thức trọng tâm về Con lắc đơn (Bài 5 SGK Vật lý 11):**

- **Công thức tính chu kỳ dao động điều hòa (góc lệch nhỏ < 10°):**
  $$T = 2\\pi \\sqrt{\\frac{\\ell}{g}}$$
  *Trong đó:*
  + $\\ell$: Chiều dài dây treo (mét - m).
  + $g$: Gia tốc trọng trường (m/s²).
  + $T$: Chu kỳ dao động (giây - s).

- **Đặc điểm quan trọng:**
  + Chu kỳ con lắc đơn **chỉ phụ thuộc** vào chiều dài dây treo $\\ell$ và gia tốc trọng trường $g$.
  + Chu kỳ **không phụ thuộc** vào khối lượng $m$ của quả nặng hay biên độ góc $\\alpha_0$ (khi dao động nhỏ).
  + Khi tăng chiều dài $\\ell$ lên gấp 4 lần, chu kỳ $T$ sẽ tăng gấp $\\sqrt{4} = 2$ lần.

- **Năng lượng:** Cơ năng con lắc đơn được bảo toàn khi bỏ qua ma sát:
  $$W = W_đ + W_t = \\frac{1}{2} m v^2 + mg\\ell(1 - \\cos\\alpha) = \\text{hằng số}$$`;
  } else if (containsAny(["lò xo", "lo xo", "spring"]) || (containsAny(["chu kỳ", "chu ky"]) && containsAny(["độ cứng", "do cung", "k", "m", "khối lượng", "khoi luong"]))) {
    response = `💡 **Kiến thức trọng tâm về Con lắc lò xo (Bài 5 SGK Vật lý 11):**

- **Công thức tính chu kỳ dao động riêng:**
  $$T = 2\\pi \\sqrt{\\frac{m}{k}}$$
  *Trong đó:*
  + $m$: Khối lượng vật nặng (kilôgam - kg).
  + $k$: Độ cứng của lò xo (Niutơn trên mét - N/m).
  + $T$: Chu kỳ dao động (giây - s).

- **Đặc điểm quan trọng:**
  + Chu kỳ con lắc lò xo tỷ lệ thuận với căn bậc hai của khối lượng $m$ và tỷ lệ nghịch với căn bậc hai của độ cứng $k$.
  + Chu kỳ **không phụ thuộc** vào gia tốc trọng trường $g$ (nên dù mang lên Mặt Trăng hay Trái Đất, chu kỳ riêng của con lắc lò xo vẫn không đổi).
  + Chu kỳ **không phụ thuộc** vào biên độ dao động $A$ hay cách kích thích ban đầu.

- **Độ dãn ở Vị trí cân bằng (treo thẳng đứng):**
  $$\\Delta\\ell_0 = \\frac{mg}{k}$$

- **Thế năng đàn hồi:** $W_t = \\frac{1}{2} k x^2$.`;
  } else if (containsAny(["giao thoa sóng", "giao thoa song", "sóng cơ", "song co", "bước sóng", "buoc song", "độ lệch pha", "do lech pha", "cực đại", "cực tiểu", "cuc dai", "cuc tieu"])) {
    response = `💡 **Kiến thức trọng tâm về Giao thoa sóng cơ (Bài 12 SGK Vật lý 11):**

- **Bước sóng ($\\lambda$):** Quãng đường sóng truyền đi được trong một chu kỳ $T$:
  $$\\lambda = v \\cdot T = \\frac{v}{f}$$
  *Trong đó $v$ là tốc độ truyền sóng, $f$ là tần số.*

- **Điều kiện giao thoa sóng cơ (Hai nguồn kết hợp cùng pha):**
  + **Cực đại giao thoa** (Biên độ dao động lớn nhất): Hiệu đường truyền từ hai nguồn tới điểm đó bằng một số nguyên lần bước sóng:
    $$d_2 - d_1 = k \\cdot \\lambda \\quad (k \\in \\mathbb{Z})$$
  + **Cực tiểu giao thoa** (Biên độ dao động triệt tiêu): Hiệu đường truyền bằng một số nửa nguyên lần bước sóng:
    $$d_2 - d_1 = (k + 0.5) \\cdot \\lambda \\quad (k \\in \\mathbb{Z})$$

- **Độ lệch pha giữa hai điểm cách nhau d trên cùng một phương truyền sóng:**
  $$\\Delta\\varphi = \\frac{2\\pi d}{\\lambda}$$`;
  } else if (containsAny(["khoảng vân", "khoang van", "khe young", "giao thoa ánh sáng", "giao thoa anh sang", "vân sáng", "vân tối", "van sang", "van toi"])) {
    response = `💡 **Kiến thức trọng tâm về Giao thoa ánh sáng (Bài 14 SGK Vật lý 11):**

- **Thí nghiệm khe Young (Y-âng):** Dùng để đo bước sóng ánh sáng và chứng minh ánh sáng có tính chất sóng.
- **Công thức tính Khoảng vân ($i$):** Khoảng cách giữa hai vân sáng (hoặc hai vân tối) liên tiếp trên màn quan sát:
  $$i = \\frac{\\lambda D}{a}$$
  *Trong đó:*
  + $\\lambda$: Bước sóng ánh sáng (thường tính bằng nm hoặc $\\mu$m).
  + $D$: Khoảng cách từ hai khe đến màn quan sát (mét - m).
  + $a$: Khoảng cách giữa hai khe hẹp (milimét - mm).

- **Vị trí các vân giao thoa trên màn:**
  + **Vân sáng thứ $k$:** $x_s = k \\cdot i$
  + **Vân tối thứ $k$:** $x_t = (k + 0.5) \\cdot i$`;
  } else if (containsAny(["công thức", "cong thuc", "tóm tắt", "tom tat"])) {
    response = `📚 **Tổng hợp các công thức trọng tâm Vật lý 11 (Kết nối tri thức):**

1. **Chu kỳ con lắc đơn:**
   $$T = 2\\pi \\sqrt{\\frac{\\ell}{g}}$$

2. **Chu kỳ con lắc lò xo:**
   $$T = 2\\pi \\sqrt{\\frac{m}{k}}$$

3. **Mối liên hệ bước sóng:**
   $$\\lambda = v \\cdot T = \\frac{v}{f}$$

4. **Giao thoa sóng cơ (hai nguồn đồng pha):**
   + Cực đại: $d_2 - d_1 = k \\cdot \\lambda$
   + Cực tiểu: $d_2 - d_1 = (k + 0.5) \\cdot \\lambda$

5. **Khoảng vân giao thoa ánh sáng:**
   $$i = \\frac{\\lambda D}{a}$$
   + Vân sáng: $x_s = k \\cdot i$
   + Vân tối: $x_t = (k + 0.5) \\cdot i$`;
  } else if (containsAny(["tính", "tinh", "chạy", "chay", "thực hành", "thuc hanh", "đáp án", "dap an", "số liệu", "so lieu"])) {
    response = `🔍 **Hướng dẫn đo đạc số liệu thí nghiệm Vật lý 11:**

Dựa trên thông số bạn đang thiết lập trên phòng thí nghiệm, hệ thống của UrLab đã thực hiện phân tích tự động. Bạn có thể kéo trực tiếp các thanh trượt trên màn hình để thấy các số liệu đồ thị cập nhật ngay lập tức theo thời gian thực!`;
  } else {
    response = `📖 **Giải đáp Vật lý lớp 11 (Kết nối tri thức):**

Cảm ơn bạn đã hỏi về bài học vật lý này!
Trong dao động và hiện tượng sóng:
- Bản chất của dao động tự do là quá trình biến đổi liên tục giữa **Động năng** và **Thế năng**, cơ năng toàn phần bảo toàn.
- Sóng cơ và sóng ánh sáng mang năng lượng lan truyền. Khi hai nguồn kết hợp gặp nhau sẽ tạo ra hệ vân giao thoa cực đại/cực tiểu đối xứng qua trung tâm.

*Gợi ý:* Hãy thay đổi trực tiếp các thông số slider trên màn hình của bạn để quan sát sự thay đổi trực quan của đồ thị chu kỳ hoặc vân sáng tối live nhé!`;
  }

  return `${response}${currentStatsInfo}`;
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.post(["/api/chat", "/chat"], async (req, res) => {
  try {
    const { message, history, screenState } = req.body;
    
    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Message parameter is required and must be a string." });
      return;
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Prevent buffering by reverse proxies (Nginx, Vercel, Cloud Run, etc.)
    res.flushHeaders(); // Establish connection immediately

    // Helper function to stream plain text for fallbacks and errors with typed effect
    const streamFallbackText = async (text: string) => {
      if (res.writableEnded || res.destroyed) return;
      const words = text.split(" ");
      let currentChunk = "";
      for (let i = 0; i < words.length; i++) {
        if (res.writableEnded || res.destroyed) return;
        currentChunk += (i === 0 ? "" : " ") + words[i];
        if (currentChunk.length > 20 || i === words.length - 1) {
          try {
            res.write(`data: ${JSON.stringify({ text: currentChunk })}\n\n`);
          } catch (e) {
            console.warn("Write failed during fallback stream:", e);
            return;
          }
          currentChunk = "";
          await new Promise((resolve) => setTimeout(resolve, 15)); // fast simulated typing
        }
      }
      if (!res.writableEnded && !res.destroyed) {
        try {
          res.write("data: [DONE]\n\n");
          res.end();
        } catch (e) {
          console.warn("End failed during fallback stream:", e);
        }
      }
    };

    let ai;
    try {
      ai = getGeminiClient();
    } catch (keyError: any) {
      const fallbackText = getLocalBackupResponse(message, screenState);
      await streamFallbackText(fallbackText);
      return;
    }

    let stateContext = "";
    if (screenState) {
      const { activeExperiment, params } = screenState;
      stateContext = `\n--- TRẠNG THÁI MÀN HÌNH PHÒNG THÍ NGHIỆM VẬT LÝ HIỆN TẠI CỦA HỌC SINH ---\n`;
      if (activeExperiment === "pendulum" && params) {
        stateContext += `Bài học đang mở: Con lắc đơn (Simple Pendulum)
Số liệu hiện tại trên slider/màn hình của học sinh:
- Chiều dài dây treo (L): ${params.length} mét (m)
- Gia tốc trọng trường (g): ${params.gravity} m/s² (ví dụ: Trái Đất là 9.8, Mặt Trăng là 1.62, Sao Mộc là 24.79)
- Khối lượng vật nặng (m): ${params.mass} kilôgam (kg)
- Hệ số lực cản môi trường (b): ${params.damping}
- Góc lệch ban đầu cực đại (theta_0): ${params.initialAngle} độ (°)

Tính toán lý thuyết tương ứng:
* Tần số góc omega = √(g/L) ≈ ${Math.sqrt(params.gravity / params.length).toFixed(4)} rad/s
* Chu kỳ dao động riêng T = 2π * √(L/g) ≈ ${(2 * Math.PI * Math.sqrt(params.length / params.gravity)).toFixed(4)} giây (s)
* Tần số f = 1/T ≈ ${(1 / (2 * Math.PI * Math.sqrt(params.length / params.gravity))).toFixed(4)} Hz`;
      } else if (activeExperiment === "spring" && params) {
        stateContext += `Bài học đang mở: Con lắc lò xo treo thẳng đứng (Spring-Mass System)
Số liệu hiện tại trên slider/màn hình của học sinh:
- Độ cứng của lò xo (k): ${params.k} N/m
- Khối lượng vật nặng (m): ${params.mass} kg
- Biên độ kéo lệch ban đầu / Ly độ ban đầu (x0): ${params.initialX} cm
- Hệ số lực cản/ma sát: ${params.damping}

Tính toán lý thuyết tương ứng:
* Tần số góc omega = √(k/m) ≈ ${Math.sqrt(params.k / params.mass).toFixed(4)} rad/s
* Chu kỳ dao động riêng T = 2π * √(m/k) ≈ ${(2 * Math.PI * Math.sqrt(params.mass / params.k)).toFixed(4)} giây (s)
* Độ dãn của lò xo ở vị trí cân bằng Δl = (m * g) / k = ${(params.mass * 9.8 / params.k * 100).toFixed(2)} cm (với g = 9.8 m/s²)`;
      } else if (activeExperiment === "wave" && params) {
        stateContext += `Bài học đang mở: Hiện tượng truyền sóng & Giao thoa sóng cơ học 2 chiều trên mặt nước (Waves)
Số liệu hiện tại trên slider/màn hình của học sinh:
- Tần số nguồn phát (f): ${params.frequency} Hz (chu kỳ dao động T = ${(1 / params.frequency).toFixed(4)} s)
- Tốc độ truyền sóng (v): ${params.speed} milimét trên giây (mm/s)
- Biên độ nguồn (A): ${params.amplitude} mm
- Hệ số hấp thụ/cản sóng của môi trường: ${params.damping}

Tính toán lý thuyết tương ứng:
* Bước sóng λ = v / f = ${(params.speed / params.frequency).toFixed(2)} mm. Khoảng cách giữa hai ngọn sóng liên tiếp là ${ (params.speed / params.frequency).toFixed(2) } mm.`;
      } else if (activeExperiment === "light" && params) {
        stateContext += `Bài học đang mở: Thí nghiệm Giao thoa ánh sáng khe Young (Light Interference)
Số liệu hiện tại trên slider/màn hình của học sinh:
- Khoảng cách giữa hai khe hẹp (a): ${params.a} mm
- Khoảng cách từ mặt phẳng chứa hai khe đến màn quan sát (D): ${params.D} mét (m)
- Bước sóng của nguồn sáng đơn sắc phát ra (λ): ${params.lambda1} nanômét (nm) (bằng ${params.lambda1 * 1e-3} µm)

Tính toán lý thuyết tương ứng:
* Khoảng vân i = (λ * D) / a = ${((params.lambda1 * 1e-6 * params.D * 1000) / params.a).toFixed(4)} mm.
* Có nghĩa là khoảng cách giữa 2 vân sáng kề nhau trên màn đúng bằng ${((params.lambda1 * 1e-6 * params.D * 1000) / params.a).toFixed(4)} mm.
* Vân sáng bậc k nằm tại x = k * i. Vân tối thứ k nằm tại x = (k - 0.5) * i.`;
      }
      stateContext += `\nLưu ý: Bạn hãy chủ động nhắc đến những con số cụ thể này khi học sinh hỏi những câu hỏi có tính chất chung chung hoặc khi muốn hướng dẫn họ thực hành trực tiếp ngay trên màn hình!\n---------------------------------------------------------------\n`;
    }

    const systemInstruction = `You are "UrLab Tutor" - a world-class AI Physics Expert and an encouraging, highly focused Tutor.
You assist students with high school physics (Dao động cơ & Sóng cơ, giao thoa ánh sáng - SGK Vật lý 11 Kết nối tri thức) and advanced levels.

CRITICAL INSTRUCTIONS FOR MAXIMUM SPEED, CLARITY AND COHERENCE:
1. NO PREAMBLE: Start explaining immediately! Do NOT include greetings, intro phrases like "Dưới đây là lời giải chi tiết cho câu hỏi của bạn:", or general pleasantries. Go straight to the physical concepts.
2. NO POSTAMBLE: Do NOT include conclusion sentences or generic outro lines like "Hy vọng câu trả lời này giúp ích cho bạn!".
3. STRUCTURE & BREVITY: Keep your answer compact, scannable, and extremely clear. Use bold bullet points and numbered steps. Limit the output to 1-3 short, dense paragraphs or a few key points.
4. INTEGRATE SCREEN STATE: Proactively connect physical concepts with the student's live measurements/parameters in UrLab (L, g, m, k, f, v, a, D, lambda) to show how altering sliders impacts the phenomenon.

FORMULA FORMATTING:
- ALWAYS write mathematical expressions, equations, formulas, and physical units in standard LaTeX/KaTeX notation:
  * Use DOUBLE dollar signs $$ ... $$ on a separate line for block equations/formulas (on their own line).
  * Use SINGLE dollar sign $ ... $ for inline equations/formulas within a sentence.
- CRITICAL: DO NOT use \\[ ... \\] or \\( ... \\) for formulas, as it may cause escape-character parsing issues in client-side JSON parsing. Always use single $ for inline math and double $$ for block math.
- CRITICAL: NEVER wrap LaTeX formulas inside markdown code blocks (e.g., do NOT use \`\`\`latex ... \`\`\` or \`\`\`katex ... \`\`\`). Simply write the $ or $$ directly in the text body.
- Ensure all physical quantities, variables, operations, and units are formatted in proper LaTeX (e.g., $T = 2\\pi\\sqrt{\\frac{\\ell}{g}}$, $i = \\frac{\\lambda D}{a}$, $\\lambda = \\frac{v}{f}$, $x(t) = A\\cos(\\omega t + \\varphi)$, or units like $\\text{rad/s}$, $\\text{Hz}$, $\\text{m/s}^2$).
- Avoid raw Unicode math characters or plaintext fractions where LaTeX is more elegant, as the interface will render KaTeX beautifully.

LANGUAGE:
- Respond in natural, clear academic Vietnamese (or English if queried in English). Always be polite, precise, and scientifically accurate.

${stateContext}`;

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

    let responseStream;
    let attempt = 0;
    const maxRetries = 6;
    const initialDelayMs = 1000;
    let currentModel = "gemini-3.5-flash";

    try {
      while (true) {
        try {
          attempt++;
          // Configure ThinkingLevel.MINIMAL for gemini-3 series models to completely disable reasoning delay and stream instantly.
          const modelConfig: any = {
            systemInstruction: systemInstruction,
            temperature: 0.5,
            maxOutputTokens: 1200,
          };
          if (currentModel.startsWith("gemini-3")) {
            modelConfig.thinkingConfig = {
              thinkingLevel: ThinkingLevel.MINIMAL
            };
          }

          responseStream = await ai.models.generateContentStream({
            model: currentModel,
            contents: formattedContents,
            config: modelConfig
          });
          break;
        } catch (error: any) {
          const errorStr = `${error.status} ${error.statusCode} ${error.message} ${JSON.stringify(error)}`.toLowerCase();
          
          // Bidirectional model fallback for maximum uptime compatibility
          const isModelUnavailable = 
            errorStr.includes("no longer available") ||
            errorStr.includes("not found") ||
            errorStr.includes("not_found") ||
            errorStr.includes("not supported") ||
            errorStr.includes("not_supported") ||
            errorStr.includes("invalid") ||
            errorStr.includes("unavailable");

          if (isModelUnavailable) {
            if (currentModel === "gemini-3.5-flash") {
              console.warn(`[Backward Compatibility Alert] Model "${currentModel}" failed. Falling back to "gemini-2.5-flash"...`);
              currentModel = "gemini-2.5-flash";
              attempt = 0; // Reset attempts to start fresh with the fallback model
              continue;
            } else if (currentModel === "gemini-2.5-flash") {
              console.warn(`[Backward Compatibility Alert] Model "${currentModel}" failed. Falling back to "gemini-3.5-flash"...`);
              currentModel = "gemini-3.5-flash";
              attempt = 0; // Reset attempts to start fresh with the fallback model
              continue;
            }
          }

          const isTransient = 
            error.status === 503 || 
            error.statusCode === 503 || 
            error.status === 429 || 
            error.statusCode === 429 ||
            errorStr.includes("503") ||
            errorStr.includes("429") ||
            errorStr.includes("overloaded") ||
            errorStr.includes("service unavailable") ||
            errorStr.includes("high demand") ||
            errorStr.includes("temporary") ||
            errorStr.includes("unavailable") ||
            errorStr.includes("resource_exhausted") ||
            errorStr.includes("resource exhausted") ||
            errorStr.includes("rate limit") ||
            errorStr.includes("rate_limit");

          if (isTransient && attempt < maxRetries) {
            const delay = initialDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500;
            console.warn(`[Gemini API Stream] Attempt ${attempt} with ${currentModel} failed with transient error. Retrying in ${delay.toFixed(0)}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          throw error;
        }
      }

      for await (const chunk of responseStream) {
        if (res.writableEnded || res.destroyed) break;
        const text = chunk.text;
        if (text) {
          try {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          } catch (e) {
            console.warn("Write stream chunk aborted:", e);
            break;
          }
        }
      }

      if (!res.writableEnded && !res.destroyed) {
        try {
          res.write("data: [DONE]\n\n");
          res.end();
        } catch (e) {
          console.warn("End stream failed:", e);
        }
      }
    } catch (streamError: any) {
      console.error("Gemini Streaming Error:", streamError);
      const friendlyError = getFriendlyErrorMessage(streamError.message || "");
      await streamFallbackText(`⚠️ **Lỗi kết nối hoặc phản hồi từ Google Gemini AI:**\n\n${friendlyError}`);
    }
  } catch (err: any) {
    console.error("Express handler error in /api/tutor:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

app.post(["/api/quiz", "/quiz"], async (req, res) => {
  const { topic } = req.body;
  const topicId = topic || "pendulum";

  const mockQuizQuestions: Record<string, Array<{ question: string, options: string[], correctAnswer: number, explanation: string }>> = {
    pendulum: [
      {
        question: "Một học sinh thực hiện thí nghiệm với con lắc đơn có chiều dài ℓ. Nếu học sinh đó di chuyển thí nghiệm từ Trái Đất (g = 9.8 m/s²) lên Mặt Trăng (g_m = 1.62 m/s²) thì chu kỳ dao động T của con lắc sẽ biến đổi thế nào?",
        options: [
          "Chu kỳ T sẽ tăng lên đáng kể vì gia tốc g giảm.",
          "Chu kỳ T sẽ giảm đi vì trọng lực yếu hơn.",
          "Chu kỳ T giữ nguyên vì chiều dài ℓ không đổi.",
          "Chu kỳ T sẽ bằng 0 vì trên Mặt Trăng không có khí quyển."
        ],
        correctAnswer: 0,
        explanation: "Chu kỳ con lắc đơn được xác định bởi công thức T = 2π·√(ℓ/g). Do gia tốc trọng trường g ở Mặt Trăng nhỏ hơn g ở Trái Đất, mẫu số g giảm làm cho giá trị phân số ℓ/g tăng lên, dẫn đến chu kỳ T tăng lên. Lúc này con lắc sẽ dao động chậm hơn!"
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
      },
      {
        question: "Trong dao động điều hòa của con lắc đơn tại một nơi cố định, nếu tăng chiều dài dây treo ℓ lên gấp 4 lần thì chu kỳ dao động riêng T thay đổi thế nào?",
        options: [
          "Chu kỳ T tăng lên gấp 4 lần.",
          "Chu kỳ T giảm đi 2 lần.",
          "Chu kỳ T tăng lên gấp 2 lần.",
          "Chu kỳ T không thay đổi."
        ],
        correctAnswer: 2,
        explanation: "Theo công thức chu kỳ con lắc đơn T = 2π·√(ℓ/g), chu kỳ T tỉ lệ thuận với căn bậc hai của chiều dài ℓ. Khi ℓ tăng lên 4 lần, √(ℓ) tăng lên 2 lần, làm chu kỳ T tăng gấp 2 lần."
      },
      {
        question: "Chu kỳ dao động điều hòa của con lắc đơn phụ thuộc vào yếu tố nào sau đây?",
        options: [
          "Khối lượng m của quả nặng.",
          "Biên độ dao động và góc lệch ban đầu cực đại.",
          "Chiều dài dây treo ℓ và gia tốc trọng trường g tại nơi treo.",
          "Độ cứng của dây treo."
        ],
        correctAnswer: 2,
        explanation: "Chu kỳ con lắc đơn dao động điều hòa nhỏ (góc lệch bé) chỉ phụ thuộc vào đặc tính hình học là chiều dài dây ℓ và gia tốc trọng trường g tại nơi làm thí nghiệm: T = 2π·√(ℓ/g). Nó không phụ thuộc vào khối lượng m hay biên độ."
      },
      {
        question: "Một con lắc đơn dao động điều hòa tại nơi có gia tốc g = 9.8 m/s² với dây treo dài ℓ = 1.0 m. Chu kỳ dao động T xấp xỉ bằng bao nhiêu?",
        options: [
          "T ≈ 1.0 giây.",
          "T ≈ 2.0 giây.",
          "T ≈ 3.14 giây.",
          "T ≈ 6.28 giây."
        ],
        correctAnswer: 1,
        explanation: "Áp dụng công thức T = 2π·√(ℓ/g) = 2 · 3.1416 · √(1 / 9.8) ≈ 2.0 giây. Đây được gọi là con lắc giây (có chu kỳ xấp xỉ 2 giây, tức mỗi giây thực hiện nửa chu kỳ)."
      }
    ],
    spring: [
      {
        question: "Một con lắc lò xo gồm vật nặng m và lò xo có độ cứng k đang dao động điều hòa. Nếu ta thay vật nặng bằng một vật khác có khối lượng lớn gấp 4 lần thì chu kỳ dao động riêng T của con lắc sẽ thay đổi như thế nào?",
        options: [
          "Tăng lên 2 lần.",
          "Giảm đi 2 lần.",
          "Tăng lên 4 lần.",
          "Giảm đi 4 lần."
        ],
        correctAnswer: 0,
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
        explanation: "Cơ năng của một con lắc lò xo dao động điều hòa bằng tổng động năng và thế năng tại mọi thời điểm, tỉ lệ thuận với bình phương biên độ dao động: W = 1/2 · k · A²."
      },
      {
        question: "Khi vật nặng của con lắc lò xo đi qua vị trí cân bằng thì đại lượng nào sau đây đạt giá trị cực đại?",
        options: [
          "Thế năng của con lắc.",
          "Động năng của con lắc.",
          "Lực kéo về tác dụng lên vật.",
          "Gia tốc của vật."
        ],
        correctAnswer: 1,
        explanation: "Tại vị trí cân bằng, vật có li độ x = 0 nên thế năng bằng 0, tốc độ của vật đạt cực đại v = ω·A, do đó động năng của vật đạt cực đại."
      }
    ],
    wave: [
      {
        question: "Trong hiện tượng giao thoa sóng nước với hai nguồn dao động cùng pha, những điểm nằm trên đường trung trực của đoạn thẳng nối hai nguồn sẽ như thế nào?",
        options: [
          "Là những điểm dao động với biên độ cực tiểu.",
          "Là những điểm dao động với biên độ cực đại.",
          "Là những điểm đứng yên không dao động.",
          "Là những điểm dao động ngược pha với hai nguồn."
        ],
        correctAnswer: 1,
        explanation: "Trong giao thoa sóng nước với hai nguồn cùng pha, hiệu đường truyền từ hai nguồn tới một điểm trên đường trung trực bằng 0 (d2 - d1 = 0), là một số nguyên lần bước sóng. Do đó, hai sóng từ hai nguồn truyền tới luôn cùng pha và hỗ trợ tăng cường lẫn nhau, tạo thành các cực đại giao thoa."
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
      },
      {
        question: "Hai nguồn sóng cơ học thế nào được gọi là hai nguồn kết hợp có khả năng tạo ra hiện tượng giao thoa ổn định?",
        options: [
          "Dao động cùng biên độ và cùng tốc độ truyền sóng.",
          "Dao động cùng tần số, cùng phương và có hiệu số pha không đổi theo thời gian.",
          "Được đặt rất gần nhau trên cùng một phương truyền.",
          "Dao động hoàn toàn ngược pha nhau tại mọi thời điểm."
        ],
        correctAnswer: 1,
        explanation: "Định nghĩa hai nguồn kết hợp là hai nguồn dao động cùng phương, cùng tần số (hoặc cùng chu kỳ) và có hiệu số pha không thay đổi theo thời gian. Chỉ các nguồn kết hợp mới tạo ra hệ vân giao thoa ổn định."
      },
      {
        question: "Trong thí nghiệm giao thoa sóng nước với hai nguồn cùng pha, những điểm có hiệu đường truyền d2 - d1 = (k + 0.5)·λ (với k là số nguyên) sẽ dao động thế nào?",
        options: [
          "Dao động với biên độ cực đại.",
          "Dao động với biên độ cực tiểu (triệt tiêu hoặc đứng yên).",
          "Dao động cùng pha với hai nguồn sóng.",
          "Dao động lệch pha 90 độ so với nguồn."
        ],
        correctAnswer: 1,
        explanation: "Khi hiệu đường truyền bằng một số bán nguyên lần bước sóng, hai sóng truyền tới điểm đó dao động ngược pha và triệt tiêu lẫn nhau, tạo thành cực tiểu giao thoa."
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
        explanation: "Tại tâm màn quan sát, hiệu đường đi từ hai khe S1 S2 bằng 0 (d2 - d1 = 0). Do đó, hai sóng từ hai nguồn kết hợp luôn đồng pha và giao thoa tạo nên vân sáng trung tâm bậc 0."
      },
      {
        question: "Trong thí nghiệm giao thoa ánh sáng khe Young, đo được khoảng cách giữa 5 vân sáng liên tiếp trên màn quan sát là L. Khoảng vân i được tính như thế nào?",
        options: [
          "i = L / 5",
          "i = L / 4",
          "i = L / 6",
          "i = L"
        ],
        correctAnswer: 1,
        explanation: "Giữa 5 vân sáng liên tiếp có đúng 4 khoảng vân i. Vì vậy, khoảng cách giữa chúng là L = 4i, suy ra khoảng vân i = L / 4."
      },
      {
        question: "Khoảng vân giao thoa i của thí nghiệm khe Young tăng lên khi ta thực hiện điều chỉnh nào sau đây?",
        options: [
          "Giảm khoảng cách từ hai khe đến màn D.",
          "Tăng khoảng cách giữa hai khe hẹp a.",
          "Sử dụng ánh sáng có bước sóng λ lớn hơn.",
          "Di chuyển nguồn sáng ra xa hai khe."
        ],
        correctAnswer: 2,
        explanation: "Công thức khoảng vân là i = λ·D / a. Khoảng vân i tỉ lệ thuận với bước sóng λ, tỉ lệ thuận với D và tỉ lệ nghịch với a. Vì thế, dùng bước sóng λ lớn hơn sẽ làm tăng khoảng vân i."
      },
      {
        question: "Trong thí nghiệm giao thoa khe Young, nếu ta dịch chuyển màn quan sát ra xa hai khe thêm một đoạn thì hệ vân giao thoa trên màn sẽ như thế nào?",
        options: [
          "Co lại gần nhau hơn.",
          "Dãn rộng ra xa nhau hơn.",
          "Không thay đổi.",
          "Mờ dần và biến mất hẳn."
        ],
        correctAnswer: 1,
        explanation: "Khi đưa màn ra xa hai khe, khoảng cách D tăng lên. Vì khoảng vân i = λ·D/a tỉ lệ thuận với D, nên D tăng làm khoảng vân i tăng, hệ vân giao thoa sẽ dãn rộng ra xa nhau hơn."
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
          parts: [{ text: `Tạo một câu hỏi trắc nghiệm vật lý 11 có đúng 4 lựa chọn (A, B, C, D) về chủ đề: "${topicName}". Hãy xuất ra định dạng JSON khớp hoàn toàn với schema yêu cầu. Câu hỏi cần mang tính giáo dục cao, kiểm tra hiểu biết định tính hoặc tính toán đơn giản, viết bằng tiếng Việt tự nhiên và thân thiện. Chú ý: Toàn bộ công thức vật lý, ký hiệu, đơn vị đo lường phải được viết dưới dạng mã LaTeX (sử dụng một cặp dấu đô-la lẻ $...$ cho inline math, tuyệt đối không dùng ký hiệu unicode thông thường hay dấu ngoặc vuông/tròn phức tạp).` }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            question: { 
              type: "STRING",
              description: "Câu hỏi trắc nghiệm ngắn gọn, rõ ràng bằng tiếng Việt. Tất cả các ký hiệu, công thức, đơn vị phải được đặt trong dấu đô la đơn $...$, ví dụ: $T = 2\\pi\\sqrt{\\frac{\\ell}{g}}$."
            },
            options: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Mảng gồm đúng 4 câu trả lời lựa chọn (độ dài đúng bằng 4). Sử dụng $...$ cho bất kỳ ký hiệu, số lượng hoặc công thức nào."
            },
            correctAnswer: {
              type: "INTEGER",
              description: "Số nguyên từ 0 đến 3 tương ứng với vị trí câu trả lời đúng trong mảng options"
            },
            explanation: { 
              type: "STRING", 
              description: "Giải thích ngắn gọn, súc tích và dễ hiểu bằng tiếng Việt tại sao phương án đó là đúng. Tất cả công thức và ký hiệu toán học/vật lý phải được bọc trong dấu đô-la đơn $...$."
            }
          },
          required: ["question", "options", "correctAnswer", "explanation"]
        },
        temperature: 0.7,
      }
    });

    if (response.text) {
      const parsedQuiz = JSON.parse(response.text.trim());
      res.json(parsedQuiz);
    } else {
      throw new Error("Empty response from Gemini quiz generator");
    }
  } catch (error: any) {
    const errMsg = error.message || "";
    if (errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota") || errMsg.includes("429")) {
      console.warn("Gemini Quiz Quota Exceeded (Handled gracefully with fallback):", errMsg);
    } else {
      console.error("Gemini Quiz API Error:", error);
    }
    const questions = mockQuizQuestions[topicId] || mockQuizQuestions.pendulum;
    const randomIndex = Math.floor(Math.random() * questions.length);
    res.json({ ...questions[randomIndex], mock: true });
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
