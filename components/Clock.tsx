import React, { useState, useEffect } from 'react';

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="font-mono text-sky-300 bg-sky-900/30 px-3 py-1 rounded-md border border-sky-500/30 text-sm">
      <span>LOCAL: {formatTime(time)}</span>
      <span className="mx-2 text-sky-600">|</span>
      <span>UTC: {time.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour12: false })}</span>
    </div>
  );
};

export default Clock;