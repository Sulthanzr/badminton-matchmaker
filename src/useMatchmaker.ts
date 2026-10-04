import { useMemo, useState } from 'react';
import type { CourtNumber, Match, NewPlayer, Player } from './types';

export const COURTS: CourtNumber[] = [1, 2];
const WEIGHT = { A: 3, B: 2, C: 1 } as const;

// Tidak pakai crypto.randomUUID agar tetap jalan saat diakses lewat http://IP-LAN
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const shuffle = <T>(items: T[]): T[] => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/** Ambil 4 pemain dengan gamesPlayed terkecil. Seri di batas potongan diacak. */
function pickPlayers(queue: Player[]): Player[] {
  const byGames = new Map<number, Player[]>();
  for (const p of queue) byGames.set(p.gamesPlayed, [...(byGames.get(p.gamesPlayed) ?? []), p]);
  return [...byGames.keys()]
    .sort((a, b) => a - b)
    .flatMap((g) => shuffle(byGames.get(g)!))
    .slice(0, 4);
}

const power = (team: Player[]) => team.reduce((sum, p) => sum + WEIGHT[p.level], 0);

/** Bagi 4 pemain jadi 2 tim: campuran wajib L+P vs L+P, selisih bobot level sekecil mungkin. */
function balanceTeams(four: Player[]): [Player[], Player[]] {
  const mixed = four.filter((p) => p.gender === 'L').length === 2;
  // 3 kemungkinan pembagian: pemain ke-0 dipasangkan dengan pemain ke-1, ke-2, atau ke-3
  let options = [1, 2, 3].map((i): [Player[], Player[]] => [
    [four[0], four[i]],
    four.filter((_, idx) => idx !== 0 && idx !== i),
  ]);
  if (mixed) options = options.filter(([t1]) => t1[0].gender !== t1[1].gender);
  const diff = ([a, b]: [Player[], Player[]]) => Math.abs(power(a) - power(b));
  const best = Math.min(...options.map(diff));
  return shuffle(options.filter((o) => diff(o) === best))[0];
}

const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

/** Export rekap seluruh pemain ke CSV (BOM ditambahkan agar terbaca benar di Excel). */
export function exportPlayersCsv(players: Player[]) {
  const rows: (string | number)[][] = [
    ['Name', 'Gender', 'Angkatan', 'Level', 'Games Played'],
    ...players.map((p) => [p.name, p.gender, p.angkatan, p.level, p.gamesPlayed]),
  ];
  const csv = '\uFEFF' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `rekap-badminton-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function useMatchmaker() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const queue = useMemo(
    () => players.filter((p) => !p.isPlaying).sort((a, b) => a.gamesPlayed - b.gamesPlayed),
    [players],
  );
  const emptyCourts = COURTS.filter((c) => !matches.some((m) => m.courtNumber === c));
  const canGenerate = queue.length >= 4 && emptyCourts.length > 0;
  const stats = { total: players.length, playing: players.length - queue.length, waiting: queue.length };

  const addPlayer = (data: NewPlayer) =>
    setPlayers((ps) => [...ps, { ...data, id: uid(), gamesPlayed: 0, isPlaying: false }]);

  const removePlayer = (id: string) => setPlayers((ps) => ps.filter((p) => p.id !== id));

  /** Tanpa argumen: pakai lapangan kosong pertama (prioritas Lapangan 1). */
  const generateMatch = (court?: CourtNumber) => {
    const target = court ?? emptyCourts[0];
    if (!target || !emptyCourts.includes(target) || queue.length < 4) return;
    const [team1, team2] = balanceTeams(pickPlayers(queue));
    const ids = new Set([...team1, ...team2].map((p) => p.id));
    setMatches((ms) => [...ms, { id: uid(), courtNumber: target, team1, team2, startTime: new Date() }]);
    setPlayers((ps) => ps.map((p) => (ids.has(p.id) ? { ...p, isPlaying: true } : p)));
  };

  const finishMatch = (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;
    const ids = new Set([...match.team1, ...match.team2].map((p) => p.id));
    setPlayers((ps) =>
      ps.map((p) => (ids.has(p.id) ? { ...p, isPlaying: false, gamesPlayed: p.gamesPlayed + 1 } : p)),
    );
    setMatches((ms) => ms.filter((m) => m.id !== matchId));
  };

  return { players, queue, matches, stats, canGenerate, addPlayer, removePlayer, generateMatch, finishMatch };
}
