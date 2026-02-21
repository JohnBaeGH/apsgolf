
export interface Member {
  id: string;
  name: string;
}

export interface DrawingGroup {
  id: number;
  members: string[];
}

export interface ScoreEntry {
  memberName: string;
  score: number;
}

export interface MatchRecord {
  id: string;
  date: string;
  golfCourse?: string;
  groups: (DrawingGroup & { scores: ScoreEntry[] })[];
}

export enum AppView {
  MANAGE_MEMBERS = 'MANAGE_MEMBERS',
  SETTINGS = 'SETTINGS',
  DRAWING = 'DRAWING',
  RESULT = 'RESULT',
  HISTORY = 'HISTORY'
}

export interface AppState {
  view: AppView;
  allMembers: Member[];
  selectedMemberIds: string[];
  membersPerGroup: number;
  drawingResults: DrawingGroup[];
  history: MatchRecord[];
}
