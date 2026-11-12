import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserRole } from '../types';

interface AuthContextType {
  role: UserRole;
  userName: string;
  userId: string;
  department: string;
  setRole: (role: UserRole) => void;
  switchRole: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('infrasync_user_role');
    return (saved as UserRole) || 'field_worker';
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('infrasync_user_role', newRole);
  };

  const switchRole = () => {
    setRole(role === 'field_worker' ? 'coordinator' : 'field_worker');
  };

  const userName = role === 'field_worker' ? 'Elena Rostova' : 'David Miller';
  const userId = role === 'field_worker' ? 'FW-8492' : 'COORD-104';
  const department = role === 'field_worker' ? 'Field Operations Unit' : 'Regional Infrastructure Coordination';

  return (
    <AuthContext.Provider
      value={{
        role,
        userName,
        userId,
        department,
        setRole,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
