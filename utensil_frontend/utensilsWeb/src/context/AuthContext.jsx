import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Check if a user is already logged in when the app loads
    const savedUser = localStorage.getItem('utensilUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Automatically derive the role from the user object
  const role = user ? user.role.toLowerCase() : 'guest';

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('utensilUser', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('utensilUser');
    // Optional: Also clear the cart on logout!
    localStorage.removeItem('utensilCart');
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};