import React from 'react';

const NeonButton = ({ children, onClick, variant = 'primary', disabled = false, fullWidth = false, className = '' }) => {
  const styles = {
    primary: 'border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black',
    secondary: 'border border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white',
    danger: 'border border-red-600 text-red-600 hover:bg-red-600 hover:text-white'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 font-mono uppercase font-bold transition-all ${styles[variant]} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {children}
    </button>
  );
};

export default NeonButton;
