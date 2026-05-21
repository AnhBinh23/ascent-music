import React from 'react';

const Loading = ({ fullScreen = false, text = 'Đang tải...' }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-500 text-sm">{text}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-3" />
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
};

export default Loading;