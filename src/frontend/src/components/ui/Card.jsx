import React from 'react';

export const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
};
