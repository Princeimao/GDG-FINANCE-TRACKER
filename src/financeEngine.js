// ===================================================
// AI Finance Engine — Core logic for parsing, 
// categorizing, and generating insights
// ===================================================

export const CATEGORIES = [
  "Food", "Transport", "Shopping", "Bills",
  "Entertainment", "Health", "Education", "Other"
];

// ---- Keyword maps ----
const MERCHANT_CATEGORY_MAP = {
  // Food
  zomato:       "Food", swiggy:      "Food", mcdonalds:   "Food",
  mcdonald:     "Food", kfc:         "Food", dominos:     "Food",
  pizza:        "Food", burger:      "Food", starbucks:   "Food",
  cafe:         "Food", restaurant:  "Food", food:        "Food",
  blinkit:      "Food", zepto:       "Food", instamart:   "Food",
  bigbasket:    "Food", grocery:     "Food", supermarket: "Food",
  // Transport
  uber:         "Transport", ola:         "Transport", rapido:  "Transport",
  metro:        "Transport", petrol:      "Transport", fuel:    "Transport",
  diesel:       "Transport", taxi:        "Transport", bus:     "Transport",
  train:        "Transport", flight:      "Transport", airline: "Transport",
  indigo:       "Transport", spicejet:    "Transport", airtel:  "Bills",
  // Shopping
  amazon:       "Shopping", flipkart:    "Shopping", myntra:      "Shopping",
  ajio:         "Shopping", nykaa:       "Shopping", meesho:      "Shopping",
  mall:         "Shopping", shop:        "Shopping", store:       "Shopping",
  // Bills
  electricity:  "Bills",   wifi:        "Bills",    internet:    "Bills",
  rent:         "Bills",   emi:         "Bills",    insurance:   "Bills",
  mobile:       "Bills",   recharge:    "Bills",    subscription:"Bills",
  netflix:      "Bills",   spotify:     "Bills",    hotstar:     "Bills",
  disney:       "Bills",   prime:       "Bills",    youtube:     "Bills",
  // Entertainment
  movie:        "Entertainment", cinema:   "Entertainment", pvr:    "Entertainment",
  inox:         "Entertainment", game:     "Entertainment", gaming: "Entertainment",
  concert:      "Entertainment", event:    "Entertainment",
  // Health
  pharmacy:     "Health",  doctor:   "Health", hospital: "Health",
  medicine:     "Health",  clinic:   "Health", gym:      "Health",
  fitness:      "Health",  apollo:   "Health", medplus:  "Health",
  // Education
  course:       "Education", udemy: "Education", coursera: "Education",
  school:       "Education", tutor: "Education", book:     "Education",
  college:      "Education", fee:   "Education",
};

function inferCategory(text) {
  const lower = text.toLowerCase();
  for (const [keyword, cat] of Object.entries(MERCHANT_CATEGORY_MAP)) {
    if (lower.includes(keyword)) return cat;
  }
  return "Other";
}

// ---- Number words to digits ----
const NUMBER_WORDS = {
  zero:0, one:1, two:2, three:3, four:4, five:5,
  six:6, seven:7, eight:8, nine:9, ten:10,
  eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15,
  sixteen:16, seventeen:17, eighteen:18, nineteen:19, twenty:20,
  thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90,
  hundred:100, thousand:1000, lakh:100000
};

function normalizeNumberWords(text) {
  // "two fifty" → "250", "five hundred" → "500"
  let t = text.toLowerCase();
  // Replace number words
  t = t.replace(/(\w+)\s+hundred(?:\s+and\s+(\w+))?/gi, (_, a, b) => {
    const h = (NUMBER_WORDS[a] || parseInt(a) || 0) * 100;
    const r = b ? (NUMBER_WORDS[b] || parseInt(b) || 0) : 0;
    return (h + r).toString();
  });
  t = t.replace(/(\w+)\s+thousand/gi, (_, a) => {
    return ((NUMBER_WORDS[a] || parseInt(a) || 0) * 1000).toString();
  });
  // "two fifty" → 250
  t = t.replace(/(\w+)\s+fifty/gi, (_, a) => {
    const d = NUMBER_WORDS[a];
    if (d !== undefined) return (d * 100 + 50).toString();
    return _;
  });
  // single word numbers
  for (const [w, n] of Object.entries(NUMBER_WORDS)) {
    t = t.replace(new RegExp(`\\b${w}\\b`, 'gi'), n.toString());
  }
  return t;
}

// ---- Fix common speech-to-text errors ----
const SPEECH_FIXES = {
  zomoto: "Zomato", swigi: "Swiggy", amazone: "Amazon",
  dominos: "Dominos", mcdonals: "McDonald's", fipkart: "Flipkart",
  ubar: "Uber", ola: "Ola", rapido: "Rapido",
};
function correctSpeech(text) {
  let t = text;
  for (const [wrong, right] of Object.entries(SPEECH_FIXES)) {
    t = t.replace(new RegExp(`\\b${wrong}\\b`, 'gi'), right);
  }
  return t;
}

// ---- Clean merchant name ----
function cleanMerchant(raw) {
  return raw
    .replace(/\b(pvt|ltd|llp|inc|corp|ref|txn|utr|neft|imps|rtgs|#\w+|\/\w+)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// ---- Parse expense patterns ----
const EXPENSE_PATTERNS = [
  // "spent 500 on food", "paid 1200 at zomato"
  /(?:spent|paid|spend|pay|bought|purchased)\s+(?:rs\.?|inr|₹)?\s*(\d[\d,]*(?:\.\d+)?)\s+(?:on|at|for|to|in)?\s*([a-z\s]+?)(?:\.|,|and|$)/gi,
  // "food 450", "zomato 350"
  /\b([a-z][a-z\s]{2,20})\s+(?:rs\.?|inr|₹)\s*(\d[\d,]*(?:\.\d+)?)/gi,
  // "₹450 at Zomato", "Rs 200 at cafe"
  /(?:rs\.?|inr|₹)\s*(\d[\d,]*(?:\.\d+)?)\s+(?:at|on|to|for)?\s*([a-z\s]+?)(?:\.|,|and|$)/gi,
  // "500 at zomato"
  /(\d[\d,]*(?:\.\d+)?)\s+(?:at|on|to|for|in)\s+([a-z\s]{2,25})(?:\.|,|and|\s|$)/gi,
];

export function parseExpensesFromText(rawInput) {
  if (!rawInput || !rawInput.trim()) return [];

  let text = correctSpeech(rawInput);
  text = normalizeNumberWords(text);

  const results = [];
  const seen = new Set();

  for (const pattern of EXPENSE_PATTERNS) {
    let match;
    let re = new RegExp(pattern.source, pattern.flags);
    while ((match = re.exec(text)) !== null) {
      let amountStr, merchantStr;
      // Some patterns have amount first, some merchant first
      const g1 = match[1]?.replace(/,/g, '').trim();
      const g2 = match[2]?.replace(/,/g, '').trim();
      const g1num = parseFloat(g1);

      if (!isNaN(g1num) && g1num > 0) {
        amountStr = g1num;
        merchantStr = g2;
      } else {
        amountStr = parseFloat(g2);
        merchantStr = g1;
      }

      if (!amountStr || isNaN(amountStr) || amountStr <= 0) continue;
      if (!merchantStr || merchantStr.trim().length < 2) continue;

      const amount = amountStr;
      const merchant = cleanMerchant(merchantStr);
      const key = `${amount}-${merchant.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const category = inferCategory(merchantStr);
      results.push({ amount, category, merchant, type: "expense" });
    }
  }

  // Fallback: simple "amount" extraction if nothing found
  if (results.length === 0) {
    const nums = text.match(/\b\d[\d,]*(?:\.\d+)?\b/g);
    if (nums) {
      for (const n of nums) {
        const amount = parseFloat(n.replace(/,/g, ''));
        if (amount > 0 && amount < 10000000) {
          results.push({ amount, category: "Other", merchant: "Unknown", type: "expense" });
        }
      }
    }
  }

  return results;
}

// ---- Parse raw bank data text ----
export function parseBankData(rawData) {
  const lines = rawData.split('\n').filter(l => l.trim());
  const results = [];

  const datePattern = /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}-\d{2}-\d{2})\b/;
  const amountPattern = /(?:rs\.?|inr|₹)?\s*(-?\d[\d,]*(?:\.\d{1,2})?)/i;

  for (const line of lines) {
    const dateMatch = line.match(datePattern);
    const amountMatch = line.match(amountPattern);
    if (!amountMatch) continue;

    let rawAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
    const type = rawAmount < 0 ? "expense" : "income";
    const amount = Math.abs(rawAmount);

    // Extract merchant: remove date, amount, common codes
    let merchant = line
      .replace(datePattern, '')
      .replace(amountPattern, '')
      .replace(/\b(cr|dr|neft|imps|upi|rtgs|transfer|ref|txn|ach|auto|debit|credit)\b/gi, '')
      .replace(/[\/\-_#|]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!merchant) merchant = type === "expense" ? "Debit" : "Credit";
    merchant = cleanMerchant(merchant.substring(0, 40));

    let dateStr = "2024-01-01";
    if (dateMatch) {
      try {
        const d = new Date(dateMatch[1].replace(/\//g, '-'));
        if (!isNaN(d)) dateStr = d.toISOString().split('T')[0];
      } catch (_) {}
    }

    const category = type === "income" ? "Other" : inferCategory(line);

    results.push({ date: dateStr, amount, category, merchant, type });
  }

  return results;
}

// ---- Financial Insights Engine ----
export function generateInsights(transactions) {
  if (!transactions || transactions.length === 0) return [];

  const expenses = transactions.filter(t => t.type === "expense");
  const total = expenses.reduce((s, t) => s + t.amount, 0);

  // Category breakdown
  const byCat = {};
  for (const t of expenses) {
    byCat[t.category] = (byCat[t.category] || 0) + t.amount;
  }
  const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  const insights = [];

  // Top spending category
  if (sorted.length > 0) {
    const [topCat, topAmt] = sorted[0];
    const pct = ((topAmt / total) * 100).toFixed(1);
    insights.push({
      type: topAmt / total > 0.4 ? "warning" : "info",
      icon: topAmt / total > 0.4 ? "⚠️" : "📊",
      title: `Top Spend: ${topCat}`,
      desc: `₹${topAmt.toLocaleString()} (${pct}% of total). ${
        topAmt / total > 0.4
          ? "This category is eating too much of your budget."
          : "Your spending here looks balanced."
      }`
    });
  }

  // Food spending
  const foodAmt = byCat["Food"] || 0;
  if (foodAmt > 0) {
    const foodPct = (foodAmt / total) * 100;
    if (foodPct > 35) {
      insights.push({
        type: "danger",
        icon: "🍕",
        title: "High Food Spending",
        desc: `You've spent ₹${foodAmt.toLocaleString()} on food (${foodPct.toFixed(0)}%). Consider cooking at home 2–3 days a week to save ₹${Math.round(foodAmt * 0.35).toLocaleString()}/mo.`
      });
    }
  }

  // Entertainment check
  const entAmt = byCat["Entertainment"] || 0;
  if (entAmt / total > 0.25) {
    insights.push({
      type: "warning",
      icon: "🎬",
      title: "Entertainment Overspend",
      desc: `Entertainment costs ₹${entAmt.toLocaleString()}. Review subscriptions and limit discretionary leisure.`
    });
  }

  // Shopping check
  const shopAmt = byCat["Shopping"] || 0;
  if (shopAmt > total * 0.3) {
    insights.push({
      type: "warning",
      icon: "🛍️",
      title: "Shopping Alert",
      desc: `Shopping is ${((shopAmt / total) * 100).toFixed(0)}% of spend. Apply the 24-hour rule before non-essential purchases.`
    });
  }

  // Savings tip
  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  if (income > 0) {
    const savingsRate = ((income - total) / income) * 100;
    if (savingsRate < 20) {
      insights.push({
        type: "danger",
        icon: "💰",
        title: "Low Savings Rate",
        desc: `Savings rate: ${savingsRate.toFixed(1)}%. Aim for 20%+. Target saving ₹${Math.round(income * 0.2).toLocaleString()}/month.`
      });
    } else {
      insights.push({
        type: "success",
        icon: "✅",
        title: "Healthy Savings",
        desc: `Great job! Your savings rate is ${savingsRate.toFixed(1)}%. Keep it up and invest the surplus.`
      });
    }
  }

  // Bills tip
  const billsAmt = byCat["Bills"] || 0;
  if (billsAmt > 0) {
    insights.push({
      type: "info",
      icon: "💡",
      title: "Bills Optimization",
      desc: `₹${billsAmt.toLocaleString()} on bills. Audit subscriptions — most people save ₹500–1500/mo by cancelling unused ones.`
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "success",
      icon: "🎉",
      title: "Looking Good!",
      desc: "Add more transactions to get personalized financial insights."
    });
  }

  return insights;
}

// ---- Budget limits per category ----
export const BUDGET_LIMITS = {
  Food:          5000,
  Transport:     3000,
  Shopping:      4000,
  Bills:         6000,
  Entertainment: 2000,
  Health:        2000,
  Education:     3000,
  Other:         2000,
};

export const CATEGORY_COLORS = {
  Food:          "#f59e0b",
  Transport:     "#3b82f6",
  Shopping:      "#ec4899",
  Bills:         "#ef4444",
  Entertainment: "#8b5cf6",
  Health:        "#00d68f",
  Education:     "#06b6d4",
  Other:         "#64748b",
};

export const CATEGORY_ICONS = {
  Food:          "🍔",
  Transport:     "🚗",
  Shopping:      "🛍️",
  Bills:         "📋",
  Entertainment: "🎬",
  Health:        "💊",
  Education:     "📚",
  Other:         "📦",
};
