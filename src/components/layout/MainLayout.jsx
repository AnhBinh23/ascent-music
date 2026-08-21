import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useApp } from '../../context/AppContext';

const MainLayout = ({ children, title }) => {
  const { sidebarOpen, toggleSidebar } = useApp();


  return (
    <div
      className="flex bg-gray-50 overflow-hidden"
      style={{ height: '100dvh' }}

    >
      {/* Sidebar — desktop */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Sidebar — mobile slide in */}
      <div className={`
        fixed inset-y-0 left-0 z-50 md:hidden
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar />
      </div>

      {/* Overlay khi sidebar mở */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={title} />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-4 md:p-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;