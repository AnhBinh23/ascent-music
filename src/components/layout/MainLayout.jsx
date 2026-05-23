import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';

const MainLayout = ({ children, title }) => {
  return (
    <div
      className="flex bg-gray-50 overflow-hidden"
      style={{ height: '100dvh' }}
    >
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

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

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  );
};

export default MainLayout;