import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CircleDollarSign,
  Gauge,
  Home,
  Landmark,
  Rocket,
  Settings,
  Shield,
  Trophy,
  User,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: Home },
  { label: 'Casino', icon: Landmark },
  { label: 'Crash Rocket', icon: Rocket, active: true },
  { label: 'Stats', icon: Trophy },
  { label: 'Fair Play', icon: Shield },
];

const seedHistory = [1.51, 2.03, 1.0, 1.0, 1.61, 1.35, 4.86];

const generateCrashPoint = () => {
  const r = Math.random();
  if (r < 0.35) return +(1 + Math.random() * 0.5).toFixed(2);
  if (r < 0.72) return +(1.5 + Math.random() * 1.8).toFixed(2);
  if (r < 0.93) return +(3.3 + Math.random() * 4.7).toFixed(2);
  return +(8 + Math.random() * 10).toFixed(2);
};

const formatPoints = (value: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);

function RocketShape({ running }: { running: boolean }) {
  return (
    <div className="relative h-16 w-28 -rotate-12">
      <div className="absolute left-5 top-4 h-8 w-14 rounded-full border border-white/10 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-950 shadow-[0_0_30px_rgba(255,255,255,0.06)]" />
      <div className="absolute left-[68px] top-[22px] h-4 w-7 rounded-r-full bg-slate-950" />
      <div className="absolute left-2 top-[26px] h-4 w-5 rounded-l-full bg-slate-600" />
      <div className="absolute left-10 top-1 h-6 w-3 -skew-x-12 rounded-t-sm bg-slate-700" />
      <div className="absolute left-10 top-10 h-6 w-3 skew-x-12 rounded-b-sm bg-slate-700" />
      <div className="absolute left-[18px] top-[24px] h-2 w-6 rounded-full bg-cyan-300/70 blur-[1px]" />
      <div className="absolute left-0 top-[24px] h-8 w-10">
        <div
          className={`absolute left-0 top-1/2 h-5 w-8 -translate-y-1/2 rounded-full bg-gradient-to-r from-orange-500 via-yellow-300 to-transparent blur-sm ${running ? 'opacity-100' : 'opacity-60'}`}
        />
        <div
          className={`absolute left-1 top-1/2 h-3 w-7 -translate-y-1/2 rounded-full bg-gradient-to-r from-red-500 via-orange-300 to-transparent ${running ? 'opacity-100' : 'opacity-60'}`}
        />
      </div>
    </div>
  );
}

function Chip({ value, latest = false }: { value: number; latest?: boolean }) {
  const isLow = value < 1.4;
  const isMedium = value >= 1.4 && value < 2.5;
  const tone = isLow
    ? 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/30'
    : isMedium
      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30'
      : 'bg-orange-500/20 text-orange-200 border-orange-400/30';

  return (
    <div
      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${tone} ${latest ? 'ring-1 ring-yellow-400/50' : ''}`}>
      {value.toFixed(2)}x
    </div>
  );
}

export default function CrashRocketDemo() {
  const [tab, setTab] = useState<'manual' | 'auto'>('manual');
  const [points, setPoints] = useState(12580);
  const [stake, setStake] = useState(120);
  const [autoCashout, setAutoCashout] = useState(2);
  const [multiplier, setMultiplier] = useState(1);
  const [status, setStatus] = useState<'idle' | 'running' | 'cashed' | 'crashed'>('idle');
  const [history, setHistory] = useState(seedHistory);
  const [message, setMessage] = useState(
    'Tap launch, then collect before the rocket crashes. Demo only.',
  );
  const [crashAt, setCrashAt] = useState(1.75);
  const [cashedAt, setCashedAt] = useState<number | null>(null);

  const animationRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const stars = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 2.4 + 1,
        delay: Math.random() * 2,
      })),
    [],
  );

  const profitPreview = Math.floor(stake * Math.max(1, tab === 'auto' ? autoCashout : multiplier));

  const stopLoop = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const endRound = (nextStatus: 'cashed' | 'crashed', endValue: number) => {
    setStatus(nextStatus);
    setHistory((prev) => [endValue, ...prev].slice(0, 8));

    if (nextStatus === 'crashed') {
      setMessage(`Crashed at ${endValue.toFixed(2)}x. Your demo points were lost this round.`);
    } else {
      setMessage(`Collected at ${endValue.toFixed(2)}x. Nice timing.`);
    }

    stopLoop();

    window.setTimeout(() => {
      setStatus('idle');
      setMultiplier(1);
      setCashedAt(null);
      startRef.current = null;
      setMessage('Ready for the next launch.');
    }, 1400);
  };

  const collect = () => {
    if (status !== 'running' || cashedAt !== null) return;

    const current = Math.max(1, multiplier);
    const reward = Math.floor(stake * current);
    setPoints((prev) => prev + reward);
    setCashedAt(current);
    endRound('cashed', current);
  };

  const launch = () => {
    if (status === 'running') return;
    if (stake <= 0 || stake > points) return;

    const nextCrash = generateCrashPoint();
    setPoints((prev) => prev - stake);
    setCrashAt(nextCrash);
    setMultiplier(1);
    setCashedAt(null);
    setStatus('running');
    setMessage('Rocket launched. Collect before it explodes.');
    startRef.current = performance.now();
  };

  useEffect(() => {
    if (status !== 'running') return;

    const tick = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const elapsed = now - startRef.current;
      const next = +(1 + elapsed / 1400 + (elapsed * elapsed) / 8000000).toFixed(2);
      setMultiplier(next);

      if (tab === 'auto' && next >= autoCashout && cashedAt === null) {
        const reward = Math.floor(stake * next);
        setPoints((prev) => prev + reward);
        setCashedAt(next);
        endRound('cashed', next);
        return;
      }

      if (next >= crashAt) {
        setMultiplier(crashAt);
        endRound('crashed', crashAt);
        return;
      }

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return stopLoop;
  }, [status, tab, autoCashout, crashAt, cashedAt, stake]);

  const rocketX = Math.min(10 + (multiplier - 1) * 11.5, 72);
  const rocketY = Math.min(8 + (multiplier - 1) * 7.5, 46);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-[250px] border-r border-white/5 bg-[#121212] lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-6 py-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-500 text-black shadow-[0_0_24px_rgba(255,210,50,0.35)]">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-black uppercase tracking-[0.22em] text-yellow-400">
                SC3
              </div>
              <div className="text-xs text-white/45">Crash demo</div>
            </div>
          </div>

          <nav className="space-y-1 px-3 py-3">
            {navItems.map(({ label, icon: Icon, active }) => (
              <button
                key={label}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${
                  active
                    ? 'bg-yellow-400/10 text-yellow-300 shadow-[inset_0_0_0_1px_rgba(250,204,21,0.18)]'
                    : 'text-white/65 hover:bg-white/5 hover:text-white'
                }`}>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto px-4 pb-5">
            <div className="rounded-3xl border border-yellow-400/10 bg-white/[0.03] p-4">
              <div className="mb-2 text-xs uppercase tracking-[0.28em] text-yellow-400/70">
                Demo note
              </div>
              <p className="text-sm leading-6 text-white/60">
                Front-end concept only. Uses virtual points, responsive layout, live multiplier
                animation, manual and auto modes.
              </p>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <header className="border-b border-white/5 bg-[#151515]/95 px-4 py-4 backdrop-blur xl:px-8">
            <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
              <div className="flex items-center gap-3 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-500 text-black">
                  <Rocket className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-black uppercase tracking-[0.22em] text-yellow-400">
                    SC3
                  </div>
                  <div className="text-[11px] text-white/45">Crash demo</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-yellow-400/25 bg-black/30 px-3 py-2 text-sm font-semibold text-yellow-200 shadow-[0_0_0_1px_rgba(250,204,21,0.08)]">
                  <CircleDollarSign className="h-4 w-4" />
                  {formatPoints(points)} PTS
                </div>
                <button className="rounded-2xl bg-gradient-to-r from-yellow-300 to-yellow-500 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-black shadow-[0_6px_30px_rgba(250,204,21,0.35)]">
                  Demo
                </button>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <User className="h-5 w-5 text-white/70" />
              </div>
            </div>
          </header>

          <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-4 py-5 xl:px-8 xl:py-8">
            <div>
              <div className="text-sm uppercase tracking-[0.28em] text-yellow-400/80">
                Originals
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">Crash Rocket</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55 md:text-base">
                Clean front-end demo inspired by the reference: dark casino-style shell, responsive
                control panel, animated live multiplier, manual/auto play, and safe demo points
                instead of real money.
              </p>
            </div>

            <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
              <section className="rounded-[28px] border border-white/8 bg-[#2a2a2a] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
                <div className="rounded-[24px] bg-[#1d1d1d] p-3 sm:p-4">
                  <div className="grid grid-cols-2 rounded-full bg-black/35 p-1">
                    {(['manual', 'auto'] as const).map((value) => (
                      <button
                        key={value}
                        onClick={() => setTab(value)}
                        className={`rounded-full px-4 py-2.5 text-sm font-semibold capitalize transition ${
                          tab === value
                            ? 'bg-white text-black shadow-[0_8px_22px_rgba(255,255,255,0.15)]'
                            : 'text-white/60 hover:text-white'
                        }`}>
                        {value}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
                        Demo points per round
                      </label>
                      <div className="flex items-center rounded-2xl border border-white/10 bg-[#2b2b2b] px-3">
                        <input
                          type="number"
                          min={10}
                          max={points}
                          step={10}
                          value={stake}
                          onChange={(e) => setStake(Math.max(10, Number(e.target.value) || 0))}
                          className="h-12 w-full bg-transparent text-lg font-semibold outline-none"
                        />
                        <div className="flex gap-1">
                          {[0.5, 2].map((factor) => (
                            <button
                              key={factor}
                              onClick={() =>
                                setStake((prev) => Math.max(10, Math.floor(prev * factor)))
                              }
                              className="rounded-lg border border-white/10 px-2 py-1 text-xs text-yellow-300 transition hover:bg-white/5">
                              {factor === 0.5 ? '½' : '2x'}
                            </button>
                          ))}
                          <button
                            onClick={() => setStake(points)}
                            className="rounded-lg border border-white/10 px-2 py-1 text-xs text-yellow-300 transition hover:bg-white/5">
                            max
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
                        Auto collect at
                      </label>
                      <div className="flex items-center rounded-2xl border border-white/10 bg-[#2b2b2b] px-3">
                        <Gauge className="mr-2 h-4 w-4 text-white/40" />
                        <input
                          type="number"
                          min={1.1}
                          max={20}
                          step={0.1}
                          value={autoCashout}
                          onChange={(e) =>
                            setAutoCashout(Math.max(1.1, Number(e.target.value) || 1.1))
                          }
                          className="h-12 w-full bg-transparent text-lg font-semibold outline-none"
                        />
                        <span className="text-white/40">x</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-white/35">
                        Projected payout
                      </div>
                      <div className="mt-2 text-2xl font-bold text-white">
                        {formatPoints(profitPreview)} pts
                      </div>
                      <div className="mt-1 text-sm text-white/45">
                        {tab === 'manual'
                          ? `Live estimate at ${multiplier.toFixed(2)}x`
                          : `Auto mode targets ${autoCashout.toFixed(2)}x`}
                      </div>
                    </div>

                    <button
                      onClick={status === 'running' ? collect : launch}
                      className={`h-14 w-full rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition ${
                        status === 'running'
                          ? 'bg-white text-black shadow-[0_12px_34px_rgba(255,255,255,0.18)] hover:scale-[0.99]'
                          : 'bg-gradient-to-r from-yellow-300 to-yellow-500 text-black shadow-[0_14px_34px_rgba(250,204,21,0.38)] hover:brightness-105'
                      }`}>
                      {status === 'running' ? 'Collect now' : 'Launch next round'}
                    </button>

                    <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/5 p-3 text-sm leading-6 text-emerald-100/75">
                      Demo only — no deposits, no real money, just front-end gameplay flow for
                      review.
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-white/8 bg-[#2a2a2a] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
                <div className="relative overflow-hidden rounded-[24px] border border-white/8 bg-[#020924]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(64,105,255,0.16),transparent_40%),radial-gradient(circle_at_bottom,rgba(0,191,255,0.06),transparent_35%)]" />
                  <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 px-3 py-3 md:px-5">
                    <div className="flex flex-wrap gap-2 pr-3">
                      {history.map((value, index) => (
                        <Chip key={`${value}-${index}`} value={value} latest={index === 0} />
                      ))}
                    </div>
                    <button className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white">
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="relative h-[440px] sm:h-[520px] lg:h-[620px]">
                    {stars.map((star) => (
                      <motion.div
                        key={star.id}
                        className="absolute rounded-full bg-white"
                        style={{
                          left: `${star.left}%`,
                          top: `${star.top}%`,
                          width: star.size,
                          height: star.size,
                          opacity: 0.45,
                        }}
                        animate={{ opacity: [0.2, 0.7, 0.25] }}
                        transition={{ duration: 2.4, repeat: Infinity, delay: star.delay }}
                      />
                    ))}

                    <div className="pointer-events-none absolute left-0 right-0 top-24 z-20 text-center">
                      <motion.div
                        key={status + multiplier.toFixed(2)}
                        initial={{ scale: 0.96, opacity: 0.75 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`text-5xl font-black tracking-tight sm:text-6xl md:text-7xl ${
                          status === 'crashed' ? 'text-red-400' : 'text-yellow-100'
                        }`}>
                        {multiplier.toFixed(2)}x
                      </motion.div>
                      <div className="mt-3 text-sm uppercase tracking-[0.28em] text-white/60">
                        Live multiplier
                      </div>
                    </div>

                    <div className="absolute inset-x-0 bottom-8 z-20 flex justify-center px-4">
                      <div className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-center text-sm text-white/65 backdrop-blur">
                        {message}
                      </div>
                    </div>

                    <motion.div
                      className="absolute z-10"
                      animate={{
                        left: `${rocketX}%`,
                        bottom: `${rocketY}%`,
                        scale: status === 'crashed' ? 0.9 : 1,
                        opacity: status === 'crashed' ? 0.15 : 1,
                      }}
                      transition={{ type: 'spring', stiffness: 70, damping: 18, mass: 0.7 }}>
                      <RocketShape running={status === 'running'} />
                    </motion.div>

                    <div className="absolute inset-0 z-[5]">
                      <svg
                        className="h-full w-full"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="trail" x1="0" x2="1" y1="1" y2="0">
                            <stop offset="0%" stopColor="rgba(250,204,21,0.02)" />
                            <stop offset="30%" stopColor="rgba(250,204,21,0.12)" />
                            <stop offset="100%" stopColor="rgba(250,204,21,0.5)" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 8 90 Q 24 76 34 64 T 48 50 T 64 35 T 84 16"
                          fill="none"
                          stroke="url(#trail)"
                          strokeWidth="0.7"
                          strokeDasharray="1 2"
                        />
                      </svg>
                    </div>

                    <AnimatePresence>
                      {status === 'crashed' && (
                        <motion.div
                          initial={{ scale: 0.2, opacity: 0 }}
                          animate={{ scale: 1.2, opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute z-20"
                          style={{ left: `${rocketX}%`, bottom: `${rocketY}%` }}>
                          <div className="relative h-28 w-28 -translate-x-1/2 translate-y-1/2">
                            <motion.div
                              className="absolute inset-0 rounded-full bg-orange-400/50 blur-xl"
                              animate={{ scale: [0.5, 1.2, 0.8], opacity: [0.3, 0.9, 0.15] }}
                              transition={{ duration: 0.7 }}
                            />
                            <motion.div
                              className="absolute inset-[18%] rounded-full bg-yellow-300/80 blur-md"
                              animate={{ scale: [0.4, 1, 0.7], opacity: [0.4, 1, 0.15] }}
                              transition={{ duration: 0.7, delay: 0.05 }}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
