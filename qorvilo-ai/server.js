
require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;
// Protect the AI endpoint from excessive requests
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. Please try again in 15 minutes."
  }
});

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
app.post("/api/chat", chatLimiter, async (req, res) => {
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

// Independently validate financial data on the server
const rawTransactions = Array.isArray(financialData?.transactions)
  ? financialData.transactions
  : [];

if (rawTransactions.length > 500) {
  return res.status(400).json({
    success: false,
    error: "Too many transactions supplied."
  });
}

const safeTransactions = rawTransactions
  .filter(item => {
    if (!item || typeof item !== "object") return false;

    const amount = Number(item.amount);

    return (
      ["income", "expense"].includes(item.type) &&
      Number.isFinite(amount) &&
      amount >= 0
    );
  })
  .map(item => ({
    description: String(item.description || "Unspecified transaction").slice(0, 200),
    category: String(item.category || "Uncategorized").slice(0, 100),
    type: item.type,
    amount: Number(item.amount),
    date: String(item.date || "").slice(0, 30)
  }));

// Recalculate totals rather than trusting browser-supplied totals
const safeIncome = safeTransactions
  .filter(item => item.type === "income")
  .reduce((total, item) => total + item.amount, 0);

const safeExpenses = safeTransactions
  .filter(item => item.type === "expense")
  .reduce((total, item) => total + item.amount, 0);

const safeFinancialData = {
  currency: "KES",
  totalIncome: safeIncome,
  totalExpenses: safeExpenses,
  netBalance: safeIncome - safeExpenses,
  transactionCount: safeTransactions.length,
  excludedTransactionCount: rawTransactions.length - safeTransactions.length,
  transactions: safeTransactions
};

// Accept only properly structured conversation history
const safeHistory = Array.isArray(history)
  ? history
      .filter(item =>
        item &&
        ["user", "assistant"].includes(item.role) &&
        typeof item.text === "string"
      )
      .slice(-10)
      .map(item => ({
        role: item.role,
        text: item.text.slice(0, 2000)
      }))
  : [];


    const prompt = `
You are QORVILO, a helpful personal finance AI.
Use the financial data supplied below to answer the user's question.
Do not invent transactions, balances, or financial facts.
If information is missing, say so.
Give clear, practical explanations.
Do not request passwords, PINs, or banking credentials.

Financial data:
${JSON.stringify(safeFinancialData, null, 2)}

Previous conversation:
${JSON.stringify(safeHistory, null, 2)}

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
