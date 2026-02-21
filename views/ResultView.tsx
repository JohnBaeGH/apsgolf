
import React, { useRef, useEffect, useState } from 'react';
import { DrawingGroup, ScoreEntry, MatchRecord } from '../types';
import { Download, Share2, RotateCcw, Award, Trophy, Copy, Check, Save, Edit2, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

declare const html2canvas: any;
declare const Kakao: any;

interface Props {
  results: DrawingGroup[];
  history: MatchRecord[];
  onReset: () => void;
  onSave: (groupsWithScores: (DrawingGroup & { scores: ScoreEntry[] })[], golfCourse?: string) => void;
}

const ResultView: React.FC<Props> = ({ results, history, onReset, onSave }) => {
  const resultRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [golfCourse, setGolfCourse] = useState('');
  const [editableGroups, setEditableGroups] = useState<DrawingGroup[]>(results);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ groupId: number, name: string } | null>(null);

  useEffect(() => {
    setEditableGroups(results);
  }, [results]);

  // Calculate Current Match Rankings (based on input scores)
  const currentMatchRankings = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .map(([name, score]) => ({
      name,
      score,
      avgScore: score.toString() // For display consistency
    }))
    .sort((a, b) => a.score - b.score);

  const rankingsWithTies = currentMatchRankings.map((player, idx, arr) => {
    let rank = idx + 1;
    if (idx > 0 && player.score === arr[idx - 1].score) {
      let firstTieIdx = idx - 1;
      while (firstTieIdx >= 0 && arr[firstTieIdx].score === player.score) firstTieIdx--;
      rank = firstTieIdx + 2;
    }
    return { ...player, rank };
  });

  // 카카오 SDK 초기화
  useEffect(() => {
    if (typeof Kakao !== 'undefined' && !Kakao.isInitialized()) {
      try {
        // Kakao.init('YOUR_JS_KEY');
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
    const courseText = golfCourse ? `\n장소: ${golfCourse}` : '';
    const groupText = editableGroups.map(g => `${g.id}조: ${g.members.join(', ')}`).join('\n');

    let hallOfFameText = '';
    if (rankingsWithTies.length > 0) {
      hallOfFameText = `\n\n[금일 경기 순위 TOP 3]\n` +
        rankingsWithTies.slice(0, 3).map((p: any) => `${p.rank}위 ${p.name} (${p.score}타)`).join('\n');
    }

    return `[AP시스템 임원 Golf 조편성 결과]${courseText}\n\n${groupText}${hallOfFameText}\n\n일시: ${new Date().toLocaleDateString('ko-KR')}`;
  };

  const copyToClipboard = () => {
    const text = getSummaryText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleScoreChange = (memberName: string, value: string) => {
    const numValue = parseInt(value);
    setScores(prev => ({
      ...prev,
      [memberName]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleSaveMatch = () => {
    const resultsWithScores = editableGroups.map(group => ({
      ...group,
      scores: group.members.map(name => ({
        memberName: name,
        score: scores[name] || 0
      }))
    }));
    onSave(resultsWithScores, golfCourse);
  };

  const handleMemberClick = (groupId: number, name: string) => {
    if (!isEditMode) return;

    if (!selectedMember) {
      setSelectedMember({ groupId, name });
    } else {
      if (selectedMember.name === name) {
        setSelectedMember(null);
        return;
      }

      const newGroups = [...editableGroups];
      const group1 = newGroups.find(g => g.id === selectedMember.groupId);
      const group2 = newGroups.find(g => g.id === groupId);

      if (group1 && group2) {
        const idx1 = group1.members.indexOf(selectedMember.name);
        const idx2 = group2.members.indexOf(name);

        const temp = group1.members[idx1];
        group1.members[idx1] = group2.members[idx2];
        group2.members[idx2] = temp;

        setEditableGroups(newGroups);
      }
      setSelectedMember(null);
    }
  };

  const shareToKakao = () => {
    const summary = getSummaryText();

    if (typeof Kakao !== 'undefined' && Kakao.isInitialized()) {
      Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: 'AP시스템 임원 Golf 조편성 완료',
          description: summary,
          imageUrl: 'https://cdn-icons-png.flaticon.com/512/2611/2611138.png',
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
      alert("카카오톡 SDK가 설정되지 않았습니다.\n\n[텍스트 복사] 기능을 사용하여 전달해 주세요.");
      copyToClipboard();
    }
  };

  const formatName = (name: string) => {
    if (name.endsWith('프로')) {
      return (
        <div className="flex flex-col leading-[1.1] items-center text-left">
          <span>{name.slice(0, -2)}</span>
          <span className="text-[0.6em] font-bold opacity-80 -mt-0.5 uppercase tracking-wider">프로</span>
        </div>
      );
    }
    return name;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <h2 className="text-3xl font-black text-[#004071] flex items-center gap-3">
          <Award className="text-[#ABC91A]" size={40} />
          조편성 완료
        </h2>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex-1 md:flex-none px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border-2 ${isEditMode
              ? 'bg-[#ABC91A] border-[#ABC91A] text-[#004071]'
              : 'bg-white border-gray-200 text-gray-500 hover:border-[#ABC91A] hover:text-[#ABC91A]'
              }`}
          >
            {isEditMode ? <Check size={20} /> : <Edit2 size={20} />}
            {isEditMode ? '편집 완료' : '조 수동 수정'}
          </button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center gap-3 text-[#004071]">
            <Trophy size={24} className="text-[#ABC91A]" />
            <h3 className="font-black text-xl">골프장 정보</h3>
          </div>
          <input
            type="text"
            placeholder="골프장 이름을 입력하세요 (예: 잭니클라우스 CC)"
            value={golfCourse}
            onChange={(e) => setGolfCourse(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-[#ABC91A] focus:outline-none transition-colors font-bold text-[#004071] bg-gray-50/30"
          />
        </div>

        <div className="bg-[#E9ECEF] p-6 rounded-3xl border-2 border-[#DEE2E6] flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-[#004071] font-black text-xl mb-1">경기 결과 저장</h3>
            <p className="text-gray-600 font-medium">플레이 종료 후 점수를 입력하고 이력에 남기세요.</p>
          </div>
          <button
            onClick={handleSaveMatch}
            className="w-full bg-[#ABC91A] text-[#004071] px-8 py-4 rounded-2xl font-black text-lg hover:bg-[#99b418] transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#ABC91A]/20"
          >
            <Save size={24} />
            기록 저장하기
          </button>
        </div>
      </div>

      {isEditMode && (
        <div className="bg-blue-50 border-2 border-blue-100 p-6 rounded-3xl flex items-center gap-4 animate-bounce-subtle">
          <div className="bg-blue-500 text-white p-2 rounded-full">
            <RefreshCw size={20} />
          </div>
          <p className="text-blue-800 font-bold">
            {selectedMember
              ? <><span className="font-black underline">{selectedMember.name}</span>님과 교체할 멤버를 선택하세요.</>
              : "교체할 멤버 두 명을 차례대로 클릭하여 위치를 변경할 수 있습니다."
            }
          </p>
          <button
            onClick={() => setIsEditMode(false)}
            className="ml-auto text-blue-400 hover:text-blue-600 font-bold"
          >
            <X size={20} />
          </button>
        </div>
      )}

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
          <h1 className="text-[#004071] text-4xl md:text-5xl font-black tracking-tight mb-2">AP시스템 임원 Golf 조편성</h1>
          {golfCourse && <p className="text-[#ABC91A] text-2xl font-black mb-4 italic">@ {golfCourse}</p>}
          <div className="inline-block px-8 py-2 bg-[#ABC91A] text-[#004071] font-black rounded-full text-sm tracking-widest uppercase">Official Matchups</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
          {editableGroups.map((group, idx) => (
            <motion.div
              key={group.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`bg-gray-50/50 border-2 rounded-[3rem] p-8 flex flex-col items-center shadow-sm hover:shadow-md transition-all ${isEditMode ? 'border-blue-200' : 'border-gray-100'
                }`}
            >
              <div className="flex flex-col items-center mb-8">
                <span className="text-[#ABC91A] font-black text-2xl mb-1 italic tracking-widest">Group {group.id}</span>
                <div className="h-1 w-12 bg-[#004071] rounded-full"></div>
              </div>
              <ul className="space-y-4 w-full">
                {group.members.map((name, i) => (
                  <li key={i} className="flex flex-col gap-2">
                    <button
                      disabled={!isEditMode}
                      onClick={() => handleMemberClick(group.id, name)}
                      className={`flex items-center justify-between gap-4 w-full text-left p-3 rounded-2xl transition-all ${isEditMode
                        ? selectedMember?.name === name
                          ? 'bg-blue-500 text-white shadow-lg scale-105'
                          : 'bg-white hover:bg-blue-50 border-2 border-transparent hover:border-blue-200'
                        : ''
                        }`}
                    >
                      <span className={`text-xl font-black tracking-tight flex-grow ${isEditMode && selectedMember?.name === name ? 'text-white' : 'text-[#004071]'
                        }`}>
                        {formatName(name)}
                      </span>
                      {!isEditMode && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="점수"
                            value={scores[name] || ''}
                            onChange={(e) => handleScoreChange(name, e.target.value)}
                            className="w-16 bg-white border-2 border-gray-200 rounded-xl px-2 py-1 text-center font-bold text-[#004071] focus:border-[#ABC91A] focus:outline-none transition-colors text-sm"
                          />
                          <span className="text-gray-400 font-bold text-xs">타</span>
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Integrated Match Standings */}
        {rankingsWithTies.length > 0 && (
          <div className="border-t-4 border-dashed border-gray-100 pt-16 relative">
            <div className="flex items-center justify-center gap-3 mb-10">
              <Trophy className="text-[#ABC91A]" size={32} />
              <h3 className="text-3xl font-black text-[#004071]">금일 경기 순위</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {rankingsWithTies.map((player: any) => (
                <div key={player.name} className="bg-gray-50/50 p-4 rounded-3xl border-2 border-gray-100 flex flex-col items-center gap-1">
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${player.rank === 1 ? 'bg-yellow-400 text-white' : 'bg-[#004071] text-white'}`}>
                    {player.rank}위
                  </span>
                  <span className="font-black text-[#004071] truncate w-full text-center">{player.name}</span>
                  <span className="text-[#ABC91A] font-black text-lg">{player.score}<span className="text-[10px]">타</span></span>
                </div>
              ))}
            </div>
          </div>
        )}

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
          재추첨 (초기화)
        </button>
      </div>
    </div>
  );
};

export default ResultView;
