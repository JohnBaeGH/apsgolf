import { MatchRecord } from './types';

/** 직전 참가 경기 대비 타수 변화 */
export interface ScoreDelta {
    prevScore: number;
    diff: number;
    prevDate: string;
    prevCourse?: string;
}

/** 경기 기록을 최신순으로 정렬한다 (import 등으로 순서가 섞여도 안전하게) */
export const sortHistoryByDateDesc = (history: MatchRecord[]): MatchRecord[] =>
    [...(history || [])]
        .filter(Boolean)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

/**
 * 각 경기·선수별로 "그 선수가 직전에 친 경기" 대비 타수 차이를 계산한다.
 * 오래된 경기부터 훑으며 선수별 마지막 점수를 기억한다.
 * 골프는 타수가 낮을수록 좋으므로 diff < 0 이 개선(-), diff > 0 이 악화(+).
 *
 * @param sortedDesc 최신순으로 정렬된 경기 목록
 * @returns { [경기id]: { [선수명]: ScoreDelta } }
 */
export const buildScoreDeltas = (
    sortedDesc: MatchRecord[]
): Record<string, Record<string, ScoreDelta>> => {
    const map: Record<string, Record<string, ScoreDelta>> = {};
    const lastPlayed: Record<string, { score: number; date: string; course?: string }> = {};

    [...sortedDesc].reverse().forEach(record => {
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
};

/** 한 경기에 기록된 모든 선수의 점수를 평평하게 편다 */
export const flattenScores = (record?: MatchRecord) =>
    (record?.groups || []).flatMap(g =>
        (g?.scores || []).filter(s => s && s.memberName)
    );

export const formatDeltaLabel = (diff: number) =>
    diff === 0 ? '±0' : diff > 0 ? `+${diff}` : `${diff}`;

export const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
};

export const formatLongDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '날짜 정보 없음';
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
    });
};
