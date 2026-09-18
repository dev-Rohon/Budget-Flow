export const AUTO_RESET_KEY = 'budgetflow-auto-reset';

export function getCurrentMonthString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthStringForDate(value) {
  const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(
        Number(value.slice(0, 4)),
        Number(value.slice(5, 7)) - 1,
        Number(value.slice(8, 10))
      )
    : new Date(value);

  return Number.isNaN(date.getTime()) ? null : getCurrentMonthString(date);
}

export function isDateInCurrentMonth(value, date = new Date()) {
  return getMonthStringForDate(value) === getCurrentMonthString(date);
}

export function isAutoResetEnabled(autoResetKey = AUTO_RESET_KEY) {
  try {
    return localStorage.getItem(autoResetKey) === 'true';
  } catch (e) {
    return false;
  }
}

export function setAutoResetEnabled(enabled, autoResetKey = AUTO_RESET_KEY) {
  try {
    localStorage.setItem(autoResetKey, enabled ? 'true' : 'false');
  } catch (e) {
    // ignore
  }
}
