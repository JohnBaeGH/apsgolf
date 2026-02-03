
import React, { useState, useEffect, useCallback } from 'react';
import { DrawingGroup } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Trophy, ArrowRight } from 'lucide-react';

interface Props {
  memberNames: string[];
  groupSizes: number[];
  onComplete: (results: DrawingGroup[]) => void;
}

const DrawingView: React.FC<Props> = ({ memberNames, groupSizes, onComplete }) => {
  const [remainingPool, setRemainingPool] = useState<string[]>([...memberNames]);
  const [completedGroups, setCompletedGroups] = useState<DrawingGroup[]>([]);
  const [pendingGroup, setPendingGroup] = useState<DrawingGroup | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentGroupSlots, setCurrentGroupSlots] = useState<(string | null)[]>([]);

  const totalGroups = groupSizes.length;
  const groupsDrawnCount = completedGroups.length + (pendingGroup ? 1 : 0);
  const nextToDrawIdx = groupsDrawnCount < totalGroups ? groupsDrawnCount : -1;

  useEffect(() => {
    if (!pendingGroup && !isAnimating && nextToDrawIdx !== -1) {
      setCurrentGroupSlots(new Array(groupSizes[nextToDrawIdx]).fill(null));
    }
  }, [pendingGroup, isAnimating, nextToDrawIdx, groupSizes]);

  const handleAction = useCallback(() => {
    if (isAnimating) return;

    if (groupsDrawnCount === totalGroups && pendingGroup) {
      onComplete([...completedGroups, pendingGroup]);
      return;
    }

    setIsAnimating(true);

    if (pendingGroup) {
      setCompletedGroups(prev => [...prev, pendingGroup]);
      setPendingGroup(null);
    }

    const slotCount = groupSizes[nextToDrawIdx];
    let pool = [...remainingPool];
    
    const winners: string[] = [];
    for (let i = 0; i < slotCount; i++) {
      const randIdx = Math.floor(Math.random() * pool.length);
      winners.push(pool[randIdx]);
      pool.splice(randIdx, 1);
    }

    let iterations = 0;
    const maxIterations = 20;
    const interval = setInterval(() => {
      iterations++;
      
      const displaySlots = winners.map((winner, idx) => {
        if (iterations > maxIterations) return winner;
        const poolCopy = [...remainingPool];
        return poolCopy[Math.floor(Math.random() * poolCopy.length)];
      });
      
      setCurrentGroupSlots(displaySlots);

      if (iterations > maxIterations) {
        clearInterval(interval);
        
        setTimeout(() => {
          const newGroup: DrawingGroup = {
            id: groupsDrawnCount + 1,
            members: winners
          };
          setPendingGroup(newGroup);
          setRemainingPool(pool);
          setIsAnimating(false);
        }, 800);
      }
    }, 100);
  }, [isAnimating, remainingPool, nextToDrawIdx, groupSizes, completedGroups, pendingGroup, groupsDrawnCount, totalGroups, onComplete]);

  const getButtonText = () => {
    if (isAnimating) return '추첨 진행 중...';
    if (pendingGroup) {
      if (groupsDrawnCount === totalGroups) return '최종 결과 확인';
      return `${groupsDrawnCount + 1}조 추첨 시작`;
    }
    return `${groupsDrawnCount + 1}조 확정하기`;
  };

  const formatName = (name: string) => {
    if (name.endsWith('프로')) {
      return (
        <div className="flex flex-col leading-[1.1] items-center text-center">
          <span>{name.slice(0, -2)}</span>
          <span className="text-[0.6em] font-bold opacity-80 -mt-0.5">프로</span>
        </div>
      );
    }
    return name;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-12">
      <div className="text-center space-y-3">
        <div className="inline-block bg-[#004071] text-white px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase">
          Group {pendingGroup ? pendingGroup.id : groupsDrawnCount + 1} of {totalGroups}
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-[#004071] tracking-tight">
          {pendingGroup ? `${pendingGroup.id}조 편성 완료` : `${groupsDrawnCount + 1}조 행운 추첨`}
        </h2>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-2 border-gray-50 relative overflow-hidden">
        {/* Aesthetic AP Systems stylized A in background */}
        <div className="absolute -top-10 -right-10 opacity-[0.03] rotate-12 pointer-events-none">
          <Trophy size={300} strokeWidth={1} />
        </div>

        <div className={`grid gap-6 mb-10 ${currentGroupSlots.length > 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {currentGroupSlots.map((slot, idx) => (
            <div 
              key={idx} 
              className={`h-32 flex items-center justify-center rounded-[2rem] border-4 transition-all duration-500 ${
                slot 
                ? 'bg-white border-[#ABC91A] text-[#004071] shadow-xl shadow-[#ABC91A]/20 scale-105' 
                : 'bg-gray-50/50 border-dashed border-gray-200 text-gray-300'
              }`}
            >
              <AnimatePresence mode="wait">
                {slot ? (
                  <motion.span 
                    key={slot}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-3xl font-black tracking-tight"
                  >
                    {formatName(slot)}
                  </motion.span>
                ) : (
                  <div className="flex flex-col items-center gap-1 opacity-40">
                    <Trophy size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Waiting</span>
                  </div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleAction}
            disabled={isAnimating}
            className={`px-16 py-6 rounded-full font-black text-2xl shadow-2xl transition-all active:scale-95 group flex items-center gap-4 ${
              isAnimating
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
              : 'bg-[#004071] text-white hover:bg-[#003056]'
            }`}
          >
            {getButtonText()}
            {!isAnimating && <ArrowRight className="group-hover:translate-x-2 transition-transform" size={28} />}
          </button>
        </div>
      </div>

      {/* History */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black text-[#004071] flex items-center gap-3 px-4">
          <CheckCircle2 size={28} className="text-[#ABC91A]" />
          현재까지 편성 현황
        </h3>
        {completedGroups.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 text-gray-400 font-bold italic shadow-sm">
            추첨을 시작해 주세요.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedGroups.map((group) => (
              <motion.div 
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-2 border-gray-50 rounded-[2rem] p-6 shadow-lg shadow-gray-200/50 flex flex-col items-center text-center group"
              >
                <div className="text-xs font-black text-[#ABC91A] mb-4 bg-gray-50 px-3 py-1 rounded-full">{group.id}조 ({group.members.length}인)</div>
                <div className="flex flex-col gap-2 w-full">
                  {group.members.map((name, i) => (
                    <div key={i} className="text-lg font-black text-[#004071] py-1 border-b border-gray-50 last:border-0">
                      {formatName(name)}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DrawingView;
