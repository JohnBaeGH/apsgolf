
import React, { useState, useEffect } from 'react';
import { AppView, Member, DrawingGroup, ScoreEntry, MatchRecord } from './types';
import { INITIAL_MEMBERS } from './constants';
import ManageMembersView from './views/ManageMembersView';
import SettingsView from './views/SettingsView';
import DrawingView from './views/DrawingView';
import ResultView from './views/ResultView';
import HistoryView from './views/HistoryView';
import Header from './components/Header';
import { supabase } from './supabaseClient';

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

  // Fetch from Supabase on load
  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Members
      const { data: dbMembers, error: mError } = await supabase.from('members').select('*');
      if (!mError && dbMembers && dbMembers.length > 0) {
        setAllMembers(dbMembers.map(m => ({ id: m.id, name: m.name })));
      }

      // 2. Fetch History
      const { data: dbHistory, error: hError } = await supabase.from('match_history').select('*').order('date', { ascending: false });
      if (!hError && dbHistory) {
        setHistory(dbHistory.map(record => ({
          ...record,
          golfCourse: record.golf_course, // Map snake_case to camelCase
        })) as MatchRecord[]);
      }
    };
    fetchData();
  }, []);

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

  const syncMembersToDb = async (members: Member[]) => {
    try {
      // Simple upsert logic
      await supabase.from('members').upsert(
        members.map(m => ({ id: m.id, name: m.name }))
      );
    } catch (e) {
      console.error('DB Sync Error (Members)', e);
    }
  };

  const handleSetAllMembers = (update: Member[] | ((prev: Member[]) => Member[])) => {
    const newMembers = typeof update === 'function' ? update(allMembers) : update;
    setAllMembers(newMembers);
    syncMembersToDb(newMembers);
  };

  const handleSaveScores = async (groupsWithScores: (DrawingGroup & { scores: ScoreEntry[] })[], golfCourse?: string) => {
    const newRecord: MatchRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      golfCourse,
      groups: groupsWithScores
    };

    // 1. Update State
    setHistory(prev => [newRecord, ...prev]);

    // 2. Save to DB
    try {
      await supabase.from('match_history').insert({
        id: newRecord.id,
        date: newRecord.date,
        golf_course: newRecord.golfCourse,
        groups: newRecord.groups
      });
    } catch (e) {
      console.error('DB Save Error', e);
    }

    setView(AppView.HISTORY);
    setDrawingResults([]);
  };

  const handleDeleteHistory = async (recordId: string) => {
    setHistory(prev => prev.filter(r => r.id !== recordId));
    try {
      await supabase.from('match_history').delete().eq('id', recordId);
    } catch (e) {
      console.error('DB Delete Error', e);
    }
  };

  const handleUpdateGolfCourse = async (recordId: string, golfCourse: string) => {
    setHistory(prev => prev.map(record =>
      record.id === recordId ? { ...record, golfCourse } : record
    ));
    try {
      await supabase.from('match_history').update({ golf_course: golfCourse }).eq('id', recordId);
    } catch (e) {
      console.error('DB Update Error', e);
    }
  };

  const handleImportData = async (newHistory: MatchRecord[], newMembers: Member[]) => {
    if (newHistory.length > 0) {
      setHistory(newHistory);
      // Bulk insert history
      await supabase.from('match_history').upsert(
        newHistory.map(h => ({
          id: h.id,
          date: h.date,
          golf_course: h.golfCourse,
          groups: h.groups
        }))
      );
    }
    if (newMembers.length > 0) {
      setAllMembers(newMembers);
      await syncMembersToDb(newMembers);
    }
    alert('데이터를 성공적으로 불러오고 DB와 동기화했습니다!');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <Header onViewHistory={() => setView(AppView.HISTORY)} />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        {view === AppView.MANAGE_MEMBERS && (
          <ManageMembersView
            members={allMembers}
            setMembers={handleSetAllMembers}
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
            allMembers={allMembers}
            onBack={() => setView(AppView.MANAGE_MEMBERS)}
            onDelete={handleDeleteHistory}
            onUpdateGolfCourse={handleUpdateGolfCourse}
            onImportData={handleImportData}
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
