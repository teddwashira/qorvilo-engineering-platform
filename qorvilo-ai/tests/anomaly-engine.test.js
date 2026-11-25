
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

// =====================================================
// QORVILO v0.7 — ACTUAL JAVASCRIPT ENGINE
// =====================================================

const appPath = path.join(__dirname, "../public/app.js");
const appCode = fs.readFileSync(appPath, "utf8");

const start = appCode.indexOf(
  "function analyzeFinancialAnomalies("
);

const end = appCode.indexOf(
  "// Register existing anomalies without sending notifications",
  start
);

if (start === -1 || end === -1) {
  throw new Error("Could not locate anomaly detection function.");
}

const functionCode = appCode.slice(start, end);

const context = {
  formatMoney: amount => `Ksh ${amount}`
};

vm.createContext(context);
vm.runInContext(functionCode, context);

const detect = context.analyzeFinancialAnomalies;

// =====================================================
// TEST DATA HELPERS
// =====================================================

function expense(
  id,
  amount,
  date,
  category = "Shopping",
  description = `Transaction ${id}`
) {
  return {
    id: String(id),
    type: "expense",
    category,
    amount,
    description,
    date
  };
}

function income(id, amount, date, category = "Salary") {
  return {
    id: String(id),
    type: "income",
    category,
    amount,
    description: `Income ${id}`,
    date
  };
}

function monthlyBaseline(category, months) {
  const records = [];
  let id = 1;

  for (const month of months) {
    records.push(
      expense(id++, 1000, `${month}-01`, category, `${month} A`)
    );

    records.push(
      expense(id++, 1000, `${month}-02`, category, `${month} B`)
    );
  }

  return records;
}

// =====================================================
// 1–4: LARGE EXPENSE DETECTION
// =====================================================

// TEST 1
test("01 - Detects an unusually large expense", () => {
  const transactions = [
    expense(1, 1000, "2026-10-01"),
    expense(2, 1000, "2026-10-02"),
    expense(3, 1000, "2026-10-03"),
    expense(4, 10000, "2026-10-04")
  ];

  const results = detect(transactions);

  assert.ok(results.some(item => item.id === "large-4"));
});

// TEST 2
test("02 - Detects an expense exactly at the threshold", () => {
  const transactions = [
    expense(1, 1000, "2026-10-01"),
    expense(2, 1000, "2026-10-02"),
    expense(3, 1000, "2026-10-03"),
    expense(4, 2500, "2026-10-04")
  ];

  const results = detect(transactions);

  assert.ok(results.some(item => item.id === "large-4"));
});

// TEST 3
test("03 - Does not flag an expense below the threshold", () => {
  const transactions = [
    expense(1, 1000, "2026-10-01"),
    expense(2, 1000, "2026-10-02"),
    expense(3, 1000, "2026-10-03"),
    expense(4, 2499, "2026-10-04")
  ];

  const results = detect(transactions);

  assert.equal(
    results.some(item => item.id === "large-4"),
    false
  );
});

// TEST 4
test("04 - Does not use another category's history", () => {
  const transactions = [
    expense(1, 1000, "2026-10-01", "Food"),
    expense(2, 1000, "2026-10-02", "Food"),
    expense(3, 1000, "2026-10-03", "Food"),
    expense(4, 10000, "2026-10-04", "Shopping")
  ];

  const results = detect(transactions);

  assert.equal(
    results.some(item => item.id === "large-4"),
    false
  );
});

// =====================================================
// 5–8: CATEGORY SPENDING SPIKES
// =====================================================

// TEST 5
test("05 - Detects a category spending spike", () => {
  const transactions = [
    ...monthlyBaseline("Transport", [
      "2026-07",
      "2026-08",
      "2026-09"
    ]),
    expense(7, 1800, "2026-10-01", "Transport"),
    expense(8, 1800, "2026-10-02", "Transport")
  ];

  const results = detect(transactions);

  assert.ok(
    results.some(item => item.id === "spike-Transport-2026-10")
  );
});

// TEST 6
test("06 - Detects category spending at exactly 1.8 times baseline", () => {
  const transactions = [
    ...monthlyBaseline("Transport", [
      "2026-07",
      "2026-08",
      "2026-09"
    ]),
    expense(7, 1800, "2026-10-01", "Transport"),
    expense(8, 1800, "2026-10-02", "Transport")
  ];

  const results = detect(transactions);

  const spike = results.find(
    item => item.id === "spike-Transport-2026-10"
  );

  assert.ok(spike);
  assert.equal(spike.amount, 3600);
});

// TEST 7
test("07 - Does not flag category spending just below 1.8 times baseline", () => {
  const transactions = [
    ...monthlyBaseline("Transport", [
      "2026-07",
      "2026-08",
      "2026-09"
    ]),
    expense(7, 1799, "2026-10-01", "Transport"),
    expense(8, 1800, "2026-10-02", "Transport")
  ];

  const results = detect(transactions);

  assert.equal(
    results.some(item => item.id === "spike-Transport-2026-10"),
    false
  );
});

// TEST 8
test("08 - Compares preceding recorded months when months are missing", () => {
  const transactions = [
    ...monthlyBaseline("Transport", [
      "2026-07",
      "2026-09"
    ]),
    expense(5, 1800, "2026-10-01", "Transport"),
    expense(6, 1800, "2026-10-02", "Transport")
  ];

  const results = detect(transactions);

  assert.ok(
    results.some(item => item.id === "spike-Transport-2026-10")
  );
});

// =====================================================
// 9–12: DUPLICATE DETECTION
// =====================================================

// TEST 9
test("09 - Detects an exact duplicate transaction", () => {
  const transactions = [
    expense(1, 5000, "2026-10-10", "Shopping", "Test Duplicate"),
    expense(2, 5000, "2026-10-10", "Shopping", "Test Duplicate")
  ];

  const results = detect(transactions);

  assert.ok(results.some(item => item.id === "duplicate-2"));
});

// TEST 10
test("10 - Does not flag identical transactions on different dates", () => {
  const transactions = [
    expense(1, 5000, "2026-10-10", "Shopping", "Shopping"),
    expense(2, 5000, "2026-10-11", "Shopping", "Shopping")
  ];

  const results = detect(transactions);

  assert.equal(
    results.some(item => item.id === "duplicate-2"),
    false
  );
});

// TEST 11
test("11 - Does not flag transactions with different amounts", () => {
  const transactions = [
    expense(1, 5000, "2026-10-10", "Shopping", "Shopping"),
    expense(2, 6000, "2026-10-10", "Shopping", "Shopping")
  ];

  const results = detect(transactions);

  assert.equal(
    results.some(item => item.id === "duplicate-2"),
    false
  );
});

// TEST 12
test("12 - Does not flag transactions from different categories as duplicates", () => {
  const transactions = [
    expense(1, 5000, "2026-10-10", "Shopping", "Purchase"),
    expense(2, 5000, "2026-10-10", "Food", "Purchase")
  ];

  const results = detect(transactions);

  assert.equal(
    results.some(item => item.id === "duplicate-2"),
    false
  );
});

// =====================================================
// 13–16: INVALID TRANSACTION HANDLING
// =====================================================

// TEST 13
test("13 - Ignores zero and negative transaction amounts", () => {
  const transactions = [
    expense(1, 0, "2026-10-01"),
    expense(2, -500, "2026-10-02")
  ];

  assert.equal(detect(transactions).length, 0);
});

// TEST 14
test("14 - Ignores malformed transaction dates", () => {
  const transactions = [
    expense(1, 500, "invalid-date"),
    expense(2, 1000, "2026/10/01")
  ];

  assert.equal(detect(transactions).length, 0);
});

// TEST 15
test("15 - Ignores transfers and income in expense detection", () => {
  const transactions = [
    income(1, 100000, "2026-07-01"),
    income(2, 100000, "2026-08-01"),
    income(3, 100000, "2026-09-01"),
    {
      id: "4",
      type: "transfer",
      category: "Shopping",
      amount: 100000,
      description: "Transfer",
      date: "2026-10-01"
    }
  ];

  assert.equal(detect(transactions).length, 0);
});

// TEST 16
test("16 - Ignores non-numeric and missing amounts", () => {
  const transactions = [
    {
      id: "1",
      type: "expense",
      category: "Food",
      amount: "not-a-number",
      description: "Invalid",
      date: "2026-10-01"
    },
    {
      id: "2",
      type: "expense",
      category: "Food",
      description: "Missing amount",
      date: "2026-10-02"
    }
  ];

  assert.equal(detect(transactions).length, 0);
});

// =====================================================
// 17–19: HISTORICAL DATA SAFEGUARDS
// =====================================================

// TEST 17
test("17 - Requires three previous expenses for large expense detection", () => {
  const transactions = [
    expense(1, 1000, "2026-10-01"),
    expense(2, 1000, "2026-10-02"),
    expense(3, 100000, "2026-10-03")
  ];

  const results = detect(transactions);

  assert.equal(
    results.some(item => item.id === "large-3"),
    false
  );
});

// TEST 18

test("18 - Detects a spike with two preceding recorded months", () => {
  const transactions = [
    ...monthlyBaseline("Transport", [
      "2026-07",
      "2026-08"
    ]),
    expense(5, 10000, "2026-09-01", "Transport")
  ];

  const results = detect(transactions);

  assert.ok(
    results.some(item => item.id === "spike-Transport-2026-09")
  );
});


// TEST 19
test("19 - Does not count income as previous expense history", () => {
  const transactions = [
    income(1, 1000, "2026-10-01", "Shopping"),
    income(2, 1000, "2026-10-02", "Shopping"),
    income(3, 1000, "2026-10-03", "Shopping"),
    expense(4, 10000, "2026-10-04", "Shopping")
  ];

  const results = detect(transactions);

  assert.equal(
    results.some(item => item.id === "large-4"),
    false
  );
});

// =====================================================
// 20–22: RISK SCORE VALIDATION
// =====================================================

// TEST 20
test("20 - Caps large expense risk score at 100", () => {
  const transactions = [
    expense(1, 1000, "2026-10-01"),
    expense(2, 1000, "2026-10-02"),
    expense(3, 1000, "2026-10-03"),
    expense(4, 10000, "2026-10-04")
  ];

  const results = detect(transactions);

  const anomaly = results.find(item => item.id === "large-4");

  assert.ok(anomaly);
  assert.equal(anomaly.riskScore, 100);
});

// TEST 21
test("21 - Calculates large expense risk score correctly", () => {
  const transactions = [
    expense(1, 1000, "2026-10-01"),
    expense(2, 1000, "2026-10-02"),
    expense(3, 1000, "2026-10-03"),
    expense(4, 2500, "2026-10-04")
  ];

  const results = detect(transactions);

  const anomaly = results.find(item => item.id === "large-4");

  assert.ok(anomaly);
  assert.equal(anomaly.riskScore, 70);
});

// TEST 22
test("22 - Calculates category spike risk score correctly", () => {
  const transactions = [
    ...monthlyBaseline("Transport", [
      "2026-07",
      "2026-08",
      "2026-09"
    ]),
    expense(7, 1800, "2026-10-01", "Transport"),
    expense(8, 1800, "2026-10-02", "Transport")
  ];

  const results = detect(transactions);

  const anomaly = results.find(
    item => item.id === "spike-Transport-2026-10"
  );

  assert.ok(anomaly);
  assert.equal(anomaly.riskScore, 63);
});

// =====================================================
// 23–26: DATE AND MONTH BOUNDARIES
// =====================================================

// TEST 23
test("23 - Detects a spending spike across a year boundary", () => {
  const transactions = [
    ...monthlyBaseline("Transport", [
      "2025-11",
      "2025-12",
      "2026-01"
    ]),
    expense(7, 1800, "2026-02-01", "Transport"),
    expense(8, 1800, "2026-02-02", "Transport")
  ];

  const results = detect(transactions);

  assert.ok(
    results.some(item => item.id === "spike-Transport-2026-02")
  );
});

// TEST 24
test("24 - Detects large expenses when input transactions are out of order", () => {
  const transactions = [
    expense(4, 10000, "2026-10-04"),
    expense(2, 1000, "2026-10-02"),
    expense(1, 1000, "2026-10-01"),
    expense(3, 1000, "2026-10-03")
  ];

  const results = detect(transactions);

  assert.ok(results.some(item => item.id === "large-4"));
});

// TEST 25
test("25 - Does not treat identical purchases in different years as duplicates", () => {
  const transactions = [
    expense(1, 5000, "2026-12-31", "Shopping", "Annual Purchase"),
    expense(2, 5000, "2027-01-01", "Shopping", "Annual Purchase")
  ];

  const results = detect(transactions);

  assert.equal(
    results.some(item => item.id === "duplicate-2"),
    false
  );
});

// TEST 26
test("26 - Handles leap-day transactions in monthly comparisons", () => {
  const transactions = [
    ...monthlyBaseline("Transport", [
      "2024-01",
      "2024-02"
    ]),
    expense(5, 1800, "2024-02-29", "Transport"),
    expense(6, 1800, "2024-03-01", "Transport")
  ];

  const results = detect(transactions);

  // February includes the two baseline expenses and the leap-day
  // expense. March is evaluated against the recorded months before it.
  // The March transaction alone is not a category spike.
  assert.equal(
    results.some(item => item.id === "spike-Transport-2024-03"),
    false
  );
});

// =====================================================
// 27–29: MULTIPLE ANOMALY DETECTION
// =====================================================

// TEST 27
test("27 - Detects a large duplicate transaction", () => {
  const transactions = [
    expense(1, 1000, "2026-10-01"),
    expense(2, 1000, "2026-10-02"),
    expense(3, 1000, "2026-10-03"),
    expense(4, 10000, "2026-10-04", "Shopping", "Large Duplicate"),
    expense(5, 10000, "2026-10-04", "Shopping", "Large Duplicate")
  ];

  const results = detect(transactions);

  assert.ok(results.some(item => item.id === "large-5"));
  assert.ok(results.some(item => item.id === "duplicate-5"));
});

// TEST 28
test("28 - Detects a transaction contributing to both large expense and category spike", () => {
  const transactions = [
    ...monthlyBaseline("Transport", [
      "2026-07",
      "2026-08",
      "2026-09"
    ]),
    expense(7, 3000, "2026-10-01", "Transport"),
    expense(8, 1000, "2026-10-02", "Transport")
  ];

  const results = detect(transactions);

  assert.ok(results.some(item => item.id === "large-7"));
  assert.ok(
    results.some(item => item.id === "spike-Transport-2026-10")
  );
});

// TEST 29
test("29 - Detects spending spikes in multiple categories", () => {
  const transactions = [
    ...monthlyBaseline("Transport", [
      "2026-07",
      "2026-08",
      "2026-09"
    ]),
    ...monthlyBaseline("Food", [
      "2026-07",
      "2026-08",
      "2026-09"
    ]),
    expense(13, 1800, "2026-10-01", "Transport"),
    expense(14, 1800, "2026-10-02", "Transport"),
    expense(15, 1800, "2026-10-01", "Food"),
    expense(16, 1800, "2026-10-02", "Food")
  ];

  const results = detect(transactions);

  assert.ok(
    results.some(item => item.id === "spike-Transport-2026-10")
  );

  assert.ok(
    results.some(item => item.id === "spike-Food-2026-10")
  );
});

// =====================================================
// 30–33: FALSE-POSITIVE PREVENTION
// =====================================================

// TEST 30
test("30 - Does not flag stable monthly spending", () => {
  const transactions = [
    ...monthlyBaseline("Food", [
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10"
    ])
  ];

  const results = detect(transactions);

  assert.equal(results.length, 0);
});

// TEST 31

test("31 - Does not flag a reasonable increase below both thresholds", () => {
  const transactions = [
    ...monthlyBaseline("Shopping", [
      "2026-07",
      "2026-08",
      "2026-09"
    ]),
    expense(7, 1500, "2026-10-01", "Shopping"),
    expense(8, 1500, "2026-10-02", "Shopping")
  ];

  const results = detect(transactions);

  assert.equal(
    results.some(item =>
      item.id === "large-7" ||
      item.id === "large-8" ||
      item.id === "spike-Shopping-2026-10"
    ),
    false
  );
});

// TEST 32
test("32 - Does not flag different descriptions as duplicates", () => {
  const transactions = [
    expense(1, 5000, "2026-10-10", "Shopping", "Phone"),
    expense(2, 5000, "2026-10-10", "Shopping", "Laptop")
  ];

  const results = detect(transactions);

  assert.equal(
    results.some(item => item.id === "duplicate-2"),
    false
  );
});

// TEST 33
test("33 - Does not flag income and expense records as duplicate expenses", () => {
  const transactions = [
    expense(1, 5000, "2026-10-10", "Shopping", "Purchase"),
    {
      id: "2",
      type: "income",
      category: "Shopping",
      amount: 5000,
      description: "Purchase",
      date: "2026-10-10"
    }
  ];

  const results = detect(transactions);

  assert.equal(
    results.some(item => item.id === "duplicate-2"),
    false
  );
});

