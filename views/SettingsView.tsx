
import React, { useState } from 'react';
import { Member } from '../types';
import { Check, ArrowLeft, Play, Calculator, Info } from 'lucide-react';

interface Props {
  members: Member[];
  onBack: () => void;
  onStart: (participantIds: string[], groupSizes: number[]) => void;
}

const SettingsView: React.FC<Props> = ({ members, onBack, onStart }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(members.map((m) => m.id));
  const [baseGroupSize, setBaseGroupSize] = useState<number>(3);
  const [isBalanced, setIsBalanced] = useState<boolean>(true);

  const toggleMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const calculateDistribution = () => {
    const total = selectedIds.length;
    if (total === 0) return [];

    if (!isBalanced) {
      const fullGroups = Math.floor(total / baseGroupSize);
      const leftover = total % baseGroupSize;
      const sizes = new Array(fullGroups).fill(baseGroupSize);
      if (leftover > 0) sizes.push(leftover);
      return sizes;
    } else {
      const numGroups = Math.ceil(total / baseGroupSize);
      const minPerGroup = Math.floor(total / numGroups);
      const extraMembers = total % numGroups;
      
      const sizes = [];
      for (let i = 0; i < numGroups; i++) {
        sizes.push(i < extraMembers ? minPerGroup + 1 : minPerGroup);
      }
      return sizes;
    }
  };

  const currentSizes = calculateDistribution();
  const totalGroups = currentSizes.length;

  const getDistributionText = () => {
    const counts: Record<number, number> = {};
    currentSizes.forEach(s => counts[s] = (counts[s] || 0) + 1);
    return Object.entries(counts)
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([size, count]) => `${size}인 ${count}개 조`)
      .join(', ');
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-[#004071] transition-colors font-bold text-sm">
        <ArrowLeft size={18} />
        명단 편집으로 돌아가기
      </button>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#004071]">참가자 선택</h2>
            <button 
              onClick={() => setSelectedIds(selectedIds.length === members.length ? [] : members.map(m => m.id))}
              className="text-sm text-[#004071] font-bold underline"
            >
              {selectedIds.length === members.length ? '전체 해제' : '전체 선택'}
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {members.map((member) => (
              <button
                key={member.id}
                onClick={() => toggleMember(member.id)}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all font-bold ${
                  selectedIds.includes(member.id)
                    ? 'border-[#004071] bg-[#004071] text-white shadow-md'
                    : 'border-gray-50 bg-gray-50/50 text-gray-400 hover:border-gray-200'
                }`}
              >
                <span>{member.name}</span>
                {selectedIds.includes(member.id) && <Check size={18} />}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 space-y-8">
            <h3 className="text-xl font-black text-[#004071] border-b pb-4">조 편성 설정</h3>
            
            <div className="space-y-4">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">희망 조당 인원</label>
              <div className="flex gap-2">
                {[2, 3, 4].map((size) => (
                  <button
                    key={size}
                    onClick={() => setBaseGroupSize(size)}
                    className={`flex-1 py-4 rounded-2xl border-2 font-black transition-all ${
                      baseGroupSize === size
                        ? 'border-[#ABC91A] bg-[#ABC91A] text-[#004071]'
                        : 'border-gray-100 bg-gray-50 text-gray-300 hover:border-gray-200'
                    }`}
                  >
                    {size}명
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#004071]">인원 균등 배분</label>
                <button 
                  onClick={() => setIsBalanced(!isBalanced)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${isBalanced ? 'bg-[#ABC91A]' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${isBalanced ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed italic">
                {isBalanced 
                  ? '모든 조의 인원을 최대한 비슷하게 맞춥니다.' 
                  : '설정한 인원대로 조를 채우고 나머지는 마지막 조에 배정합니다.'}
              </p>
            </div>

            <div className="p-5 bg-[#004071] rounded-2xl space-y-4 text-white shadow-lg">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-[#ABC91A]">
                <Calculator size={14} />
                편성 요약
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="opacity-70">총 참가 인원</span>
                  <span className="font-bold">{selectedIds.length}명</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-70">총 편성 조 수</span>
                  <span className="font-bold">{totalGroups}개 조</span>
                </div>
                <div className="pt-3 border-t border-white/10 mt-3">
                  <div className="flex items-start gap-2 text-white font-black text-sm">
                    <Info size={16} className="text-[#ABC91A] shrink-0" />
                    <span>{getDistributionText() || '인원을 선택해주세요'}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onStart(selectedIds, currentSizes)}
              disabled={selectedIds.length < 2}
              className="w-full bg-[#ABC91A] text-[#004071] py-5 rounded-2xl font-black text-xl hover:bg-[#99b317] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#ABC91A]/20 disabled:opacity-50"
            >
              <Play size={24} fill="currentColor" />
              추첨 시작
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
