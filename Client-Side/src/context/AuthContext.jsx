import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AuthContext = createContext();

// ---------------------------------------------------------------------------
// Fully client-side "fake" authentication.
// No backend, no database — everything lives in the browser's localStorage.
// NOTE: This is for local development / demo purposes only. Passwords are
// stored in plain text in localStorage, which is NOT secure and should
// never be used for a real production app.
// ---------------------------------------------------------------------------

const USERS_KEY = "dms_users";
const SESSION_KEY = "dms_session";

const DEFAULT_ADMIN = {
  Firstname: "Admin",
  Lastname: "User",
  email: "admin@gmail.com",
  password: "password@123",
  role: "ADMIN",
};

const readUsers = () => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const seedDefaultAdmin = () => {
  const users = readUsers();
  const exists = users.some(
    (u) => u.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase()
  );
  if (!exists) {
    users.push({ ...DEFAULT_ADMIN });
    writeUsers(users);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load: seed the default admin, then restore any existing session.
  useEffect(() => {
    seedDefaultAdmin();

    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    const users = readUsers();
    const match = users.find(
      (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
    );

    if (!match) {
      toast.error("Invalid Credentials");
      return false;
    }

    const sessionUser = {
      id: match.email,
      Firstname: match.Firstname,
      Lastname: match.Lastname,
      email: match.email,
      role: match.role,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    toast.success("Login successful!");
    return true;
  };

  const signup = async ({ Firstname, Lastname, email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const users = readUsers();

    const exists = users.some((u) => u.email.toLowerCase() === normalizedEmail);
    if (exists) {
      toast.error("User already exists");
      return false;
    }

    const newUser = {
      Firstname,
      Lastname,
      email: normalizedEmail,
      password,
      role: "USER",
    };

    users.push(newUser);
    writeUsers(users);

    const sessionUser = {
      id: newUser.email,
      Firstname: newUser.Firstname,
      Lastname: newUser.Lastname,
      email: newUser.email,
      role: newUser.role,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);

    toast.success("Account created!");
    return true;
  };

  const logout = async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
