const AUTH_KEY = 'budgetflow-auth';
const CURRENT_USER_KEY = 'budgetflow-user';
const LEGACY_USER_KEY = CURRENT_USER_KEY;
const USERS_KEY = 'budgetflow-users';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const getScopedSuffix = (email) => {
  const normalized = normalizeEmail(email);
  return normalized ? `-${encodeURIComponent(normalized)}` : '';
};

const getStoredUsers = () => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_e) {
    return {};
  }
};

const saveStoredUsers = (users) => {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (_e) {
    // ignore storage errors
  }
};

export const isAuthenticated = () => {
  try {
    return localStorage.getItem(AUTH_KEY) === 'true';
  } catch (_e) {
    return false;
  }
};

const parseUser = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.email) return parsed;
  } catch (_e) {
    // ignore
  }
  return null;
};

export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    const user = parseUser(raw);
    if (user) return user;

    const legacyRaw = localStorage.getItem(LEGACY_USER_KEY);
    const legacyUser = parseUser(legacyRaw);
    if (legacyUser && legacyUser.email) {
      return setCurrentUser(legacyUser);
    }

    return null;
  } catch (_e) {
    return null;
  }
};

export const getCurrentUserEmail = () => normalizeEmail(getCurrentUser()?.email);

export const getScopedStorageKey = (baseKey, email) => {
  const normalizedEmail = normalizeEmail(email || getCurrentUserEmail());
  return `${baseKey}${getScopedSuffix(normalizedEmail)}`;
};

export const loadUserByEmail = (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const users = getStoredUsers();
  if (users[normalized]) return users[normalized];

  const current = getCurrentUser();
  if (current && normalizeEmail(current.email) === normalized) {
    return current;
  }

  return null;
};

export const setCurrentUser = (profile) => {
  if (!profile || !profile.email) return null;

  const normalizedEmail = normalizeEmail(profile.email);
  const user = {
  name: profile.name?.trim() || normalizedEmail.split('@')[0],
  email: normalizedEmail,
  profilePicture: profile.profilePicture || null,
};

  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(user));
    const users = getStoredUsers();
    users[normalizedEmail] = user;
    saveStoredUsers(users);
  } catch (_e) {
    // ignore storage errors
  }

  return user;
};

export const signInUser = (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const existing = loadUserByEmail(normalizedEmail);
  const user = existing || {
    name: normalizedEmail.split('@')[0],
    email: normalizedEmail,
  };

  const current = setCurrentUser(user);
  try {
    localStorage.setItem(AUTH_KEY, 'true');
  } catch (_e) {
    // ignore storage errors
  }

  return current;
};

export const signUpUser = ({ name, email }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const user = setCurrentUser({
    name: name?.trim() || normalizedEmail.split('@')[0],
    email: normalizedEmail,
  });

  try {
    localStorage.setItem(AUTH_KEY, 'true');
  } catch (_e) {
    // ignore storage errors
  }

  return user;
};

export const signOutUser = () => {
  try {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
  } catch (_e) {
    // ignore storage errors
  }
};
