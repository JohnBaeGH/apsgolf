import React from 'react';
import { History } from 'lucide-react';

interface Props {
  onViewHistory: () => void;
}

const Header: React.FC<Props> = ({ onViewHistory }) => {
  return (
    <header className="bg-white text-[#004071] py-4 shadow-md border-b-4 border-[#ABC91A]">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onViewHistory}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2 font-bold text-sm"
            title="기록 보기"
          >
            <History size={20} />
            <span className="hidden md:inline">기록 보기</span>
          </button>
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
