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
  } catch (_error) {}

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    if (typeof data?.detail === 'string') {
      message = data.detail;
    } else if (Array.isArray(data?.detail)) {
      message = data.detail
        .map((item) => {
          if (typeof item === 'string') return item;
          return item?.msg || item?.message || JSON.stringify(item);
        })
        .join(', ');
    } else if (data?.detail && typeof data.detail === 'object') {
      message =
        data.detail.message ||
        data.detail.msg ||
        data.detail.error ||
        JSON.stringify(data.detail);
    } else if (typeof data?.message === 'string') {
      message = data.message;
    }

    // Only treat a 401 as an expired session for protected requests.
    // Login/signup/OTP/password-reset requests can legitimately return 401.
    const isProtectedRequest =
      !endpoint.startsWith('/auth/login') &&
      !endpoint.startsWith('/auth/signup') &&
      !endpoint.startsWith('/auth/verify-otp') &&
      !endpoint.startsWith('/auth/verify-login-otp') &&
      !endpoint.startsWith('/auth/resend-otp') &&
      !endpoint.startsWith('/auth/resend-login-otp') &&
      !endpoint.startsWith('/auth/forgot-password') &&
      !endpoint.startsWith('/auth/verify-reset-otp') &&
      !endpoint.startsWith('/auth/reset-password');

    if (response.status === 401 && token && isProtectedRequest) {
      localStorage.removeItem('budgetflow-access-token');
      localStorage.removeItem('budgetflow-auth');

      sessionStorage.setItem(
        'budgetflow-session-expired',
        'Your session expired. Please log in again.'
      );

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }

      throw new Error('Your session expired. Please log in again.');
    }

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