
// =====================================
// QORVILO AI — DASHBOARD ENGINE
// Version 0.1.0
// =====================================

// 1. GET IMPORTANT HTML ELEMENTS

const themeButton = document.getElementById("theme-toggle");
const addTransactionButton = document.getElementById("add-transaction");

const balanceElement = document.getElementById("total-balance");
const incomeElement = document.getElementById("total-income");
const expensesElement = document.getElementById("total-expenses");
const savingsElement = document.getElementById("savings-rate");

const transactionList = document.getElementById("transaction-list");

// 2. LOAD SAVED TRANSACTIONS

let transactions = JSON.parse(
  localStorage.getItem("qorvilo-transactions") || "[]"
);
let selectedForecastAlgorithm = "SMA";
let knownAnomalyIds = new Set();
let dismissedAnomalyIds = new Set(
  JSON.parse(
    localStorage.getItem("qorvilo-dismissed-anomalies") || "[]"
  )
);

// Rest of your QORVILO JavaScript follows...
// 3. FORMAT MONEY IN KENYAN SHILLINGS

function formatMoney(amount) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0
  }).format(amount);
}

// 4. SAVE TRANSACTIONS

function saveTransactions() {
  localStorage.setItem(
    "qorvilo-transactions",
    JSON.stringify(transactions)
  );

  const anomalies = analyzeFinancialAnomalies();

  const newHighPriority = anomalies.filter(item =>
    item.severity === "high" &&
    !knownAnomalyIds.has(item.id)
  );

  newHighPriority.forEach(showAnomalyToast);

  knownAnomalyIds = new Set(
    anomalies.map(item => item.id)
  );

  renderAnomalies();
}

// 5. CALCULATE FINANCIAL TOTALS

function updateDashboard() {
  const income = transactions
    .filter(item => item.type === "income")
    .reduce((total, item) => total + item.amount, 0);

  const expenses = transactions
    .filter(item => item.type === "expense")
    .reduce((total, item) => total + item.amount, 0);

  const balance = income - expenses;

  const savingsRate = income > 0
    ? ((balance / income) * 100)
    : 0;

  balanceElement.textContent = formatMoney(balance);
  incomeElement.textContent = formatMoney(income);
  expensesElement.textContent = formatMoney(expenses);
  savingsElement.textContent = savingsRate.toFixed(1) + "%";

  renderTransactions();
  renderChart();
  renderInsights();
}

/* =====================================
   QORVILO AI CHAT ENGINE
   Version 0.1.0
===================================== */

const assistantNav = document.getElementById("assistant-nav");
const assistantView = document.getElementById("assistant");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");
// QORVILO CONVERSATION MEMORY
const chatHistory = [];

// OPEN AI ASSISTANT
if (assistantNav && assistantView) {
  assistantNav.addEventListener("click", (event) => {
    event.preventDefault();

    assistantView.classList.add("active");

    document.querySelectorAll(".nav-link").forEach(link => {
      link.classList.remove("active");
    });

    assistantNav.classList.add("active");

    assistantView.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}

// DISPLAY CHAT MESSAGE
function addChatMessage(message, sender) {
  const messageContainer = document.createElement("div");
  messageContainer.className =
    sender === "user"
      ? "chat-message user-message"
      : "chat-message assistant-message";

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";

  const name = document.createElement("strong");
  name.textContent = sender === "user" ? "YOU" : "QORVILO AI";

  const text = document.createElement("p");
  text.textContent = message;

  bubble.append(name, text);

  if (sender === "assistant") {
    const avatar = document.createElement("div");
    avatar.className = "chat-avatar";
    avatar.textContent = "Q";
    messageContainer.appendChild(avatar);
  }

  messageContainer.appendChild(bubble);
  chatMessages.appendChild(messageContainer);

  chatMessages.scrollTop = chatMessages.scrollHeight;
  return messageContainer;
}

/* =====================================
   QORVILO GEMINI CHAT CONNECTION
===================================== */

if (chatForm && chatInput && chatMessages) {
  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const question = chatInput.value.trim();

    if (!question) return;

    addChatMessage(question, "user");

// Save the user's message in conversation memory
chatHistory.push({
  role: "user",
  text: question
});

chatInput.value = "";

    const loadingMessage = addChatMessage(
      "Thinking... Please wait.",
      "assistant"
    );

    const income = transactions
      .filter(item => item.type === "income")
      .reduce((total, item) => total + Number(item.amount || 0), 0);

    const expenses = transactions
      .filter(item => item.type === "expense")
      .reduce((total, item) => total + Number(item.amount || 0), 0);

    const financialData = {
      currency: "KES",
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: income - expenses,
      transactions: transactions.map(item => ({
        description: item.description,
        category: item.category,
        type: item.type,
        amount: Number(item.amount),
        date: item.date
      }))
    };

    const sendButton = chatForm.querySelector("button");
    sendButton.disabled = true;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
  message: question,
  financialData,
history: chatHistory.slice(-10, -1)
})
      });

      const result = await response.json();

      loadingMessage.remove();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "AI request failed.");
      }

      addChatMessage(result.reply, "assistant");
      // Save QORVILO's response in conversation memory
chatHistory.push({
  role: "assistant",
  text: result.reply
});

    } catch (error) {
      loadingMessage.remove();

      console.error("QORVILO chat error:", error);

      addChatMessage(
        "I'm having trouble connecting to Gemini right now. Please check your server and try again.",
        "assistant"
      );
    } finally {
      sendButton.disabled = false;
      chatInput.focus();
    }
  });
}

console.log("QORVILO Gemini connection loaded.");

// 6. DISPLAY TRANSACTIONS


function renderTransactions() {
  transactionList.innerHTML = "";

  if (transactions.length === 0) {
    transactionList.innerHTML = `
      <div class="empty-state">
        <span>◈</span>
        <h4>No transactions yet</h4>
        <p>Add your first transaction to get started.</p>
      </div>
    `;
    return;
  }

  transactions.slice().reverse().forEach(transaction => {
    const item = document.createElement("div");

    item.style.display = "flex";
    item.style.justifyContent = "space-between";
    item.style.alignItems = "center";
    item.style.gap = "12px";
    item.style.padding = "15px 5px";
    item.style.borderBottom = "1px solid var(--border)";

    const details = document.createElement("div");

    const description = document.createElement("strong");
    description.textContent = transaction.description;
    description.style.display = "block";

    const category = document.createElement("small");
    category.textContent =
      `${transaction.category || "Other"} · ${transaction.date}`;
    category.style.color = "var(--muted)";

    details.append(description, category);

    const rightSide = document.createElement("div");
    rightSide.style.display = "flex";
    rightSide.style.alignItems = "center";
    rightSide.style.gap = "12px";

    const amount = document.createElement("strong");
    amount.textContent =
      `${transaction.type === "income" ? "+" : "-"}${formatMoney(transaction.amount)}`;

    amount.style.color =
      transaction.type === "income"
        ? "var(--green)"
        : "var(--red)";

    
const editButton = document.createElement("button");
editButton.textContent = "Edit";
editButton.dataset.id = transaction.id;
editButton.className = "edit-transaction";
editButton.style.cssText =
  "border:1px solid var(--border);background:var(--surface);color:var(--accent);padding:7px 10px;border-radius:8px;cursor:pointer;";

const deleteButton = document.createElement("button");
deleteButton.textContent = "Delete";
deleteButton.dataset.id = transaction.id;
deleteButton.className = "delete-transaction";
deleteButton.style.cssText =
  "border:1px solid var(--border);background:var(--surface);color:var(--red);padding:7px 10px;border-radius:8px;cursor:pointer;";
rightSide.append(amount, editButton, deleteButton);
    item.append(details, rightSide);
    transactionList.appendChild(item);
  });
}

// EDIT TRANSACTIONS

transactionList.addEventListener("click", (event) => {
  const button = event.target.closest(".edit-transaction");

  if (!button) return;

  const transactionId = button.dataset.id;

  const transaction = transactions.find(
    item => item.id === transactionId
  );

  if (!transaction) return;

  // Fill the existing transaction form
  document.getElementById("transaction-description").value =
    transaction.description;

  document.getElementById("transaction-amount").value =
    transaction.amount;

  document.getElementById("transaction-category").value =
    transaction.category || "Other";

  document.getElementById("transaction-date").value =
    transaction.date;

  transactionForm.querySelector(
    `input[name="type"][value="${transaction.type}"]`
  ).checked = true;

  // Remember which transaction is being edited
  transactionForm.dataset.editingId = transactionId;

  // Open the modal
  transactionModal.classList.add("active");
});

// DELETE TRANSACTIONS

transactionList.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-transaction");

  if (!button) return;

  const transactionId = button.dataset.id;

  const confirmed = confirm(
    "Are you sure you want to delete this transaction?"
  );

  if (!confirmed) return;

  transactions = transactions.filter(
    transaction => transaction.id !== transactionId
  );

  saveTransactions();
  updateDashboard();
});

// 7. ADD A TRANSACTION


// 7. ADD TRANSACTION MODAL

const transactionModal = document.getElementById("transaction-modal");
const transactionForm = document.getElementById("transaction-form");
const closeModalButton = document.getElementById("close-modal");
const cancelTransactionButton = document.getElementById("cancel-transaction");
const transactionDateInput = document.getElementById("transaction-date");

// Open the modal
function openTransactionModal() {
  transactionModal.classList.add("active");
  transactionDateInput.value = new Date().toISOString().split("T")[0];

  document.getElementById("transaction-description").focus();
}

// Close the modal
function closeTransactionModal() {
  transactionModal.classList.remove("active");
  transactionForm.reset();
  delete transactionForm.dataset.editingId;
}

// Open when Add Transaction is clicked
addTransactionButton.addEventListener("click", openTransactionModal);

// Close buttons
closeModalButton.addEventListener("click", closeTransactionModal);
cancelTransactionButton.addEventListener("click", closeTransactionModal);

// Close when clicking outside the modal
transactionModal.addEventListener("click", (event) => {
  if (event.target === transactionModal) {
    closeTransactionModal();
  }
});

// Close with Escape key
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    transactionModal.classList.contains("active")
  ) {
    closeTransactionModal();
  }
});

// Save transaction
transactionForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const description = document
    .getElementById("transaction-description")
    .value.trim();

  const amount = Number(
    document.getElementById("transaction-amount").value
  );

  const category = document.getElementById("transaction-category").value;

  const date = transactionDateInput.value;

  const type = transactionForm.querySelector(
    'input[name="type"]:checked'
  ).value;

  if (!description || !Number.isFinite(amount) || amount <= 0 || !category || !date) {
    alert("Please complete all fields with valid information.");
    return;
  }

 
const editingId = transactionForm.dataset.editingId;

if (editingId) {
  transactions = transactions.map(transaction =>
    transaction.id === editingId
      ? { ...transaction, description, amount, category, type, date }
      : transaction
  );
} else {
  transactions.push({
    id: crypto.randomUUID(),
    description,
    amount,
    category,
    type,
    date
  });
}

  saveTransactions();
  updateDashboard();
  closeTransactionModal();

  alert("Transaction saved successfully!");
});

// =====================================
// QORVILO FINANCIAL CHART ENGINE
// =====================================


function renderChart() {
  const chartBars = document.getElementById("chart-bars");
  const periodSelect = document.getElementById("period-select");

  if (!chartBars) return;

  const numberOfMonths = periodSelect
    ? Number(periodSelect.value) || 6
    : 6;

  const today = new Date();
  const monthlyData = [];

  // Create accurate monthly totals
  for (let i = numberOfMonths - 1; i >= 0; i--) {
    const monthDate = new Date(
      today.getFullYear(),
      today.getMonth() - i,
      1
    );

    const year = monthDate.getFullYear();
    const month = String(monthDate.getMonth() + 1).padStart(2, "0");
    const monthKey = `${year}-${month}`;

    let income = 0;
    let expenses = 0;

    transactions.forEach(transaction => {
      if (!transaction.date) return;

      // Use only the transaction's calendar date
      const transactionDate = transaction.date.slice(0, 7);

      if (transactionDate !== monthKey) return;

      const amount = Number(transaction.amount);

      if (!Number.isFinite(amount) || amount <= 0) return;

      if (transaction.type === "income") {
        income += amount;
      }

      if (transaction.type === "expense") {
        expenses += amount;
      }
    });

    monthlyData.push({
      label: monthDate.toLocaleDateString("en-KE", {
        month: "short"
      }),
      income,
      expenses
    });
  }

  // Find the maximum value for chart scaling
  const maximum = Math.max(
    1,
    ...monthlyData.map(item =>
      Math.max(item.income, item.expenses)
    )
  );

  // Remove previously generated bars
  chartBars.innerHTML = "";

  // Generate each month independently
  monthlyData.forEach(item => {
    const group = document.createElement("div");
    group.className = "bar-group";

    const incomeBar = document.createElement("div");
    incomeBar.className = "bar income-bar";
    incomeBar.style.height =
      item.income > 0
        ? `${(item.income / maximum) * 100}%`
        : "0px";

    const expenseBar = document.createElement("div");
    expenseBar.className = "bar expense-bar";
    expenseBar.style.height =
      item.expenses > 0
        ? `${(item.expenses / maximum) * 100}%`
        : "0px";

    const label = document.createElement("small");
    label.textContent = item.label;

    incomeBar.title = `Income: ${formatMoney(item.income)}`;
    expenseBar.title = `Expenses: ${formatMoney(item.expenses)}`;

    group.append(incomeBar, expenseBar, label);
    chartBars.appendChild(group);
  });

  console.table(monthlyData);
}



// 8. DARK AND LIGHT MODE

function applyTheme(theme) {
  document.body.classList.toggle(
    "light-theme",
    theme === "light"
  );

  themeButton.textContent =
    theme === "light" ? "☾" : "☼";

  localStorage.setItem("qorvilo-theme", theme);
}

const savedTheme =
  localStorage.getItem("qorvilo-theme") || "dark";

applyTheme(savedTheme);

themeButton.addEventListener("click", () => {
  const nextTheme =
    document.body.classList.contains("light-theme")
      ? "dark"
      : "light";

  applyTheme(nextTheme);
});

// 9. INITIALISE DASHBOARD

updateDashboard();

console.log("QORVILO dashboard engine loaded successfully.");

// =====================================
// QORVILO FINANCIAL INTELLIGENCE ENGINE
// Version 0.1.0
// =====================================

function renderInsights() {
  const title = document.getElementById("insight-title");
  const description = document.getElementById("insight-description");
  const incomeDisplay = document.getElementById("insight-income");
  const expensesDisplay = document.getElementById("insight-expenses");
  const savingsDisplay = document.getElementById("insight-savings");
  const recommendation = document.getElementById("insight-recommendation");
  const tag = document.getElementById("insight-tag");

  if (
    !title ||
    !description ||
    !incomeDisplay ||
    !expensesDisplay ||
    !savingsDisplay ||
    !recommendation ||
    !tag
  ) return;

  // Calculate financial totals
  const income = transactions
    .filter(item => item.type === "income")
    .reduce((total, item) => total + Number(item.amount || 0), 0);

  const expenses = transactions
    .filter(item => item.type === "expense")
    .reduce((total, item) => total + Number(item.amount || 0), 0);

  const savings = income - expenses;

  // Update financial metrics
  incomeDisplay.textContent = formatMoney(income);
  expensesDisplay.textContent = formatMoney(expenses);
  savingsDisplay.textContent = formatMoney(savings);

  // Analyse transaction categories
  const categoryTotals = {};

  transactions
    .filter(item => item.type === "expense")
    .forEach(item => {
      const category = item.category || "Other";
      categoryTotals[category] =
        (categoryTotals[category] || 0) + Number(item.amount || 0);
    });

  const highestCategory = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])[0];

  // Generate financial insights
  if (transactions.length === 0) {
    tag.textContent = "AWAITING DATA";
    title.textContent = "Your financial journey starts here";
    description.textContent =
      "Add your income and expenses so QORVILO can begin analysing your financial activity.";

    recommendation.textContent =
      "Your financial insights will appear here once you record your first transaction.";

    return;
  }

  tag.textContent = "LIVE FINANCIAL ANALYSIS";

  if (income === 0 && expenses > 0) {
    title.textContent = "Income data is missing";
    description.textContent =
      `You've recorded ${formatMoney(expenses)} in expenses but no income yet.`;

    recommendation.textContent =
      "Record your income to help QORVILO calculate your savings rate and assess your financial position.";

    return;
  }

  if (expenses > income) {
    title.textContent = "Your expenses exceed your income";
    description.textContent =
      `You have spent ${formatMoney(expenses - income)} more than your recorded income.`;

    recommendation.textContent =
      "Review non-essential spending and check whether all income has been recorded.";

    return;
  }

  if (income === 0 && expenses === 0) {
    title.textContent = "More financial activity needed";
    description.textContent =
      "Your transactions currently have no recorded income or expenses.";

    recommendation.textContent =
      "Add accurate financial records to unlock more useful insights.";

    return;
  }

  const savingsRate = (savings / income) * 100;

  title.textContent = "Your financial overview";

  description.textContent =
    `You've retained ${savingsRate.toFixed(1)}% of your recorded income. ` +
    `Your current net savings are ${formatMoney(savings)}.`;

  if (savingsRate >= 30) {
    recommendation.textContent =
      "Strong savings performance. Consider maintaining this saving habit and setting a clear financial goal.";
  } else if (savingsRate >= 10) {
    recommendation.textContent =
      "You're keeping some of your income. Look for opportunities to reduce unnecessary expenses and increase your savings rate.";
  } else if (savingsRate > 0) {
    recommendation.textContent =
      "Your savings margin is relatively small. Review recurring expenses and identify areas where you could save more.";
  } else {
    recommendation.textContent =
      "Your income and expenses are currently equal. Consider setting aside a small amount before discretionary spending.";
  }

  // Highlight the largest expense category
  if (highestCategory) {
    recommendation.textContent +=
      ` Your largest recorded expense category is ${highestCategory[0]} (${formatMoney(highestCategory[1])}).`;
  }
}

/* =====================================
   QORVILO FINANCIAL FORECASTING ENGINE
   Version 0.1.0
===================================== */

const forecastNav = document.getElementById("forecast-nav");
const forecastView = document.getElementById("forecast");
const refreshForecast = document.getElementById("refresh-forecast");
const anomalyNav = document.getElementById("anomaly-nav");
const anomalyView = document.getElementById("anomalies");

function renderForecast() {
  const incomeDisplay = document.getElementById("forecast-income");
  const expensesDisplay = document.getElementById("forecast-expenses");
  const savingsDisplay = document.getElementById("forecast-savings");
  const description = document.getElementById("forecast-description");
  const confidence = document.getElementById("forecast-confidence");

  if (!incomeDisplay || !expensesDisplay ||
      !savingsDisplay || !description || !confidence) return;

  // Create the last three calendar-month buckets
  const now = new Date();
  const months = [];

  for (let i = 2; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    months.push({
      key,
      income: 0,
      expenses: 0,
      hasTransactions: false
    });
  }

  // Group recorded transactions by month
  transactions.forEach(item => {
    if (!item.date) return;

    const monthKey = String(item.date).slice(0, 7);
    const month = months.find(entry => entry.key === monthKey);
    const amount = Number(item.amount);

    if (!month || !Number.isFinite(amount) || amount <= 0) return;

    month.hasTransactions = true;

    if (item.type === "income") month.income += amount;
    if (item.type === "expense") month.expenses += amount;
  });

  // Require activity in at least two different months
  const activeMonths = months.filter(month => month.hasTransactions);

  if (activeMonths.length < 2) {
    incomeDisplay.textContent = "Insufficient data";
    expensesDisplay.textContent = "Insufficient data";
    savingsDisplay.textContent = "Insufficient data";

    description.textContent =
      "QORVILO needs transaction records from at least two different months before producing an initial forecast.";

    confidence.textContent =
      "Forecast confidence: Not available yet. Record transactions consistently across multiple months to build a useful financial history.";

    return;
  }

  // Use the two most recent calendar months
const olderMonth = months[1];
const recentMonth = months[2];

if (!olderMonth.hasTransactions || !recentMonth.hasTransactions) {
  incomeDisplay.textContent = "Insufficient data";
  expensesDisplay.textContent = "Insufficient data";
  savingsDisplay.textContent = "Insufficient data";

  description.textContent =
    "QORVILO needs transaction activity in the two most recent calendar months.";

  confidence.textContent =
    "Forecast unavailable: more recent transaction history is required.";

  return;
}

// Choose the forecasting weights
const olderWeight =
  selectedForecastAlgorithm === "WMA" ? 0.30 : 0.50;

const recentWeight =
  selectedForecastAlgorithm === "WMA" ? 0.70 : 0.50;

// Predict income and expenses
const predictedIncome =
  olderMonth.income * olderWeight +
  recentMonth.income * recentWeight;

const predictedExpenses =
  olderMonth.expenses * olderWeight +
  recentMonth.expenses * recentWeight;

const predictedSavings = predictedIncome - predictedExpenses;

  incomeDisplay.textContent = formatMoney(predictedIncome);
  expensesDisplay.textContent = formatMoney(predictedExpenses);
  savingsDisplay.textContent = formatMoney(predictedSavings);

  description.textContent =
    `Based on the last three calendar months, QORVILO estimates next month's income at ${formatMoney(predictedIncome)}, expenses at ${formatMoney(predictedExpenses)}, and net savings at ${formatMoney(predictedSavings)}.`;

  confidence.textContent =
    "Preliminary estimate: This simple three-month average is not a validated prediction. Results may change significantly with limited or irregular transaction history.";
}

// Open Financial Forecast
if (forecastNav && forecastView) {
  forecastNav.addEventListener("click", event => {
    event.preventDefault();

    forecastView.classList.add("active");

    if (assistantView) {
      assistantView.classList.remove("active");
    }

    document.querySelectorAll(".nav-link").forEach(link => {
      link.classList.remove("active");
    });

    forecastNav.classList.add("active");

    renderForecast();
   renderForecastAccuracy();
renderAlgorithmComparison(); 

    forecastView.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}

// Refresh forecast
if (refreshForecast) {
  refreshForecast.addEventListener("click", renderForecast);
}

// Initial forecast
renderForecast();

console.log("QORVILO Financial Forecasting loaded.");

/* =====================================
   QORVILO FORECAST ACCURACY ENGINE
   Version 0.1.0
===================================== */


function renderForecastAccuracy() {
  const predictedDisplay = document.getElementById("accuracy-predicted");
  const actualDisplay = document.getElementById("accuracy-actual");
  const errorDisplay = document.getElementById("accuracy-error");
  const statusDisplay = document.getElementById("accuracy-status");
  const historyBody = document.getElementById("accuracy-history-body");
  const maeDisplay = document.getElementById("accuracy-mae");
  const mapeDisplay = document.getElementById("accuracy-mape");

  if (!predictedDisplay || !actualDisplay ||
      !errorDisplay || !statusDisplay) return;

  // Identify the months represented in the transaction history
  const validTransactions = transactions.filter(item => {
    return item.date &&
      /^\d{4}-\d{2}/.test(String(item.date)) &&
      Number.isFinite(Number(item.amount)) &&
      Number(item.amount) > 0 &&
      ["income", "expense"].includes(item.type);
  });

  if (validTransactions.length === 0) {
    statusDisplay.textContent = "Add transactions to begin backtesting.";
    return;
  }

  const monthKeys = validTransactions.map(item =>
    String(item.date).slice(0, 7)
  ).sort();

  const firstMonth = monthKeys[0];
  const lastMonth = monthKeys[monthKeys.length - 1];

  const [startYear, startMonth] = firstMonth.split("-").map(Number);
  const [endYear, endMonth] = lastMonth.split("-").map(Number);

  // Build every calendar month in the recorded date range
  const months = [];

  let current = new Date(startYear, startMonth - 1, 1);
  const end = new Date(endYear, endMonth - 1, 1);

  while (current <= end) {
    const key =
      `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;

    months.push({
      key,
      income: 0,
      expenses: 0,
      hasTransactions: false
    });

    current.setMonth(current.getMonth() + 1);
  }

  // Group transactions into calendar months
  validTransactions.forEach(item => {
    const key = String(item.date).slice(0, 7);
    const month = months.find(entry => entry.key === key);

    if (!month) return;

    const amount = Number(item.amount);
    month.hasTransactions = true;

    if (item.type === "income") month.income += amount;
    if (item.type === "expense") month.expenses += amount;
  });

  // Backtest each month using the two months before it
  const results = [];

  for (let i = 2; i < months.length; i++) {
    const firstPrevious = months[i - 2];
    const secondPrevious = months[i - 1];
    const actualMonth = months[i];

    // Only test months with recorded activity in all three months
    if (
      !firstPrevious.hasTransactions ||
      !secondPrevious.hasTransactions ||
      !actualMonth.hasTransactions
    ) {
      continue;
    }

    const firstSavings =
      firstPrevious.income - firstPrevious.expenses;

    const secondSavings =
      secondPrevious.income - secondPrevious.expenses;

    const smaPredicted =
  (firstSavings + secondSavings) / 2;

const wmaPredicted =
  (firstSavings * 0.30) + (secondSavings * 0.70);

    const actualSavings =
      actualMonth.income - actualMonth.expenses;

    const absoluteError =
  Math.abs(smaPredicted - actualSavings);

    const percentageError =
      Math.abs(actualSavings) > 0.01
        ? (absoluteError / Math.abs(actualSavings)) * 100
        : null;

    results.push({
  month: actualMonth.key,
  predicted: smaPredicted,
  smaPredicted,
  wmaPredicted,
  actual: actualSavings,
  absoluteError,
  percentageError
});
  }

  if (results.length === 0) {
    predictedDisplay.textContent = "Insufficient data";
    actualDisplay.textContent = "Insufficient data";
    errorDisplay.textContent = "Not available";

    if (historyBody) {
      historyBody.innerHTML =
        '<tr><td colspan="4">No eligible backtests yet.</td></tr>';
    }

    if (maeDisplay) maeDisplay.textContent = "Not available";
    if (mapeDisplay) mapeDisplay.textContent = "Not available";

    statusDisplay.textContent =
      "QORVILO needs at least three consecutive calendar months with recorded transactions. It uses the previous two months to predict each test month.";

    return;
  }
  renderForecastAccuracyChart(results);

  // Calculate overall error metrics
  const mae =
    results.reduce((sum, result) =>
      sum + result.absoluteError, 0) / results.length;

  const validPercentageErrors =
    results.filter(result => result.percentageError !== null);

  const mape = validPercentageErrors.length > 0
    ? validPercentageErrors.reduce((sum, result) =>
        sum + result.percentageError, 0) / validPercentageErrors.length
    : null;

  // Display the latest backtest in the original summary
  const latest = results[results.length - 1];

  predictedDisplay.textContent = formatMoney(latest.predicted);
  actualDisplay.textContent = formatMoney(latest.actual);

  errorDisplay.textContent =
    latest.percentageError !== null
      ? latest.percentageError.toFixed(1) + "%"
      : formatMoney(latest.absoluteError);

  // Display MAE and MAPE
  if (maeDisplay) {
    maeDisplay.textContent = formatMoney(mae);
  }

  if (mapeDisplay) {
    mapeDisplay.textContent =
      mape !== null ? mape.toFixed(1) + "%" : "Not meaningful";
  }

  // Build the historical results table
  if (historyBody) {
    historyBody.innerHTML = results.map(result => `
      <tr>
        <td>${result.month}</td>
        <td>${formatMoney(result.predicted)}</td>
        <td>${formatMoney(result.actual)}</td>
        <td>
          ${result.percentageError !== null
            ? result.percentageError.toFixed(1) + "%"
            : formatMoney(result.absoluteError)}
        </td>
      </tr>
    `).join("");
  }

  statusDisplay.textContent =
    `QORVILO completed ${results.length} historical backtest(s). ` +
    `Mean Absolute Error: ${formatMoney(mae)}. ` +
    `MAPE: ${mape !== null
      ? mape.toFixed(1) + "%"
      : "not meaningful because all tested actual savings were zero"}. ` +
    "These results measure historical performance, not guaranteed future accuracy.";
}


// Run the accuracy test
renderForecastAccuracy();

console.log("QORVILO Forecast Accuracy Engine loaded.");

/* =====================================
   QORVILO ALGORITHM COMPARISON ENGINE
   Version 0.3.0
===================================== */


function renderAlgorithmComparison() {
  const smaMaeDisplay = document.getElementById("sma-mae");
  const smaMapeDisplay = document.getElementById("sma-mape");
  const wmaMaeDisplay = document.getElementById("wma-mae");
  const wmaMapeDisplay = document.getElementById("wma-mape");
  const winnerDisplay = document.getElementById("algorithm-winner");

  if (
    !smaMaeDisplay || !smaMapeDisplay ||
    !wmaMaeDisplay || !wmaMapeDisplay ||
    !winnerDisplay
  ) return;

  // Keep only valid transactions
  const validTransactions = transactions.filter(item =>
    item.date &&
    /^\d{4}-\d{2}/.test(String(item.date)) &&
    Number.isFinite(Number(item.amount)) &&
    Number(item.amount) > 0 &&
    ["income", "expense"].includes(item.type)
  );

  if (validTransactions.length === 0) {
    winnerDisplay.textContent =
      "Add transactions before comparing forecasting algorithms.";
    return;
  }

  // Determine the transaction date range
  const keys = validTransactions.map(item =>
    String(item.date).slice(0, 7)
  ).sort();

  const [startYear, startMonth] = keys[0].split("-").map(Number);
  const [endYear, endMonth] = keys[keys.length - 1].split("-").map(Number);

  const months = [];
  let date = new Date(startYear, startMonth - 1, 1);
  const lastDate = new Date(endYear, endMonth - 1, 1);

  while (date <= lastDate) {
    const key =
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    months.push({
      key,
      income: 0,
      expenses: 0,
      hasTransactions: false
    });

    date.setMonth(date.getMonth() + 1);
  }

  // Calculate monthly income and expenses
  validTransactions.forEach(item => {
    const key = String(item.date).slice(0, 7);
    const month = months.find(entry => entry.key === key);

    if (!month) return;

    const amount = Number(item.amount);
    month.hasTransactions = true;

    if (item.type === "income") month.income += amount;
    if (item.type === "expense") month.expenses += amount;
  });

  const smaErrors = [];
  const wmaErrors = [];

  // Test both algorithms on identical months
  for (let i = 2; i < months.length; i++) {
    const older = months[i - 2];
    const recent = months[i - 1];
    const actualMonth = months[i];

    if (
      !older.hasTransactions ||
      !recent.hasTransactions ||
      !actualMonth.hasTransactions
    ) continue;

    const olderSavings = older.income - older.expenses;
    const recentSavings = recent.income - recent.expenses;
    const actualSavings = actualMonth.income - actualMonth.expenses;

    // Algorithm 1: Simple Moving Average
    const smaPrediction = (olderSavings + recentSavings) / 2;

    // Algorithm 2: Weighted Moving Average
    // Recent month receives 70% weight
    const wmaPrediction =
      (olderSavings * 0.30) + (recentSavings * 0.70);

    const smaError = Math.abs(smaPrediction - actualSavings);
    const wmaError = Math.abs(wmaPrediction - actualSavings);

    smaErrors.push({
      absolute: smaError,
      percentage: Math.abs(actualSavings) > 0.01
        ? (smaError / Math.abs(actualSavings)) * 100
        : null
    });

    wmaErrors.push({
      absolute: wmaError,
      percentage: Math.abs(actualSavings) > 0.01
        ? (wmaError / Math.abs(actualSavings)) * 100
        : null
    });
  }

  if (smaErrors.length === 0) {
    smaMaeDisplay.textContent = "Insufficient data";
    smaMapeDisplay.textContent = "Insufficient data";
    wmaMaeDisplay.textContent = "Insufficient data";
    wmaMapeDisplay.textContent = "Insufficient data";

    winnerDisplay.textContent =
      "At least three consecutive months with transaction activity are needed.";

    return;
  }

  // Calculate MAE
  const smaMae = smaErrors.reduce(
    (sum, item) => sum + item.absolute, 0
  ) / smaErrors.length;

  const wmaMae = wmaErrors.reduce(
    (sum, item) => sum + item.absolute, 0
  ) / wmaErrors.length;

  // Calculate MAPE, excluding zero actual values
  const smaValidMape = smaErrors.filter(item => item.percentage !== null);
  const wmaValidMape = wmaErrors.filter(item => item.percentage !== null);

  const smaMape = smaValidMape.length
    ? smaValidMape.reduce((sum, item) => sum + item.percentage, 0)
      / smaValidMape.length
    : null;

  const wmaMape = wmaValidMape.length
    ? wmaValidMape.reduce((sum, item) => sum + item.percentage, 0)
      / wmaValidMape.length
    : null;

  // Display results
  smaMaeDisplay.textContent = formatMoney(smaMae);
  wmaMaeDisplay.textContent = formatMoney(wmaMae);

  smaMapeDisplay.textContent =
    smaMape === null ? "Not meaningful" : smaMape.toFixed(1) + "%";

  wmaMapeDisplay.textContent =
    wmaMape === null ? "Not meaningful" : wmaMape.toFixed(1) + "%";

  // Select the winner using MAE
  // Select the winner using MAE
if (Math.abs(smaMae - wmaMae) < 0.01) {
  selectedForecastAlgorithm = "SMA";

  winnerDisplay.textContent =
    `Both algorithms performed equally across ${smaErrors.length} backtests. SMA will be used as the default.`;

} else if (smaMae < wmaMae) {
  selectedForecastAlgorithm = "SMA";

  winnerDisplay.textContent =
    `Simple Moving Average (SMA) performed better across ${smaErrors.length} backtests.`;

} else {
  selectedForecastAlgorithm = "WMA";

  winnerDisplay.textContent =
    `Weighted Moving Average (WMA) performed better across ${smaErrors.length} backtests.`;
}

// Refresh the forecast using the selected algorithm
renderForecast();
}

// Run algorithm comparison
renderAlgorithmComparison();

function renderForecastAccuracyChart(results) {
  const canvas = document.getElementById("forecast-accuracy-chart");

  if (!canvas || !results || results.length === 0) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  if (!width || !height) return;

  const pixelRatio = window.devicePixelRatio || 1;

  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  canvas.style.cursor = "crosshair";

const tooltip = document.getElementById("forecast-chart-tooltip");

  const padding = { top: 20, right: 20, bottom: 45, left: 75 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = results.flatMap(item => [
    item.actual,
    item.smaPredicted,
    item.wmaPredicted
  ]);

  let minValue = Math.min(0, ...values);
  let maxValue = Math.max(0, ...values);

  if (minValue === maxValue) {
    minValue -= 100;
    maxValue += 100;
  }

  const range = maxValue - minValue;
  minValue -= range * 0.10;
  maxValue += range * 0.10;

  const x = index =>
    padding.left +
    (results.length === 1
      ? chartWidth / 2
      : index * chartWidth / (results.length - 1));

  const y = value =>
    padding.top +
    ((maxValue - value) / (maxValue - minValue)) * chartHeight;

  const textColor =
    getComputedStyle(document.body)
      .getPropertyValue("--muted").trim() || "#999999";

  const gridColor =
    getComputedStyle(document.body)
      .getPropertyValue("--border").trim() || "#444444";

  ctx.font = "11px Arial";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  // Draw horizontal grid lines and value labels
  for (let i = 0; i <= 4; i++) {
    const value = minValue + (maxValue - minValue) * i / 4;
    const position = y(value);

    ctx.beginPath();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.moveTo(padding.left, position);
    ctx.lineTo(width - padding.right, position);
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.fillText(
" KES " + Math.round(value).toLocaleString("en-KE"),
      padding.left - 10,
      position
    );
  }

  // Draw each data series
  function drawLine(property, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    results.forEach((item, index) => {
      const pointX = x(index);
      const pointY = y(item[property]);

      if (index === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        ctx.lineTo(pointX, pointY);
      }
    });

    ctx.stroke();

    // Draw data points
    results.forEach((item, index) => {
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(x(index), y(item[property]), 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawLine("actual", "#43c9a5");
  drawLine("smaPredicted", "#e7c783");
  drawLine("wmaPredicted", "#829cff");

  // Draw month labels
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  results.forEach((item, index) => {
    const [year, month] = item.month.split("-");

const monthLabel = new Date(
  Number(year),
  Number(month) - 1,
  1
).toLocaleDateString("en-KE", {
  month: "short",
  year: "numeric"
});

    ctx.fillText(
      monthLabel,
      x(index),
      height - padding.bottom + 12
    );
  });

canvas.onmousemove = event => {
  if (!tooltip) return;

  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  let nearestIndex = 0;
  let smallestXDistance = Infinity;

  results.forEach((item, index) => {
    const distance = Math.abs(mouseX - x(index));

    if (distance < smallestXDistance) {
      smallestXDistance = distance;
      nearestIndex = index;
    }
  });

  const item = results[nearestIndex];

  const series = [
    { name: "Actual Savings", value: item.actual },
    { name: "SMA Prediction", value: item.smaPredicted },
    { name: "WMA Prediction", value: item.wmaPredicted }
  ];

  let closestSeries = series[0];
  let smallestYDistance = Infinity;

  series.forEach(entry => {
    const distance = Math.abs(mouseY - y(entry.value));

    if (distance < smallestYDistance) {
      smallestYDistance = distance;
      closestSeries = entry;
    }
  });

  tooltip.innerHTML = `
    <strong>${item.month}</strong><br>
    ${closestSeries.name}: KES ${closestSeries.value.toLocaleString("en-KE", {
      maximumFractionDigits: 0
    })}
  `;

  tooltip.style.display = "block";

  const parentRect = canvas.parentElement.getBoundingClientRect();

  tooltip.style.left = `${Math.max(
    8,
    Math.min(
      event.clientX - parentRect.left + 12,
      parentRect.width - tooltip.offsetWidth - 8
    )
  )}px`;

  tooltip.style.top = `${Math.max(
    8,
    event.clientY - parentRect.top - tooltip.offsetHeight - 12
  )}px`;
};

canvas.onmouseleave = () => {
  if (tooltip) tooltip.style.display = "none";
};

}

function analyzeFinancialAnomalies(transactionData = transactions) {
  const anomalies = [];

  const validTransactions = transactionData
    .filter(item =>
      item.date &&
      /^\d{4}-\d{2}-\d{2}$/.test(String(item.date)) &&
      Number.isFinite(Number(item.amount)) &&
      Number(item.amount) > 0 &&
      ["income", "expense"].includes(item.type)
    )
    .sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    );

  const expenses = validTransactions.filter(
    item => item.type === "expense"
  );

  // Efficient median tracking using two heaps.
  // Lower half: max heap. Upper half: min heap.

  function pushMaxHeap(heap, value) {
    heap.push(value);
    let index = heap.length - 1;

    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);

      if (heap[parent] >= heap[index]) break;

      [heap[parent], heap[index]] =
        [heap[index], heap[parent]];

      index = parent;
    }
  }

  function pushMinHeap(heap, value) {
    heap.push(value);
    let index = heap.length - 1;

    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);

      if (heap[parent] <= heap[index]) break;

      [heap[parent], heap[index]] =
        [heap[index], heap[parent]];

      index = parent;
    }
  }

  function popMaxHeap(heap) {
    const root = heap[0];
    const last = heap.pop();

    if (heap.length > 0) {
      heap[0] = last;
      let index = 0;

      while (true) {
        const left = index * 2 + 1;
        const right = index * 2 + 2;
        let largest = index;

        if (
          left < heap.length &&
          heap[left] > heap[largest]
        ) {
          largest = left;
        }

        if (
          right < heap.length &&
          heap[right] > heap[largest]
        ) {
          largest = right;
        }

        if (largest === index) break;

        [heap[index], heap[largest]] =
          [heap[largest], heap[index]];

        index = largest;
      }
    }

    return root;
  }

  function popMinHeap(heap) {
    const root = heap[0];
    const last = heap.pop();

    if (heap.length > 0) {
      heap[0] = last;
      let index = 0;

      while (true) {
        const left = index * 2 + 1;
        const right = index * 2 + 2;
        let smallest = index;

        if (
          left < heap.length &&
          heap[left] < heap[smallest]
        ) {
          smallest = left;
        }

        if (
          right < heap.length &&
          heap[right] < heap[smallest]
        ) {
          smallest = right;
        }

        if (smallest === index) break;

        [heap[index], heap[smallest]] =
          [heap[smallest], heap[index]];

        index = smallest;
      }
    }

    return root;
  }

  function addToMedianState(state, value) {
    if (
      state.lower.length === 0 ||
      value <= state.lower[0]
    ) {
      pushMaxHeap(state.lower, value);
    } else {
      pushMinHeap(state.upper, value);
    }

    if (
      state.lower.length > state.upper.length + 1
    ) {
      pushMinHeap(
        state.upper,
        popMaxHeap(state.lower)
      );
    } else if (
      state.upper.length > state.lower.length
    ) {
      pushMaxHeap(
        state.lower,
        popMinHeap(state.upper)
      );
    }
  }

  function getMedian(state) {
    if (
      state.lower.length === state.upper.length
    ) {
      return (
        state.lower[0] + state.upper[0]
      ) / 2;
    }

    return state.lower[0];
  }

  // RULE 1: Unusually large expenses.
  // Group expenses by category and date once.

  const categoryExpenseGroups = new Map();

  expenses.forEach(item => {
    if (!categoryExpenseGroups.has(item.category)) {
      categoryExpenseGroups.set(item.category, []);
    }

    categoryExpenseGroups.get(item.category).push(item);
  });

  const largeAnomalies = new Map();

  categoryExpenseGroups.forEach(categoryExpenses => {
    const dateGroups = new Map();

    categoryExpenses.forEach(item => {
      if (!dateGroups.has(item.date)) {
        dateGroups.set(item.date, []);
      }

      dateGroups.get(item.date).push(item);
    });

    const history = {
      lower: [],
      upper: []
    };

    const dates = [...dateGroups.keys()].sort();

    dates.forEach(date => {
      const currentDayExpenses = dateGroups.get(date);

      // All transactions on the same date use
      // history from strictly earlier dates.

      currentDayExpenses.forEach(item => {
        const historyCount =
          history.lower.length + history.upper.length;

        if (historyCount < 3) return;

        const median = getMedian(history);
        const amount = Number(item.amount);

        if (
          amount >= Math.max(
            median * 2.5,
            median + 1000
          )
        ) {
          largeAnomalies.set(item, {
            id: `large-${item.id}`,
            transactionId: item.id,
            type: "Large Expense",
            severity: "high",
            title: "Unusually large expense",
            description:
              `${item.description} is significantly higher than previous ` +
              `${item.category} expenses. The historical median is ` +
              `${formatMoney(median)}.`,
            amount,
            riskScore: Math.min(
              100,
              Math.max(
                30,
                Math.round((amount / median) * 28)
              )
            ),
            date: item.date
          });
        }
      });

      // Add the current date's expenses only after
      // checking all transactions on that date.

      currentDayExpenses.forEach(item => {
        addToMedianState(
          history,
          Number(item.amount)
        );
      });
    });
  });

  // Preserve the original chronological alert order.

  expenses.forEach(item => {
    if (largeAnomalies.has(item)) {
      anomalies.push(largeAnomalies.get(item));
    }
  });

  // RULE 2: Category spending spikes.
  // Build category/month totals in a single pass.

  const monthlyTotals = new Map();

  expenses.forEach(item => {
    const category = item.category || "Other";
    const month = String(item.date).slice(0, 7);

    if (!monthlyTotals.has(category)) {
      monthlyTotals.set(category, new Map());
    }

    const categoryMonths = monthlyTotals.get(category);

    categoryMonths.set(
      month,
      (categoryMonths.get(month) || 0) +
        Number(item.amount)
    );
  });

  monthlyTotals.forEach((categoryMonths, category) => {
    const months = [...categoryMonths.keys()].sort();

    months.forEach((month, index) => {
      if (index < 2) return;

      const previousMonths = months.slice(
        Math.max(0, index - 3),
        index
      );

      const average = previousMonths.reduce(
        (sum, previousMonth) =>
          sum + categoryMonths.get(previousMonth),
        0
      ) / previousMonths.length;

      const currentTotal = categoryMonths.get(month);

      if (
        average > 0 &&
        currentTotal >= average * 1.8 &&
        currentTotal - average >= 1000
      ) {
        anomalies.push({
          id: `spike-${category}-${month}`,
          type: "Category Spending Spike",
          severity: "medium",
          title: `${category} spending increased`,
          description:
            `${category} spending in ${month} is significantly above ` +
            `the average of the preceding recorded months.`,
          amount: currentTotal,
          riskScore: Math.min(
            100,
            Math.max(
              30,
              Math.round((currentTotal / average) * 35)
            )
          ),
          date: month
        });
      }
    });
  });

  // RULE 3: Possible duplicate transactions.
  // Preserve constant-time Map lookups.

  const seenTransactions = new Map();

  expenses.forEach(item => {
    const key = [
      String(item.description || "").trim().toLowerCase(),
      Number(item.amount),
      String(item.category || "Other").toLowerCase(),
      item.date
    ].join("|");

    if (seenTransactions.has(key)) {
      anomalies.push({
        id: `duplicate-${item.id}`,
        transactionId: item.id,
        type: "Possible Duplicate",
        severity: "high",
        riskScore: 85,
        title: "Possible duplicate transaction",
        description:
          "Another expense has the same description, amount, category and date.",
        amount: Number(item.amount),
        date: item.date
      });
    } else {
      seenTransactions.set(key, item.id);
    }
  });

  return anomalies;
}


// Register existing anomalies without sending notifications
knownAnomalyIds = new Set(
  analyzeFinancialAnomalies().map(item => item.id)
);


function renderAnomalies() {
  const allAnomalies = analyzeFinancialAnomalies();

  // Hide alerts that the user has dismissed
  const anomalies = allAnomalies.filter(
    item => !dismissedAnomalyIds.has(item.id)
  );

  const totalDisplay = document.getElementById("anomaly-total");
  const highDisplay = document.getElementById("anomaly-high");
  const mediumDisplay = document.getElementById("anomaly-medium");
  const statusDisplay = document.getElementById("anomaly-status");
  const anomalyList = document.getElementById("anomaly-list");

  if (!totalDisplay || !highDisplay ||
      !mediumDisplay || !statusDisplay || !anomalyList) {
    return;
  }

  const highCount = anomalies.filter(
    item => item.severity === "high"
  ).length;

  const mediumCount = anomalies.filter(
    item => item.severity === "medium"
  ).length;

  totalDisplay.textContent = anomalies.length;
  highDisplay.textContent = highCount;
  mediumDisplay.textContent = mediumCount;
  statusDisplay.textContent = "Active";

  anomalyList.replaceChildren();
  // Render dismissed anomaly history
const historyList = document.getElementById(
  "anomaly-history-list"
);

if (historyList) {
  historyList.replaceChildren();

  const dismissedAnomalies = allAnomalies.filter(
    item => dismissedAnomalyIds.has(item.id)
  );

  if (dismissedAnomalies.length === 0) {
    const emptyHistory = document.createElement("p");
    emptyHistory.textContent = "No dismissed anomalies yet.";
    historyList.appendChild(emptyHistory);
  } else {
    dismissedAnomalies.forEach(item => {
      const historyCard = document.createElement("div");
      historyCard.className = `anomaly-card ${item.severity}`;

      const heading = document.createElement("h4");
      heading.textContent = item.title;

      const details = document.createElement("p");
      details.textContent =
        `${item.date} • ${formatMoney(item.amount)}`;

      const status = document.createElement("span");
      status.className = "anomaly-priority medium";
      status.textContent = "DISMISSED";
      const restoreButton = document.createElement("button");
restoreButton.textContent = "Restore";
restoreButton.className = "restore-anomaly";

restoreButton.addEventListener("click", () => {
  dismissedAnomalyIds.delete(item.id);

  localStorage.setItem(
    "qorvilo-dismissed-anomalies",
    JSON.stringify([...dismissedAnomalyIds])
  );

  renderAnomalies();
});

     historyCard.append(
  heading,
  details,
  status,
  restoreButton
);
      historyList.appendChild(historyCard);
    });
  }
}

  if (anomalies.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent =
      "No active anomalies. QORVILO is monitoring your transactions.";
    anomalyList.appendChild(emptyMessage);
    return;
  }

  anomalies.forEach(item => {
    const card = document.createElement("div");
    card.className = `anomaly-card ${item.severity}`;

    const heading = document.createElement("h4");
    heading.textContent = item.title;

    const description = document.createElement("p");
    description.textContent = item.description;

    const details = document.createElement("div");
    details.className = "anomaly-details";
    details.textContent =
      `${item.date} • ${formatMoney(item.amount)}`;
      const riskScore = document.createElement("div");
riskScore.className = "anomaly-risk-score " +
  (item.riskScore >= 70
    ? "high"
    : item.riskScore >= 30
      ? "medium"
      : "low");

const riskLabel = item.riskScore >= 70
  ? "HIGH RISK"
  : item.riskScore >= 30
    ? "MEDIUM RISK"
    : "LOW RISK";

riskScore.textContent =
  `Risk Score: ${item.riskScore}/100 · ${riskLabel}`;

    const priority = document.createElement("span");
    priority.className = `anomaly-priority ${item.severity}`;
    priority.textContent =
      item.severity === "high" ? "HIGH PRIORITY" : "MEDIUM PRIORITY";

    const dismissButton = document.createElement("button");
    dismissButton.textContent = "Dismiss";
    dismissButton.className = "dismiss-anomaly";

    dismissButton.addEventListener("click", () => {
      dismissedAnomalyIds.add(item.id);

      localStorage.setItem(
        "qorvilo-dismissed-anomalies",
        JSON.stringify([...dismissedAnomalyIds])
      );

      renderAnomalies();
    });

    card.append(
  heading,
  description,
  details,
  riskScore,
  priority,
  dismissButton
);

    anomalyList.appendChild(card);
  });
}


  function showAnomalyToast(anomaly) {
  const container = document.getElementById(
    "anomaly-toast-container"
  );

  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "anomaly-toast";

  const heading = document.createElement("strong");
  heading.textContent = "⚠ QORVILO Security Alert";

  const message = document.createElement("p");
  message.textContent = anomaly.description;

  toast.append(heading, message);
  container.appendChild(toast);

  // Remove notification after 6 seconds
  setTimeout(() => {
    toast.remove();
  }, 6000);
}
if (anomalyNav && anomalyView) {
  anomalyNav.addEventListener("click", event => {
    event.preventDefault();

    // Show Anomaly Detection
    anomalyView.classList.add("active");

    // Hide other dedicated views
    if (forecastView) {
      forecastView.classList.remove("active");
    }

    const assistantView = document.getElementById("assistant");

    if (assistantView) {
      assistantView.classList.remove("active");
    }

    // Update active sidebar link
    document.querySelectorAll(".nav-link").forEach(link => {
      link.classList.remove("active");
    });

    anomalyNav.classList.add("active");
    renderAnomalies();

    // Position the page in view
    anomalyView.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}

