import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import { useApp } from '../../context/AppContext';

const MainLayout = ({ children, title }) => {
  const { sidebarOpen } = useApp();

  return (
    <div
      className="flex bg-gray-50 overflow-hidden"
      style={{ height: '100dvh' }}
    >
      {/* Sidebar — desktop */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Sidebar — mobile overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-30 md:hidden"
            onClick={() => {}} 
          />
          <div className="fixed inset-0 z-40 md:hidden">
            <Sidebar />
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={title} />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6"
        >
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile */}
      <BottomNav />
    </div>
  );
};

export default MainLayout;