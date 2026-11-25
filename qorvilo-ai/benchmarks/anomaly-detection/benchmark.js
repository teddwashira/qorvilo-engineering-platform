
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { performance } = require("node:perf_hooks");

// Locate the real anomaly detection function in app.js
const appPath = path.join(
  __dirname,
  "../../public/app.js"
);

const source = fs.readFileSync(appPath, "utf8");

const start = source.indexOf(
  "function analyzeFinancialAnomalies("
);

const end = source.indexOf(
  "// Register existing anomalies without sending notifications",
  start
);

if (start === -1 || end === -1) {
  throw new Error("Could not locate anomaly detection function.");
}

const functionCode = source.slice(start, end);

const context = {
  formatMoney: amount => `Ksh ${amount}`
};

vm.createContext(context);
vm.runInContext(functionCode, context);

const detect = context.analyzeFinancialAnomalies;

// Generate realistic synthetic transactions
function generateTransactions(count) {
  const transactions = [];
  const categories = [
    "Shopping",
    "Transport",
    "Food",
    "Entertainment",
    "Bills"
  ];

  for (let i = 0; i < count; i++) {
    const date = new Date(2025, 0, 1 + i);

    transactions.push({
      id: i + 1,
      type: "expense",
      description: `Transaction ${i + 1}`,
      amount: 500 + (i % 20) * 100,
      category: categories[i % categories.length],
      date: date.toISOString().slice(0, 10)
    });
  }

  return transactions;
}

// Benchmark configuration
const datasetSizes = [100, 1000, 5000, 10000];
const repetitionsBySize = {
  100: 10,
  1000: 5,
  5000: 2,
  10000: 1
};

console.log("\nQORVILO v0.8");
console.log("ANOMALY DETECTION PERFORMANCE BENCHMARK\n");

console.log(
  "Transactions | Average (ms) | Minimum (ms) | Maximum (ms)"
);

console.log("-".repeat(65));

for (const size of datasetSizes) {
  const transactions = generateTransactions(size);
  const repetitions = repetitionsBySize[size];

  // Warm up the JavaScript engine
  detect(transactions);

  const times = [];

  for (let i = 0; i < repetitions; i++) {
    const startTime = performance.now();

    detect(transactions);

    const endTime = performance.now();
    times.push(endTime - startTime);
  }

  const average =
    times.reduce((sum, time) => sum + time, 0) /
    times.length;

  const minimum = Math.min(...times);
  const maximum = Math.max(...times);

  console.log(
    `${String(size).padEnd(13)} | ` +
    `${average.toFixed(4).padEnd(12)} | ` +
    `${minimum.toFixed(4).padEnd(12)} | ` +
    `${maximum.toFixed(4)}`
  );
}

console.log("\nBenchmark completed.");
