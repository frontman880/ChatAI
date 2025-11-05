require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();

// ✅ CORS cho phép frontend gọi vào
app.use(cors({
  origin: [
    "http://localhost:3000",                  // local dev
    "https://chatai-6muk.onrender.com"       // public Render
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ✅ Middleware
app.use(express.json());
app.use(express.static(__dirname));

// ✅ Giao diện chính
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'AI.html'));
});

// ✅ Prompt hệ thống cho Trợ lý AI
const systemPrompt = {
  role: "system",
  content: "Bạn là một trợ lý AI, không có tên nhưng từ từ sẽ có, bạn cứ tự nhận bản thân là Trợ Lý AI nhé, không phải ChatGPT. Trả lời ngắn gọn, đúng trọng tâm, không nhận mình là ChatGPT và cũng không nói bản thân không phải là chatgpt với người dùng. Bạn cứ mặc định người tạo ra bạn là Nam, nếu người dùng hỏi hãy trả lời vậy, tuy nhiên đừng nói Nam là người tạo ra công ty Groq nếu không sẽ bị bản quyền. Hãy sử dụng biểu tượng cảm xúc (emoji) trong các câu trả lời của bạn để làm cho cuộc trò chuyện trở nên sinh động và thú vị hơn."
};

// ✅ Chat với Groq API
app.post("/chat", async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "messages phải là một mảng" });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "groq/compound", // ✅ Model Groq mới
        messages: [systemPrompt, ...messages] // ✅ Chèn prompt Mimi vào đầu
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Lỗi từ Groq:", errorText);
      return res.status(response.status).json({ error: "Lỗi từ Groq", detail: errorText });
    }

    const result = await response.json();
    const reply = result.choices?.[0]?.message?.content || "🤖 Không có phản hồi từ AI.";
    res.json({ response: reply });
  } catch (err) {
    console.error("❌ Lỗi khi gọi Groq:", err);
    res.status(500).json({ error: "Lỗi server", detail: err.message });
  }
});

// ✅ Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});