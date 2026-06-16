import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, getToken, clearToken } from '@/api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,                    setUser]                    = useState(null);
  const [isAuthenticated,         setIsAuthenticated]         = useState(false);
  const [isLoadingAuth,           setIsLoadingAuth]           = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);

  useEffect(() => { checkUserAuth(); }, []);

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    if (!getToken()) {
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      return;
    }
    try {
      const me = await auth.me();
      setUser(me);
      setIsAuthenticated(true);
    } catch {
      clearToken();
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = "/user/login";
  };

  const navigateToLogin = () => { window.location.href = "/user/login"; };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError: null,
      appPublicSettings: null,
      authChecked: !isLoadingAuth,
      logout,
      navigateToLogin,
      checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
