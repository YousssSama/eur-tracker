// Currency configuration
export const CURRENCIES = {
  IDR: {
    code: "IDR",
    name: "Roupie indonésienne",
    flag: "🇮🇩",
    decimals: 0,
    short: "Rp",
  },
  MYR: {
    code: "MYR",
    name: "Ringgit malaisien",
    flag: "🇲🇾",
    decimals: 2,
    short: "RM",
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
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
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
  const url = `https://api.frankfurter.app/${start}..${today}?from=EUR&to=${currency}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("API error");
  const json = await res.json();

  return Object.entries(json.rates)
    .map(([date, val]) => ({ date, rate: val[currency] }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// API: fetch live rate (latest available)
export async function fetchLatest(currency) {
  const url = `https://api.frankfurter.app/latest?from=EUR&to=${currency}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("API error");
  const json = await res.json();
  return json.rates[currency];
}
