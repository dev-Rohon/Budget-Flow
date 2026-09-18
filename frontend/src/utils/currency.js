const STORAGE_KEY = 'budgetflow-currency';
const DEFAULT_CURRENCY = 'INR';

const currencyConfig = {
  INR: { locale: 'en-IN', code: 'INR', symbol: '₹' },
  USD: { locale: 'en-US', code: 'USD', symbol: '$' },
  EUR: { locale: 'en-IE', code: 'EUR', symbol: '€' },
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// Cache exchange rates in memory for 1 hour.
const RATE_CACHE_DURATION = 60 * 60 * 1000;

const exchangeRateCache = new Map();

export const getSelectedCurrency = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored && currencyConfig[stored]) {
      return stored;
    }
  } catch (e) {
    // ignore
  }

  return DEFAULT_CURRENCY;
};

export const formatCurrency = (
  value,
  currency = getSelectedCurrency()
) => {
  const config =
    currencyConfig[currency] || currencyConfig[DEFAULT_CURRENCY];

  const n = Number(value) || 0;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
};

export const formatCurrencyWithSign = (
  value,
  type,
  currency = getSelectedCurrency()
) => {
  const absValue = Math.abs(Number(value) || 0);

  return `${type === 'income' ? '+' : '-'}${formatCurrency(
    absValue,
    currency
  )}`;
};

export const getCurrencySymbol = (
  currency = getSelectedCurrency()
) => {
  return (
    currencyConfig[currency]?.symbol ||
    currencyConfig[DEFAULT_CURRENCY].symbol
  );
};

export const getCurrencyLabel = (
  currency = getSelectedCurrency()
) => {
  const symbol = getCurrencySymbol(currency);
  return `${currency} (${symbol})`;
};

export const getCurrencyStorageKey = () => STORAGE_KEY;


/*
 * Fetch exchange rate from BudgetFlow backend.
 *
 * Rates are cached for 1 hour so navigating between pages
 * does not repeatedly call the backend.
 */
export const getExchangeRate = async (
  base = DEFAULT_CURRENCY,
  target = getSelectedCurrency()
) => {
  base = base.toUpperCase();
  target = target.toUpperCase();

  if (base === target) {
    return 1;
  }

  const cacheKey = `${base}_${target}`;
  const cached = exchangeRateCache.get(cacheKey);

  // Use cached rate if it is still valid.
  if (cached && Date.now() - cached.timestamp < RATE_CACHE_DURATION) {
    return cached.rate;
  }

  const response = await fetch(
    `${API_BASE_URL}/currency/rate?base=${encodeURIComponent(
      base
    )}&target=${encodeURIComponent(target)}`
  );

  if (!response.ok) {
    throw new Error('Unable to fetch exchange rate');
  }

  const data = await response.json();
  const rate = Number(data.rate);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('Invalid exchange rate received');
  }

  // Store the rate in memory.
  exchangeRateCache.set(cacheKey, {
    rate,
    timestamp: Date.now(),
  });

  return rate;
};


/*
 * Convert an amount from one currency to another.
 */
export const convertCurrency = async (
  amount,
  base = DEFAULT_CURRENCY,
  target = getSelectedCurrency()
) => {
  const numericAmount = Number(amount) || 0;

  const rate = await getExchangeRate(base, target);

  return numericAmount * rate;
};


/*
 * Convert and format an amount for display.
 */
export const formatConvertedCurrency = async (
  amount,
  base = DEFAULT_CURRENCY,
  target = getSelectedCurrency()
) => {
  const convertedAmount = await convertCurrency(
    amount,
    base,
    target
  );

  return formatCurrency(convertedAmount, target);
};