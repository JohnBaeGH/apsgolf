
export interface Member {
  id: string;
  name: string;
}

export interface DrawingGroup {
  id: number;
  members: string[];
}

export enum AppView {
  MANAGE_MEMBERS = 'MANAGE_MEMBERS',
  SETTINGS = 'SETTINGS',
  DRAWING = 'DRAWING',
  RESULT = 'RESULT'
}

export interface AppState {
  view: AppView;
  allMembers: Member[];
  selectedMemberIds: string[];
  membersPerGroup: number;
  drawingResults: DrawingGroup[];
}
