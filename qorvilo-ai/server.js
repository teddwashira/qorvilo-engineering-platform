
require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    application: "QORVILO AI",
    status: "operational",
    version: "0.1.0"
  });
});

// Gemini AI endpoint
app.post("/api/chat", async (req, res) => {
  try {
   const { message, financialData, history } = req.body;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Please enter a message."
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        error: "Your message is too long."
      });
    }

    const prompt = `
You are QORVILO, a helpful personal finance AI.
Use the financial data supplied below to answer the user's question.
Do not invent transactions, balances, or financial facts.
If information is missing, say so.
Give clear, practical explanations.
Do not request passwords, PINs, or banking credentials.

Financial data:
${JSON.stringify(financialData || {}, null, 2)}

Previous conversation:
${JSON.stringify(Array.isArray(history) ? history.slice(-10) : [], null, 2)}

Current user question:
${message}
`;

  let response;
let attempts = 0;

while (attempts < 3) {
  try {
    response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt
    });

    break;
  } catch (error) {
    attempts++;

    if (attempts >= 3 || !error.message.includes("503")) {
      throw error;
    }

    console.log(`Gemini busy. Retry ${attempts}/3...`);

    await new Promise(resolve =>
      setTimeout(resolve, attempts * 2000)
    );
  }
}  

    res.json({
      success: true,
      reply: response.text
    });

  } catch (error) {
    console.error("Gemini error:", error.message);

    res.status(500).json({
      success: false,
      error: "QORVILO AI could not process your request. Please try again."
    });
  }
});

app.listen(PORT, () => {
  console.log("--------------------------------");
  console.log("       QORVILO AI SERVER");
  console.log("--------------------------------");
  console.log(`Server running at http://localhost:${PORT}`);
  console.log("Status: Operational");
});
