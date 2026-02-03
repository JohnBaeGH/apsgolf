
import React, { useState } from 'react';
import { Member } from '../types';
import { Plus, Trash2, Users, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  onNext: () => void;
}

const ManageMembersView: React.FC<Props> = ({ members, setMembers, onNext }) => {
  const [newName, setNewName] = useState('');

  const addMember = () => {
    if (!newName.trim()) return;
    const newMember: Member = {
      id: Date.now().toString(),
      name: newName.trim(),
    };
    setMembers([...members, newMember]);
    setNewName('');
  };

  const removeMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#004071] flex items-center gap-2">
          <Users className="text-[#ABC91A]" />
          임원 명단 관리
        </h2>
        <span className="text-sm text-gray-400 font-medium">현재 등록 {members.length}명</span>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addMember()}
            placeholder="추가할 성함(프로)을 입력하세요"
            className="flex-grow px-4 py-4 rounded-2xl border-2 border-gray-100 focus:outline-none focus:border-[#ABC91A] transition-all bg-gray-50/50"
          />
          <button
            onClick={addMember}
            className="bg-[#004071] text-white px-8 py-4 rounded-2xl hover:bg-[#003056] transition-all flex items-center gap-2 font-bold shadow-md shadow-[#004071]/20"
          >
            <Plus size={20} />
            추가
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto p-2">
          <AnimatePresence>
            {members.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative bg-white p-4 rounded-2xl border-2 border-gray-50 flex items-center justify-between shadow-sm hover:border-[#ABC91A]/30 transition-all"
              >
                <span className="font-bold text-gray-700">{member.name}</span>
                <button
                  onClick={() => removeMember(member.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={onNext}
          disabled={members.length === 0}
          className="bg-[#ABC91A] text-[#004071] px-12 py-5 rounded-full font-black text-xl hover:bg-[#99b317] shadow-xl shadow-[#ABC91A]/30 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          참가 설정 및 추첨
          <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default ManageMembersView;
