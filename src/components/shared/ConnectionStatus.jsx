import React from 'react';
import { useSocket } from '../../context/SocketContext';

const ConnectionStatus = () => {
  const { connected } = useSocket();

  return (
    <div className="flex items-center gap-1.5" title={connected ? 'Đang kết nối real-time' : 'Mất kết nối real-time'}>
      <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
      <span className="text-xs text-gray-500 hidden sm:inline">
        {connected ? 'Live' : 'Offline'}
      </span>
    </div>
  );
};

export default ConnectionStatus;