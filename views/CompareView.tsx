import React, { useMemo, useState } from 'react';
import { MatchRecord } from '../types';
import { ArrowLeft, ArrowRight, TrendingUp, TrendingDown, Minus, GitCompareArrows, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import {
    ScoreDelta,
    sortHistoryByDateDesc,
    buildScoreDeltas,
    flattenScores,
    formatDeltaLabel,
    formatLongDate,
    formatShortDate,
} from '../scoreDeltas';

interface Props {
    history: MatchRecord[];
    onBack: () => void;
}

interface CompareRow {
    memberName: string;
    currentScore: number;
    delta?: ScoreDelta;
}

const CompareView: React.FC<Props> = ({ history, onBack }) => {
    const sortedHistory = useMemo(() => sortHistoryByDateDesc(history), [history]);
    const scoreDeltas = useMemo(() => buildScoreDeltas(sortedHistory), [sortedHistory]);

    // 기준 경기 — 기본값은 가장 최근 경기
    const [selectedId, setSelectedId] = useState<string>(() => sortedHistory[0]?.id || '');

    const selectedRecord = sortedHistory.find(r => r.id === selectedId) || sortedHistory[0];
    const selectedIdx = sortedHistory.findIndex(r => r.id === selectedRecord?.id);

    const { compared, firstTimers, summary } = useMemo(() => {
        if (!selectedRecord) {
            return { compared: [] as CompareRow[], firstTimers: [] as CompareRow[], summary: null };
        }

        const deltas = scoreDeltas[selectedRecord.id] || {};
        const rows: CompareRow[] = flattenScores(selectedRecord)
            .filter(s => s.score > 0)
            .map(s => ({
                memberName: s.memberName,
                currentScore: s.score,
                delta: deltas[s.memberName],
            }));

        // 많이 줄인 사람이 위로
        const compared = rows
            .filter(r => r.delta)
            .sort((a, b) => (a.delta!.diff - b.delta!.diff));
        const firstTimers = rows.filter(r => !r.delta).sort((a, b) => a.currentScore - b.currentScore);

        const improved = compared.filter(r => r.delta!.diff < 0).length;
        const worsened = compared.filter(r => r.delta!.diff > 0).length;
        const even = compared.filter(r => r.delta!.diff === 0).length;
        const avg = compared.length
            ? compared.reduce((acc, r) => acc + r.delta!.diff, 0) / compared.length
            : 0;

        return {
            compared,
            firstTimers,
            summary: compared.length ? { improved, worsened, even, avg, count: compared.length } : null,
        };
    }, [selectedRecord, scoreDeltas]);

    const tone = (diff: number) =>
        diff < 0
            ? { text: 'text-[#5F7A00]', bg: 'bg-[#ABC91A]/20', border: 'border-[#ABC91A]/40', Icon: TrendingDown }
            : diff > 0
                ? { text: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', Icon: TrendingUp }
                : { text: 'text-gray-400', bg: 'bg-gray-100', border: 'border-gray-200', Icon: Minus };

    if (sortedHistory.length === 0) {
        return (
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-3 hover:bg-white rounded-2xl transition-all text-[#004071]">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-3xl font-black text-[#004071]">직전 경기 비교</h2>
                </div>
                <div className="bg-white rounded-[2.5rem] p-16 text-center shadow-sm border border-gray-100">
                    <p className="text-gray-400 font-bold text-xl">비교할 경기 기록이 없습니다.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-3 hover:bg-white rounded-2xl transition-all text-[#004071] border-2 border-transparent hover:border-gray-100"
                >
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-3xl font-black text-[#004071] flex items-center gap-3">
                    <GitCompareArrows className="text-[#ABC91A]" size={36} />
                    직전 경기 비교
                </h2>
            </div>

            {/* 기준 경기 선택 */}
            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-lg border-2 border-gray-50 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                        <CalendarDays size={22} />
                    </div>
                    <div>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">기준 경기</p>
                        <p className="font-black text-[#004071] text-lg">
                            {formatLongDate(selectedRecord.date)}
                            {selectedRecord.golfCourse && (
                                <span className="text-[#ABC91A] italic text-sm ml-2">@ {selectedRecord.golfCourse}</span>
                            )}
                        </p>
                    </div>
                </div>
                <select
                    value={selectedRecord.id}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 font-bold text-[#004071] focus:border-[#ABC91A] focus:outline-none transition-colors"
                >
                    {sortedHistory.map(r => (
                        <option key={r.id} value={r.id}>
                            {formatShortDate(r.date)} {r.golfCourse ? `· ${r.golfCourse}` : ''}
                        </option>
                    ))}
                </select>
            </div>

            {/* 요약 */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#ABC91A]/10 rounded-3xl p-6 border-2 border-[#ABC91A]/30">
                        <p className="text-[#5F7A00] font-bold text-xs uppercase tracking-wider mb-1">타수 줄임</p>
                        <p className="text-4xl font-black text-[#5F7A00]">{summary.improved}<span className="text-lg ml-1">명</span></p>
                    </div>
                    <div className="bg-red-50 rounded-3xl p-6 border-2 border-red-100">
                        <p className="text-red-500 font-bold text-xs uppercase tracking-wider mb-1">타수 늘어남</p>
                        <p className="text-4xl font-black text-red-500">{summary.worsened}<span className="text-lg ml-1">명</span></p>
                    </div>
                    <div className="bg-gray-100 rounded-3xl p-6 border-2 border-gray-200">
                        <p className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-1">동일</p>
                        <p className="text-4xl font-black text-gray-500">{summary.even}<span className="text-lg ml-1">명</span></p>
                    </div>
                    <div className="bg-[#004071] rounded-3xl p-6">
                        <p className="text-white/60 font-bold text-xs uppercase tracking-wider mb-1">평균 변화</p>
                        <p className="text-4xl font-black text-white">
                            {summary.avg === 0 ? '±0' : `${summary.avg > 0 ? '+' : ''}${summary.avg.toFixed(1)}`}
                            <span className="text-lg ml-1">타</span>
                        </p>
                    </div>
                </div>
            )}

            {/* 비교 목록 */}
            {compared.length > 0 ? (
                <div className="bg-white rounded-[3rem] p-6 md:p-10 shadow-xl border-2 border-gray-50">
                    <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-4 pb-4 mb-2 border-b-2 border-gray-100">
                        <span className="text-gray-400 font-black text-xs uppercase tracking-wider">선수</span>
                        <span className="text-gray-400 font-black text-xs uppercase tracking-wider w-24 text-center">직전 경기</span>
                        <span className="w-6" />
                        <span className="text-gray-400 font-black text-xs uppercase tracking-wider w-24 text-center">이번 경기</span>
                        <span className="text-gray-400 font-black text-xs uppercase tracking-wider w-28 text-right">증감</span>
                    </div>

                    <div className="space-y-3">
                        {compared.map((row, idx) => {
                            const d = row.delta!;
                            const t = tone(d.diff);
                            return (
                                <motion.div
                                    key={row.memberName}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.04 }}
                                    className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_auto_auto_auto] items-center gap-x-4 gap-y-3 px-4 py-4 rounded-3xl bg-gray-50/60 border border-gray-100"
                                >
                                    <span className="font-black text-[#004071] text-xl">{row.memberName}</span>

                                    {/* 모바일에서는 증감이 먼저 오른쪽에 붙는다 */}
                                    <span
                                        className={`md:hidden ${t.bg} ${t.text} rounded-2xl px-3 py-1.5 font-black text-2xl flex items-center gap-1 justify-self-end`}
                                    >
                                        <t.Icon size={20} />
                                        {formatDeltaLabel(d.diff)}
                                        <span className="text-sm font-bold">타</span>
                                    </span>

                                    <div className="col-span-2 md:col-auto flex items-center gap-4 md:gap-0 md:contents">
                                        <span
                                            title={`${formatShortDate(d.prevDate)}${d.prevCourse ? ` ${d.prevCourse}` : ''}`}
                                            className="w-24 text-center text-gray-400 font-black text-2xl"
                                        >
                                            {d.prevScore}<span className="text-sm font-bold ml-0.5">타</span>
                                        </span>
                                        <ArrowRight size={20} className="text-gray-300 w-6 shrink-0" />
                                        <span className="w-24 text-center text-[#004071] font-black text-3xl">
                                            {row.currentScore}<span className="text-sm font-bold ml-0.5">타</span>
                                        </span>
                                        <span className="hidden md:flex w-28 justify-end">
                                            <span className={`${t.bg} ${t.text} rounded-2xl px-3 py-1.5 font-black text-3xl flex items-center gap-1`}>
                                                <t.Icon size={22} />
                                                {formatDeltaLabel(d.diff)}
                                                <span className="text-sm font-bold">타</span>
                                            </span>
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] p-16 text-center shadow-sm border border-gray-100">
                    <p className="text-gray-400 font-bold text-xl mb-2">비교할 직전 기록이 없습니다.</p>
                    <p className="text-gray-300 font-bold">
                        {selectedIdx === sortedHistory.length - 1
                            ? '가장 오래된 경기라 비교 대상이 없습니다.'
                            : '이 경기 참가자들의 이전 기록이 없습니다.'}
                    </p>
                </div>
            )}

            {/* 첫 참가자 */}
            {firstTimers.length > 0 && (
                <div className="bg-white rounded-[2.5rem] p-8 shadow-lg border-2 border-gray-50">
                    <p className="font-black text-[#004071] mb-4">이번이 첫 기록 (비교 대상 없음)</p>
                    <div className="flex flex-wrap gap-3">
                        {firstTimers.map(row => (
                            <span key={row.memberName} className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 font-bold text-[#004071]">
                                {row.memberName}
                                <span className="text-gray-400 font-black ml-2 text-lg">{row.currentScore}타</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-center pt-4">
                <button
                    onClick={onBack}
                    className="bg-[#004071] text-white px-12 py-5 rounded-full font-black text-lg hover:bg-[#003056] transition-all flex items-center gap-2 shadow-xl shadow-[#004071]/20"
                >
                    <ArrowLeft size={24} />
                    기록으로 돌아가기
                </button>
            </div>
        </div>
    );
};

export default CompareView;
