// Currency configuration
export const CURRENCIES = {
  IDR: {
    code: "IDR",
    name: "Roupie indonésienne",
    decimals: 0,
    short: "Rp",
  },
  MYR: {
    code: "MYR",
    name: "Ringgit malaisien",
    decimals: 2,
    short: "RM",
  },
  SEK: {
    code: "SEK",
    name: "Couronne suédoise",
    decimals: 2,
    short: "kr",
  },
  CAD: {
    code: "CAD",
    name: "Dollar canadien",
    decimals: 2,
    short: "C$",
  },
};

export const PERIODS = [
  { label: "1 mois", days: 30 },
  { label: "3 mois", days: 90 },
  { label: "6 mois", days: 180 },
  { label: "1 an", days: 365 },
];

// Date helpers
export function getDateBefore(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

export function formatDate(str) {
  const d = new Date(str);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Compact axis label, adapted to the period length
export function formatAxisDate(str, days) {
  const d = new Date(str);
  if (days <= 31) {
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }
  if (days <= 180) {
    const month = d.toLocaleDateString("fr-FR", { month: "short" });
    const yy = String(d.getFullYear()).slice(-2);
    return `${month} ${yy}`;
  }
  const month = d.toLocaleDateString("fr-FR", { month: "short" });
  const yy = String(d.getFullYear()).slice(-2);
  return `${month} ${yy}`;
}

// Number formatting per currency
export function formatRate(rate, currency = "IDR") {
  if (rate == null || isNaN(rate)) return "—";
  const cfg = CURRENCIES[currency];
  return rate.toLocaleString("fr-FR", {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  });
}

export function formatEur(amount) {
  if (amount == null || isNaN(amount)) return "—";
  return amount.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// API: fetch historical rates from Frankfurter (BCE)
export async function fetchHistory(currency, days) {
  const start = getDateBefore(days);
  const today = new Date().toISOString().split("T")[0];
  const url = `https://api.frankfurter.dev/v1/${start}..${today}?from=EUR&to=${currency}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("API error");
  const json = await res.json();

  return Object.entries(json.rates)
    .map(([date, val]) => ({ date, rate: val[currency] }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// API: fetch live rate (latest available)
export async function fetchLatest(currency) {
  const url = `https://api.frankfurter.dev/v1/latest?from=EUR&to=${currency}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("API error");
  const json = await res.json();
  return json.rates[currency];
}
