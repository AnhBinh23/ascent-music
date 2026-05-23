import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const addNotification = (notif) => {
    const newNotif = {
      id: Date.now(),
      time: new Date().toISOString(),
      read: false,
      ...notif,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider value={{
      sidebarOpen,
      toggleSidebar,
      notifications,
      unreadCount,
      addNotification,
      markAllRead,
      removeNotification,
      globalLoading,
      setGlobalLoading,
      darkMode,
      toggleDarkMode,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp phải dùng trong AppProvider');
  return context;
};

export default AppContext;