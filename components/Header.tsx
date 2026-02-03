
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white text-[#004071] py-4 shadow-md border-b-4 border-[#ABC91A]">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            {/* Horizontal CI Logo */}
            <img 
              src="logo_horizontal.png" 
              alt="AP Systems Logo" 
              className="h-10 md:h-12 w-auto object-contain"
              onError={(e) => {
                // Fallback if image not found
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-2xl font-black text-[#004071]">AP Systems</span>';
              }}
            />
          </div>
        </div>
        <div className="text-center md:text-right">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#004071]">
            AP시스템 임원 Golf 조편성 추첨기
          </h1>
          <p className="text-[#ABC91A] font-semibold text-xs md:text-sm uppercase tracking-wider">
            Executive Golf Tournament
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
