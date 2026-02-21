
import React, { useState, useEffect } from 'react';
import { AppView, Member, DrawingGroup, ScoreEntry, MatchRecord } from './types';
import { INITIAL_MEMBERS } from './constants';
import ManageMembersView from './views/ManageMembersView';
import SettingsView from './views/SettingsView';
import DrawingView from './views/DrawingView';
import ResultView from './views/ResultView';
import HistoryView from './views/HistoryView';
import Header from './components/Header';

const STORAGE_KEY = 'ap_golf_members';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.MANAGE_MEMBERS);
  const [allMembers, setAllMembers] = useState<Member[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
    } catch (e) {
      console.error('Failed to load members', e);
      return INITIAL_MEMBERS;
    }
  });
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [groupSizes, setGroupSizes] = useState<number[]>([]);
  const [drawingResults, setDrawingResults] = useState<DrawingGroup[]>([]);
  const [history, setHistory] = useState<MatchRecord[]>(() => {
    try {
      const saved = localStorage.getItem('ap_golf_history');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to load history', e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allMembers));
  }, [allMembers]);

  useEffect(() => {
    localStorage.setItem('ap_golf_history', JSON.stringify(history));
  }, [history]);

  const handleStartDraw = (participantIds: string[], sizes: number[]) => {
    setSelectedMemberIds(participantIds);
    setGroupSizes(sizes);
    setView(AppView.DRAWING);
  };

  const handleFinishDraw = (results: DrawingGroup[]) => {
    setDrawingResults(results);
    setView(AppView.RESULT);
  };

  const handleReset = () => {
    setDrawingResults([]);
    setView(AppView.MANAGE_MEMBERS);
  };

  const handleSaveScores = (groupsWithScores: (DrawingGroup & { scores: ScoreEntry[] })[], golfCourse?: string) => {
    const newRecord: MatchRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      golfCourse,
      groups: groupsWithScores
    };
    setHistory(prev => [newRecord, ...prev]);
    setView(AppView.HISTORY);
    setDrawingResults([]);
  };

  const handleDeleteHistory = (recordId: string) => {
    setHistory(prev => prev.filter(r => r.id !== recordId));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <Header onViewHistory={() => setView(AppView.HISTORY)} />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        {view === AppView.MANAGE_MEMBERS && (
          <ManageMembersView
            members={allMembers}
            setMembers={setAllMembers}
            onNext={() => setView(AppView.SETTINGS)}
            onViewHistory={() => setView(AppView.HISTORY)}
          />
        )}

        {view === AppView.SETTINGS && (
          <SettingsView
            members={allMembers}
            onBack={() => setView(AppView.MANAGE_MEMBERS)}
            onStart={handleStartDraw}
          />
        )}

        {view === AppView.DRAWING && (
          <DrawingView
            memberNames={allMembers.filter(m => selectedMemberIds.includes(m.id)).map(m => m.name)}
            groupSizes={groupSizes}
            onComplete={handleFinishDraw}
          />
        )}

        {view === AppView.RESULT && (
          <ResultView
            results={drawingResults}
            history={history}
            onReset={handleReset}
            onSave={handleSaveScores}
          />
        )}

        {view === AppView.HISTORY && (
          <HistoryView
            history={history}
            onBack={() => setView(AppView.MANAGE_MEMBERS)}
            onDelete={handleDeleteHistory}
          />
        )}
      </main>

      <footer className="py-6 text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} AP System Executive Golf Tournament
      </footer>
    </div>
  );
};

export default App;
