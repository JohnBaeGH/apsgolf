
import React, { useRef, useEffect } from 'react';
import { DrawingGroup } from '../types';
import { Download, Share2, RotateCcw, Award, Trophy, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

declare const html2canvas: any;
declare const Kakao: any;

interface Props {
  results: DrawingGroup[];
  onReset: () => void;
}

const ResultView: React.FC<Props> = ({ results, onReset }) => {
  const resultRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  // 카카오 SDK 초기화 (본인의 JavaScript 키를 입력해야 합니다)
  useEffect(() => {
    if (typeof Kakao !== 'undefined' && !Kakao.isInitialized()) {
      // 여기에 카카오 개발자 센터에서 발급받은 JavaScript 키를 입력하세요.
      // 예: Kakao.init('YOUR_JS_KEY');
      try {
        // 실제 운영 환경에서는 환경 변수나 상수로 관리 권장
        // Kakao.init('887576576576576'); // Placeholder
      } catch (e) {
        console.error('Kakao initialization failed', e);
      }
    }
  }, []);

  const saveAsImage = async () => {
    if (!resultRef.current) return;
    
    const generateImage = async () => {
      const canvas = await (window as any).html2canvas(resultRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        scrollX: 0,
        scrollY: -window.scrollY,
      });
      
      const link = document.createElement('a');
      link.download = 'AP_Systems_Golf_Results.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    if (typeof (window as any).html2canvas === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      document.head.appendChild(script);
      script.onload = () => generateImage();
    } else {
      generateImage();
    }
  };

  const getSummaryText = () => {
    return `[AP시스템 임원 Golf 조편성 결과]\n\n` + 
      results.map(g => `${g.id}조: ${g.members.join(', ')}`).join('\n') +
      `\n\n일시: ${new Date().toLocaleDateString('ko-KR')}`;
  };

  const copyToClipboard = () => {
    const text = getSummaryText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareToKakao = () => {
    const summary = getSummaryText();

    if (typeof Kakao !== 'undefined' && Kakao.isInitialized()) {
      Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: 'AP시스템 임원 Golf 조편성 완료',
          description: summary,
          imageUrl: 'https://cdn-icons-png.flaticon.com/512/2611/2611138.png', // 골프 아이콘 (공용)
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href,
          },
        },
        buttons: [
          {
            title: '결과 확인하기',
            link: {
              mobileWebUrl: window.location.href,
              webUrl: window.location.href,
            },
          },
        ],
      });
    } else {
      // SDK가 준비되지 않았거나 키가 없는 경우 텍스트 복사로 대체 안내
      alert("카카오톡 SDK가 설정되지 않았습니다.\n\n[텍스트 복사] 기능을 사용하여 전달해 주세요.");
      copyToClipboard();
    }
  };

  const formatName = (name: string) => {
    if (name.endsWith('프로')) {
      return (
        <div className="flex flex-col leading-[1.1] items-center text-center">
          <span>{name.slice(0, -2)}</span>
          <span className="text-[0.6em] font-bold opacity-80 -mt-0.5 uppercase tracking-wider">프로</span>
        </div>
      );
    }
    return name;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <h2 className="text-3xl font-black text-[#004071] flex items-center gap-3">
          <Award className="text-[#ABC91A]" size={40} />
          조편성 완료
        </h2>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button 
            onClick={copyToClipboard}
            className="flex-1 md:flex-none bg-white border-2 border-[#004071] text-[#004071] px-6 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
            {copied ? '복사됨' : '결과 복사'}
          </button>
          <button 
            onClick={saveAsImage}
            className="flex-1 md:flex-none bg-[#004071] text-white px-6 py-4 rounded-2xl font-bold hover:bg-[#003056] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#004071]/20"
          >
            <Download size={20} />
            이미지 저장
          </button>
          <button 
            onClick={shareToKakao}
            className="flex-1 md:flex-none bg-[#FEE500] text-[#3c1e1e] px-6 py-4 rounded-2xl font-bold hover:bg-[#fada0a] transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-200/50"
          >
            <Share2 size={20} />
            카카오 공유
          </button>
        </div>
      </div>

      <div 
        ref={resultRef}
        className="bg-white p-12 md:p-16 rounded-[4rem] shadow-2xl border-2 border-gray-100 overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 p-12 opacity-[0.05] -rotate-12 pointer-events-none">
            <Trophy size={200} color="#004071" />
        </div>
        
        <div className="text-center mb-16 relative">
          <div className="flex flex-col items-center justify-center gap-6 mb-8">
            <img 
              src="logo_stacked.png" 
              alt="AP Systems Logo" 
              className="h-28 md:h-36 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-[#004071] text-4xl md:text-5xl font-black tracking-tight mb-4">AP시스템 임원 Golf 조편성</h1>
          <div className="inline-block px-8 py-2 bg-[#ABC91A] text-[#004071] font-black rounded-full text-sm tracking-widest uppercase">Official Matchups</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
          {results.map((group, idx) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-gray-50/50 border-2 border-gray-100 rounded-[3rem] p-10 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col items-center mb-6">
                <span className="text-[#ABC91A] font-black text-2xl mb-1 italic tracking-widest">Group {group.id}</span>
                <div className="h-1 w-12 bg-[#004071] rounded-full"></div>
              </div>
              <ul className="space-y-4 w-full text-center">
                {group.members.map((name, i) => (
                  <li key={i} className="text-[#004071] text-2xl font-black tracking-tight flex items-center justify-center gap-2">
                    {formatName(name)}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center text-gray-300 font-bold border-t border-gray-100 pt-10 flex flex-col items-center gap-2">
            <p className="text-xs uppercase tracking-[0.3em]">Official Tournament Record</p>
            <p className="text-gray-400">{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button
          onClick={onReset}
          className="bg-white border-2 border-gray-100 text-gray-400 px-10 py-4 rounded-full font-bold hover:text-[#004071] hover:border-[#004071] transition-all flex items-center gap-2 shadow-sm"
        >
          <RotateCcw size={20} />
          다시 추첨하기
        </button>
      </div>
    </div>
  );
};

export default ResultView;
