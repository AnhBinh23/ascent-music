import React from 'react';

const EmptyState = ({ title = 'Chưa có dữ liệu', subtitle = 'Thêm mới để bắt đầu', icon = '📭', action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 mb-5">{subtitle}</p>
      {action && action}
    </div>
  );
};

export default EmptyState;