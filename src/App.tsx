import { useState, type FormEvent } from 'react';
import { CheckCircle2, Download, Feather, LogOut, Play, UserPlus } from 'lucide-react';
import { COURTS, exportPlayersCsv, useMatchmaker } from './useMatchmaker';
import type { CourtNumber, Gender, Match, NewPlayer, Player, SkillLevel } from './types';

const LEVEL_STYLE: Record<SkillLevel, string> = {
  A: 'bg-amber-100 text-amber-800 ring-amber-300',
  B: 'bg-sky-100 text-sky-800 ring-sky-300',
  C: 'bg-slate-200 text-slate-700 ring-slate-300',
};

const LevelBadge = ({ level }: { level: SkillLevel }) => (
  <span
    className={`inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded px-1 text-xs font-bold ring-1 ${LEVEL_STYLE[level]}`}
  >
    {level}
  </span>
);

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="min-w-20 rounded-xl bg-emerald-800/60 px-4 py-2 text-center">
    <div className="text-2xl font-bold leading-none">{value}</div>
    <div className="mt-1 text-xs text-emerald-100">{label}</div>
  </div>
);

const card = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5';
const segment = (active: boolean) =>
  `flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
    active
      ? 'border-emerald-600 bg-emerald-600 text-white'
      : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
  }`;

function AddPlayerForm({ onAdd }: { onAdd: (p: NewPlayer) => void }) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('L');
  const [angkatan, setAngkatan] = useState('');
  const [level, setLevel] = useState<SkillLevel>('B');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), gender, angkatan: angkatan.trim(), level });
    setName(''); // gender, angkatan, level dipertahankan agar input berurutan lebih cepat
  };

  const input =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-2 focus:outline-emerald-600/30';

  return (
    <form onSubmit={submit} className={`${card} space-y-4`}>
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <UserPlus className="size-5 text-emerald-600" /> Tambah pemain
      </h2>
      <label className="block text-sm font-medium text-slate-600">
        Nama
        <input className={`${input} mt-1`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama pemain" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-sm font-medium text-slate-600">Gender</span>
          <div className="mt-1 flex gap-2">
            {(['L', 'P'] as Gender[]).map((g) => (
              <button type="button" key={g} onClick={() => setGender(g)} className={segment(gender === g)} aria-pressed={gender === g}>
                {g}
              </button>
            ))}
          </div>
        </div>
        <label className="block text-sm font-medium text-slate-600">
          Angkatan
          <input className={`${input} mt-1`} value={angkatan} onChange={(e) => setAngkatan(e.target.value)} placeholder="2023" inputMode="numeric" />
        </label>
      </div>
      <div>
        <span className="text-sm font-medium text-slate-600">Level</span>
        <div className="mt-1 flex gap-2">
          {(['A', 'B', 'C'] as SkillLevel[]).map((l) => (
            <button type="button" key={l} onClick={() => setLevel(l)} className={segment(level === l)} aria-pressed={level === l}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <button
        type="submit"
        disabled={!name.trim()}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Daftarkan Pemain
      </button>
    </form>
  );
}

function WaitingList({ queue, onLeave }: { queue: Player[]; onLeave: (id: string) => void }) {
  return (
    <section className={card}>
      <h2 className="text-lg font-semibold">
        Antrean <span className="text-sm font-normal text-slate-500">({queue.length} pemain, yang paling sedikit main di atas)</span>
      </h2>
      {queue.length === 0 ? (
        <p className="mt-3 rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">
          Antrean kosong. Daftarkan pemain lewat formulir di atas.
        </p>
      ) : (
        <ul className="mt-2 max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
          {queue.map((p) => (
            <li key={p.id} className="flex items-center gap-2 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{p.name}</div>
                <div className="text-xs text-slate-500">
                  {p.gender === 'L' ? 'Laki-laki' : 'Perempuan'}, angkatan {p.angkatan || '-'}
                </div>
              </div>
              <LevelBadge level={p.level} />
              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                {p.gamesPlayed}x main
              </span>
              <button
                onClick={() => onLeave(p.id)}
                aria-label={`Pulangkan ${p.name}`}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
              >
                <LogOut className="size-3.5" /> Pulang
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const Team = ({ label, players }: { label: string; players: Player[] }) => (
  <div>
    <div className="text-xs font-medium text-emerald-100">{label}</div>
    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-semibold sm:text-lg">
      {players.map((p, i) => (
        <span key={p.id} className="inline-flex items-center gap-1.5">
          {i > 0 && <span className="mr-0.5 text-emerald-200">&amp;</span>}
          {p.name} <LevelBadge level={p.level} />
        </span>
      ))}
    </div>
  </div>
);

interface CourtProps {
  court: CourtNumber;
  match?: Match;
  canGenerate: boolean;
  onGenerate: (court: CourtNumber) => void;
  onFinish: (matchId: string) => void;
}

function CourtCard({ court, match, canGenerate, onGenerate, onFinish }: CourtProps) {
  return (
    <div className={card}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Lapangan {court}</h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${match ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}
        >
          {match ? `Mulai ${match.startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : 'Kosong'}
        </span>
      </div>

      {match ? (
        <>
          <div className="rounded-xl bg-emerald-700 p-4 text-white ring-2 ring-inset ring-white/60">
            <Team label="Tim 1" players={match.team1} />
            <div className="my-3 flex items-center gap-3 text-xs text-emerald-200">
              <span className="flex-1 border-t-2 border-dashed border-white/50" />
              vs
              <span className="flex-1 border-t-2 border-dashed border-white/50" />
            </div>
            <Team label="Tim 2" players={match.team2} />
          </div>
          <button
            onClick={() => onFinish(match.id)}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 font-semibold text-white hover:bg-slate-900"
          >
            <CheckCircle2 className="size-5" /> Pertandingan Selesai
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 px-4 py-8 text-center">
          <p className="font-medium text-slate-600">Lapangan {court} Kosong</p>
          <button
            onClick={() => onGenerate(court)}
            disabled={!canGenerate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 text-lg font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Play className="size-5" /> GENERATE MATCH
          </button>
          {!canGenerate && <p className="text-xs text-slate-500">Butuh minimal 4 pemain di antrean.</p>}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { players, queue, matches, stats, canGenerate, addPlayer, removePlayer, generateMatch, finishMatch } =
    useMatchmaker();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="bg-emerald-700 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Feather className="size-7" /> Badminton Matchmaker
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Stat label="Total pemain" value={stats.total} />
            <Stat label="Sedang main" value={stats.playing} />
            <Stat label="Antrean" value={stats.waiting} />
            <button
              onClick={() => exportPlayersCsv(players)}
              disabled={players.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="size-4" /> Export to CSV
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[23rem_1fr]">
        <div className="space-y-6">
          <AddPlayerForm onAdd={addPlayer} />
          <WaitingList queue={queue} onLeave={removePlayer} />
        </div>
        <section className="grid content-start gap-6 xl:grid-cols-2">
          {COURTS.map((c) => (
            <CourtCard
              key={c}
              court={c}
              match={matches.find((m) => m.courtNumber === c)}
              canGenerate={canGenerate}
              onGenerate={generateMatch}
              onFinish={finishMatch}
            />
          ))}
        </section>
      </main>
    </div>
  );
}
