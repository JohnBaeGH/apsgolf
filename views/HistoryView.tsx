import React, { useMemo, useState } from 'react';
import { MatchRecord, ScoreEntry, Member } from '../types';
import { Calendar, Trophy, ArrowLeft, Trash2, Award, Download, Upload, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    history: MatchRecord[];
    allMembers: Member[];
    onBack: () => void;
    onDelete: (id: string) => void;
    onUpdateGolfCourse: (id: string, golfCourse: string) => void;
    onUpdateScore: (recordId: string, groupId: number, memberName: string, score: number) => void;
    onImportData: (history: MatchRecord[], members: Member[]) => void;
}

/** 직전 참가 경기 대비 타수 변화 */
interface ScoreDelta {
    prevScore: number;
    diff: number;
    prevDate: string;
    prevCourse?: string;
}

const HistoryView: React.FC<Props> = ({ history, allMembers, onBack, onDelete, onUpdateGolfCourse, onUpdateScore, onImportData }) => {
    // 입력 중인 점수(확정 전) 임시 보관 — key: recordId|groupId|memberName
    const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({});

    const draftKey = (recordId: string, groupId: number, memberName: string) =>
        `${recordId}|${groupId}|${memberName}`;

    // 최신 경기가 위로 오도록 날짜 내림차순 정렬
    const sortedHistory = useMemo(() => {
        return [...history]
            .filter(Boolean)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [history]);

    /**
     * 각 경기·선수별로 "그 선수가 직전에 친 경기" 대비 타수 차이를 계산한다.
     * 오래된 경기부터 훑으며 선수별 마지막 점수를 기억한다.
     * 골프는 타수가 낮을수록 좋으므로 diff < 0 이 개선(-), diff > 0 이 악화(+).
     */
    const scoreDeltas = useMemo(() => {
        const map: Record<string, Record<string, ScoreDelta>> = {};
        const lastPlayed: Record<string, { score: number; date: string; course?: string }> = {};

        [...sortedHistory].reverse().forEach(record => {
            map[record.id] = {};
            (record.groups || []).forEach(group => {
                (group?.scores || []).forEach(entry => {
                    if (!entry || !entry.memberName || !(entry.score > 0)) return;
                    const prev = lastPlayed[entry.memberName];
                    if (prev) {
                        map[record.id][entry.memberName] = {
                            prevScore: prev.score,
                            diff: entry.score - prev.score,
                            prevDate: prev.date,
                            prevCourse: prev.course,
                        };
                    }
                    lastPlayed[entry.memberName] = {
                        score: entry.score,
                        date: record.date,
                        course: record.golfCourse,
                    };
                });
            });
        });

        return map;
    }, [sortedHistory]);

    // 누적 평균 순위
    const memberStats = history.reduce((acc, match) => {
        if (!match || !match.groups) return acc;
        match.groups.forEach(group => {
            if (!group || !group.scores) return;
            group.scores.forEach(scoreEntry => {
                if (!acc[scoreEntry.memberName]) {
                    acc[scoreEntry.memberName] = { totalScore: 0, count: 0 };
                }
                if (scoreEntry.score > 0) {
                    acc[scoreEntry.memberName].totalScore += scoreEntry.score;
                    acc[scoreEntry.memberName].count += 1;
                }
            });
        });
        return acc;
    }, {} as Record<string, { totalScore: number, count: number }>);

    const sortedLeaderboard = Object.entries(memberStats)
        .map(([name, stats]) => ({
            name,
            avgScore: stats.count > 0 ? (stats.totalScore / stats.count).toFixed(1) : '0',
            totalScore: stats.totalScore,
            count: stats.count
        }))
        .sort((a, b) => {
            if (a.count === 0) return 1;
            if (b.count === 0) return -1;
            return parseFloat(a.avgScore) - parseFloat(b.avgScore);
        });

    // Handle ties
    const leaderboardWithRanks = sortedLeaderboard.map((player, idx, arr) => {
        let rank = idx + 1;
        if (idx > 0 && player.avgScore === arr[idx - 1].avgScore) {
            // Find the rank of the first player in this tie group
            let firstTieIdx = idx - 1;
            while (firstTieIdx >= 0 && arr[firstTieIdx].avgScore === player.avgScore) {
                firstTieIdx--;
            }
            rank = firstTieIdx + 2;
        }
        return { ...player, rank };
    });

    const calculateMatchRankings = (record: MatchRecord) => {
        const matchScores = (record.groups || []).flatMap(g => g?.scores || [])
            .filter(s => s && s.score > 0)
            .sort((a, b) => a.score - b.score);

        return matchScores.map((player, idx, arr) => {
            let rank = idx + 1;
            if (idx > 0 && player.score === arr[idx - 1].score) {
                let firstTieIdx = idx - 1;
                while (firstTieIdx >= 0 && arr[firstTieIdx].score === player.score) firstTieIdx--;
                rank = firstTieIdx + 2;
            }
            return { ...player, rank };
        });
    };

    /** 해당 경기 참가자 중 직전 기록이 있는 사람들의 평균 타수 변화 */
    const calculateMatchDelta = (record: MatchRecord) => {
        const deltas = Object.values(scoreDeltas[record.id] || {});
        if (deltas.length === 0) return null;
        const sum = deltas.reduce((acc, d) => acc + d.diff, 0);
        return { avg: sum / deltas.length, count: deltas.length };
    };

    /** 그룹 안에서 렌더링할 선수 목록 — members 기준으로 맞추고 점수는 scores에서 찾는다 */
    const getGroupRows = (group: MatchRecord['groups'][number]): ScoreEntry[] => {
        if (group?.members && group.members.length > 0) {
            return group.members.map(name => ({
                memberName: name,
                score: group.scores?.find(s => s.memberName === name)?.score ?? 0,
            }));
        }
        return group?.scores || [];
    };

    const handleScoreDraft = (recordId: string, groupId: number, memberName: string, value: string) => {
        setScoreDrafts(prev => ({ ...prev, [draftKey(recordId, groupId, memberName)]: value }));
    };

    const commitScore = (recordId: string, groupId: number, memberName: string, originalScore: number) => {
        const key = draftKey(recordId, groupId, memberName);
        const raw = scoreDrafts[key];

        setScoreDrafts(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });

        if (raw === undefined) return;

        const trimmed = raw.trim();
        const parsed = trimmed === '' ? 0 : parseInt(trimmed, 10);
        const nextScore = isNaN(parsed) || parsed < 0 ? 0 : parsed;

        if (nextScore !== originalScore) {
            onUpdateScore(recordId, groupId, memberName, nextScore);
        }
    };

    const handleExport = () => {
        const data = {
            history,
            members: allMembers,
            exportDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ap_golf_data_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (data.history && data.members) {
                    if (confirm('현재 데이터를 덮어쓰고 파일의 내용을 불러오시겠습니까?')) {
                        onImportData(data.history, data.members);
                    }
                } else {
                    alert('올바른 형식의 파일이 아닙니다.');
                }
            } catch (err) {
                alert('파일을 읽는 중 오류가 발생했습니다.');
            }
        };
        reader.readAsText(file);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '날짜 정보 없음';
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short'
        });
    };

    const formatShortDate = (dateString: string) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
    };

    /** 직전 경기 대비 변화 배지 */
    const DeltaBadge: React.FC<{ delta?: ScoreDelta; size?: 'sm' | 'xs' }> = ({ delta, size = 'sm' }) => {
        const pad = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-1.5 py-0.5 text-[10px]';
        const iconSize = size === 'sm' ? 12 : 10;

        // 직전 기록이 없으면(첫 참가) 배지를 그리지 않는다
        if (!delta) return null;

        const tooltip = `직전 ${formatShortDate(delta.prevDate)}${delta.prevCourse ? ` ${delta.prevCourse}` : ''} ${delta.prevScore}타`;

        if (delta.diff === 0) {
            return (
                <span title={tooltip} className={`${pad} rounded-lg font-black text-gray-400 bg-gray-100 flex items-center gap-0.5 whitespace-nowrap`}>
                    <Minus size={iconSize} />±0
                </span>
            );
        }

        const improved = delta.diff < 0;
        return (
            <span
                title={tooltip}
                className={`${pad} rounded-lg font-black flex items-center gap-0.5 whitespace-nowrap ${improved ? 'text-[#5F7A00] bg-[#ABC91A]/20' : 'text-red-500 bg-red-50'
                    }`}
            >
                {improved ? <TrendingDown size={iconSize} /> : <TrendingUp size={iconSize} />}
                {delta.diff > 0 ? `+${delta.diff}` : delta.diff}
            </span>
        );
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-3 hover:bg-white rounded-2xl transition-all text-[#004071] border-2 border-transparent hover:border-gray-100"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-3xl font-black text-[#004071] flex items-center gap-3">
                        <Trophy className="text-[#ABC91A]" size={40} />
                        경기 기록 및 멤버 순위
                    </h2>
                </div>
            </div>

            {/* Match History List */}
            <section className="space-y-6">
                <div className="flex items-center justify-between gap-3 mb-4 px-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                            <Calendar size={24} />
                        </div>
                        <h3 className="text-2xl font-black text-[#004071]">최근 매치 이력</h3>
                    </div>
                    <p className="text-gray-400 font-bold text-sm">
                        점수 칸을 눌러 바로 수정할 수 있습니다 · 배지는 직전 경기 대비 타수
                    </p>
                </div>

                {sortedHistory.length > 0 ? (
                    <div className="space-y-6">
                        {sortedHistory.map((record) => {
                            const matchRankings = calculateMatchRankings(record);
                            const recordDeltas = scoreDeltas[record.id] || {};
                            const matchDelta = calculateMatchDelta(record);
                            return (
                                <motion.div
                                    key={record.id}
                                    layout
                                    className="bg-white rounded-[2.5rem] p-8 shadow-lg border-2 border-gray-50 group overflow-hidden"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-gray-100 pb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-gray-50 p-4 rounded-2xl text-[#004071]">
                                                <Calendar size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-[#004071] text-xl leading-tight">{formatDate(record.date)}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[#ABC91A] font-black text-sm italic">@</span>
                                                    <input
                                                        type="text"
                                                        defaultValue={record.golfCourse || ''}
                                                        onBlur={(e) => {
                                                            if (e.target.value !== (record.golfCourse || '')) {
                                                                onUpdateGolfCourse(record.id, e.target.value);
                                                            }
                                                        }}
                                                        placeholder="골프장 입력"
                                                        className="bg-transparent border-b border-dashed border-gray-200 focus:border-[#ABC91A] focus:outline-none text-[#ABC91A] font-black text-sm italic placeholder:text-gray-300 w-40"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                    <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">{record.groups?.length || 0} 조 경기 완료</p>
                                                    {matchDelta && (
                                                        <span
                                                            title={`직전 경기 기록이 있는 ${matchDelta.count}명 기준`}
                                                            className={`px-2 py-1 rounded-lg text-xs font-black flex items-center gap-1 ${matchDelta.avg < 0
                                                                ? 'text-[#5F7A00] bg-[#ABC91A]/20'
                                                                : matchDelta.avg > 0
                                                                    ? 'text-red-500 bg-red-50'
                                                                    : 'text-gray-400 bg-gray-100'
                                                                }`}
                                                        >
                                                            {matchDelta.avg < 0 ? <TrendingDown size={12} /> : matchDelta.avg > 0 ? <TrendingUp size={12} /> : <Minus size={12} />}
                                                            직전 대비 평균 {matchDelta.avg === 0 ? '±0' : `${matchDelta.avg > 0 ? '+' : ''}${matchDelta.avg.toFixed(1)}`}타
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onDelete(record.id)}
                                            className="self-end md:self-center p-4 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                            title="기록 삭제"
                                        >
                                            <Trash2 size={24} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                        {record.groups && record.groups.map((group) => (
                                            <div key={group.id} className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100">
                                                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                                                    <span className="font-black text-[#ABC91A] uppercase tracking-widest text-sm italic">Group {group.id}</span>
                                                </div>
                                                <div className="space-y-3">
                                                    {getGroupRows(group).map((row, sIdx) => {
                                                        const key = draftKey(record.id, group.id, row.memberName);
                                                        const draft = scoreDrafts[key];
                                                        const inputValue = draft !== undefined
                                                            ? draft
                                                            : (row.score > 0 ? String(row.score) : '');
                                                        return (
                                                            <div key={sIdx} className="flex justify-between items-center gap-2 text-[#004071] font-bold">
                                                                <span className="truncate">{row.memberName}</span>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <DeltaBadge delta={recordDeltas[row.memberName]} size="xs" />
                                                                    <div className="flex items-center gap-1">
                                                                        <input
                                                                            type="number"
                                                                            inputMode="numeric"
                                                                            placeholder="-"
                                                                            value={inputValue}
                                                                            onChange={(e) => handleScoreDraft(record.id, group.id, row.memberName, e.target.value)}
                                                                            onBlur={() => commitScore(record.id, group.id, row.memberName, row.score)}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                                                            }}
                                                                            className="w-14 bg-white border-2 border-gray-200 rounded-xl px-1 py-1 text-center font-black text-[#004071] focus:border-[#ABC91A] focus:outline-none transition-colors text-sm"
                                                                        />
                                                                        <span className="text-gray-400 font-bold text-xs">타</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Per-Match Standings */}
                                    {matchRankings.length > 0 && (
                                        <div className="bg-[#ABC91A]/5 rounded-3xl p-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Award size={18} className="text-[#ABC91A]" />
                                                <span className="font-black text-[#004071] text-sm">해당 경기 순위</span>
                                            </div>
                                            <div className="flex flex-wrap gap-4">
                                                {matchRankings.slice(0, 5).map((ranker, rIdx) => (
                                                    <div key={rIdx} className="flex items-center gap-2">
                                                        <span className="w-6 h-6 rounded-full bg-[#004071] text-white flex items-center justify-center text-[10px] font-black">
                                                            {ranker.rank}
                                                        </span>
                                                        <span className="text-[#004071] font-bold text-sm">{ranker.memberName}</span>
                                                        <span className="text-gray-400 text-xs">{ranker.score}타</span>
                                                        <DeltaBadge delta={recordDeltas[ranker.memberName]} size="xs" />
                                                    </div>
                                                ))}
                                                {matchRankings.length > 5 && (
                                                    <span className="text-gray-300 text-xs font-bold flex items-center">외 {matchRankings.length - 5}명</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-[2.5rem] p-16 text-center shadow-sm border border-gray-100">
                        <p className="text-gray-400 font-bold text-xl mb-4">기록된 매치가 없습니다.</p>
                        <p className="text-gray-300">경기를 마치고 결과를 저장해 보세요.</p>
                    </div>
                )}
            </section>

            {/* Overall Leaderboard Section (Cumulative Average) */}
            <section className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border-2 border-gray-50">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-yellow-50 rounded-2xl text-yellow-600">
                        <Trophy size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-[#004071]">전체 누적 순위 (에버리지)</h3>
                </div>

                {leaderboardWithRanks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {leaderboardWithRanks.map((player, idx) => {
                            return (
                                <motion.div
                                    key={player.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`p-6 rounded-3xl border-2 flex items-center justify-between group transition-all
                  ${player.rank === 1 ? 'bg-yellow-50 border-yellow-100' : 'bg-gray-50/50 border-gray-100'}
                `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg
                    ${player.rank === 1 ? 'bg-yellow-400 text-white' : 'bg-[#004071] text-white'}
                  `}>
                                            {player.rank}
                                        </div>
                                        <div>
                                            <p className="font-black text-[#004071] text-xl">{player.name}</p>
                                            <p className="text-gray-400 text-sm font-bold">{player.count}경기 참여</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-2xl font-black ${player.rank === 1 ? 'text-yellow-600' : 'text-[#004071]'}`}>
                                            {player.avgScore} <span className="text-sm">타</span>
                                        </p>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Lifetime Avg</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400 font-bold">
                        아직 기록된 경기가 없습니다.
                    </div>
                )}
            </section>

            {/* Data Management Section */}
            <section className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border-2 border-gray-50 mt-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-2xl font-black text-[#004071] mb-2">백업 및 데이터 관리</h3>
                        <p className="text-gray-400 font-bold">기기를 변경하시거나 데이터를 안전하게 보관하고 싶을 때 사용하세요.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleExport}
                            className="bg-white border-2 border-[#004071] text-[#004071] px-6 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center gap-2"
                        >
                            <Download size={20} />
                            데이터 내보내기 (저장)
                        </button>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <button className="bg-[#ABC91A] text-[#004071] px-6 py-4 rounded-2xl font-bold hover:bg-[#99b317] transition-all flex items-center gap-2 shadow-lg shadow-[#ABC91A]/20">
                                <Upload size={20} />
                                데이터 불러오기 (복구)
                            </button>
                        </div>
                    </div>
                </div>
                <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100 italic">
                    <p className="text-blue-800 text-sm font-bold">
                        * 주의: '데이터 불러오기'를 하면 현재 저장된 모든 기록과 멤버 명단이 파일의 내용으로 교체됩니다.
                        중요한 정보가 있다면 먼저 '내보내기'로 저장해 두세요.
                    </p>
                </div>
            </section>

            <div className="flex justify-center pt-8">
                <button
                    onClick={onBack}
                    className="bg-[#004071] text-white px-12 py-5 rounded-full font-black text-lg hover:bg-[#003056] transition-all flex items-center gap-2 shadow-xl shadow-[#004071]/20"
                >
                    <ArrowLeft size={24} />
                    돌아가기
                </button>
            </div>
        </div>
    );
};

export default HistoryView;
