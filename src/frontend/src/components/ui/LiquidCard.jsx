import React from 'react';

const LiquidCard = ({ category, title, price, imageSrc, onAdd }) => {
  return (
    <div className="liquid-card p-4 flex flex-col gap-4">
      <div className="h-40 bg-black flex items-center justify-center border border-gray-800">
        {imageSrc ? <img src={imageSrc} alt={title} className="max-h-full max-w-full object-contain opacity-80 hover:opacity-100" /> : <span>NO_IMG</span>}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-gray-500">{category}</span>
        <h3 className="text-sm font-bold text-white uppercase">{title}</h3>
        <span className="text-cyan-400 font-bold mt-2">{price}</span>
      </div>
      <button 
        onClick={onAdd}
        className="mt-2 border border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black py-1 text-xs uppercase font-bold"
      >
        [ ADD_TO_CART ]
      </button>
    </div>
  );
};

export default LiquidCard;
