export type SkillLevel = 'A' | 'B' | 'C';
export type Gender = 'L' | 'P';
export type CourtNumber = 1 | 2;

export interface Player {
  id: string;
  name: string;
  gender: Gender;
  angkatan: string;
  level: SkillLevel;
  gamesPlayed: number;
  isPlaying: boolean;
}

export interface Match {
  id: string;
  courtNumber: CourtNumber;
  team1: Player[]; // 2 pemain
  team2: Player[]; // 2 pemain
  startTime: Date;
}

export type NewPlayer = Pick<Player, 'name' | 'gender' | 'angkatan' | 'level'>;
