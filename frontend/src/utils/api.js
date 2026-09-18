const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const getAccessToken = () => {
  return localStorage.getItem('budgetflow-access-token');
};

export const apiRequest = async (endpoint, options = {}) => {
  const token = getAccessToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data = null;

  try {
    data = await response.json();
  } catch (_error) {
    // Response has no JSON body
  }

  // JWT expired / invalid
  if (response.status === 401) {
    localStorage.removeItem('budgetflow-access-token');
    localStorage.removeItem('budgetflow-auth');

    // Store a temporary message for the login page
    sessionStorage.setItem(
      'budgetflow-session-expired',
      'Your session expired. Please log in again.'
    );

    // Avoid redirecting if we're already on the login page
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }

    throw new Error('Your session expired. Please log in again.');
  }

  if (!response.ok) {
    const message =
      data?.detail || `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data;
};

export const getCurrentUserFromAPI = () => {
  return apiRequest('/auth/me');
};

export const updateCurrentUser = (profile) => {
  return apiRequest('/auth/me', {
    method: 'PUT',
    body: JSON.stringify({
      name: profile.name,
    }),
  });
};

export const getTransactions = () => {
  return apiRequest('/transactions');
};

export const getBudgets = () => {
  return apiRequest('/budgets');
};

export const getExchangeRate = (base, target) => {
  return apiRequest(
    `/currency/rate?base=${encodeURIComponent(base)}&target=${encodeURIComponent(target)}`
  );
};

export const createBudget = (budget) => {
  return apiRequest('/budgets', {
    method: 'POST',
    body: JSON.stringify(budget),
  });
};

export const updateBudget = (budgetId, budget) => {
  return apiRequest(`/budgets/${budgetId}`, {
    method: 'PUT',
    body: JSON.stringify(budget),
  });
};

export const deleteBudget = (budgetId) => {
  return apiRequest(`/budgets/${budgetId}`, {
    method: 'DELETE',
  });
};

export const createTransaction = (transaction) => {
  return apiRequest('/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction),
  });
};

export const deleteTransaction = (transactionId) => {
  return apiRequest(`/transactions/${transactionId}`, {
    method: 'DELETE',
  });
};

export const updateTransaction = (transactionId, transaction) => {
  return apiRequest(`/transactions/${transactionId}`, {
    method: 'PUT',
    body: JSON.stringify(transaction),
  });
};