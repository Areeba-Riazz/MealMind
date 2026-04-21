import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import {
  type MealPlannerByWeek,
  type MealSlot,
  ensureWeekShape,
  mondayOfWeek,
  saveMealPlannerDocument,
  subscribeMealPlanner,
  weekStartISO,
} from '../lib/firestoreUserData';

const SLOTS: { key: MealSlot; label: string; emoji: string }[] = [
  { key: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { key: 'lunch', label: 'Lunch', emoji: '☀️' },
  { key: 'dinner', label: 'Dinner', emoji: '🌙' },
  { key: 'snack', label: 'Snack', emoji: '🍎' },
];

const FOOD_HINTS = [
  'Oatmeal with berries',
  'Paratha & omelette',
  'Chicken karahi & roti',
  'Daal chawal',
  'Grilled chicken salad',
  'Biryani',
  'Shami burger',
  'Smoothie bowl',
];

function storageKey(uid: string) {
  return `mealmind_mealplanner_${uid}`;
}

function loadLocal(uid: string): MealPlannerByWeek {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return {};
    const o = JSON.parse(raw) as MealPlannerByWeek;
    return typeof o === 'object' && o ? o : {};
  } catch {
    return {};
  }
}

function persistLocal(uid: string, byWeek: MealPlannerByWeek) {
  localStorage.setItem(storageKey(uid), JSON.stringify(byWeek));
}

function addDays(monday: Date, n: number): Date {
  const d = new Date(monday);
  d.setDate(monday.getDate() + n);
  return d;
}

function formatWeekRangeLabel(monday: Date): string {
  const sun = addDays(monday, 6);
  const o = { month: 'short', day: 'numeric' } as const;
  const a = monday.toLocaleDateString('en-PK', o);
  const b = sun.toLocaleDateString('en-PK', { ...o, year: 'numeric' });
  return `${a} – ${b}`;
}

function dayShort(d: Date): string {
  return d.toLocaleDateString('en-PK', { weekday: 'short' });
}

/** 0 = Monday … 6 = Sunday within the same week as `monday`. */
function indexOfDateInWeek(monday: Date, day: Date): number {
  const a = new Date(monday);
  a.setHours(0, 0, 0, 0);
  const b = new Date(day);
  b.setHours(0, 0, 0, 0);
  const idx = Math.round((b.getTime() - a.getTime()) / 86400000);
  return Math.max(0, Math.min(6, idx));
}

function parseISOLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function MealPlannerPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const useRemote = Boolean(uid && db);

  const [anchorMonday, setAnchorMonday] = useState(() => mondayOfWeek(new Date()));
  const [byWeek, setByWeek] = useState<MealPlannerByWeek>({});
  const [selectedDayIndex, setSelectedDayIndex] = useState(() =>
    indexOfDateInWeek(mondayOfWeek(new Date()), new Date())
  );

  const weekKey = weekStartISO(anchorMonday);
  const weekShape = useMemo(() => ensureWeekShape(byWeek, weekKey), [byWeek, weekKey]);
  const daysForWeek = weekShape[weekKey] ?? {};

  const monday = useMemo(() => parseISOLocal(weekKey), [weekKey]);
  const selectedDate = useMemo(() => addDays(monday, selectedDayIndex), [monday, selectedDayIndex]);
  const selectedDayISO = toISODate(selectedDate);

  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedulePersist = useCallback(
    (next: MealPlannerByWeek) => {
      if (!uid) return;
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(async () => {
        const doc = { updatedAt: new Date().toISOString(), byWeek: next };
        if (useRemote) {
          try {
            await saveMealPlannerDocument(uid, doc);
          } catch (e) {
            console.error('[MealMind] meal planner save:', e);
            persistLocal(uid, next);
          }
        } else {
          persistLocal(uid, next);
        }
      }, 450);
    },
    [uid, useRemote]
  );

  useEffect(() => {
    if (!uid) return;
    if (!useRemote) {
      setByWeek(loadLocal(uid));
      return;
    }
    let cancelled = false;
    const unsub = subscribeMealPlanner(
      uid,
      (data) => {
        if (cancelled) return;
        if (data?.byWeek) setByWeek(data.byWeek);
        else setByWeek(loadLocal(uid));
      },
      () => {
        if (!cancelled) setByWeek(loadLocal(uid));
      }
    );
    return () => {
      cancelled = true;
      unsub();
    };
  }, [uid, useRemote]);

  const patchSlot = (dayISO: string, slot: MealSlot, updater: (prev: string[]) => string[]) => {
    setByWeek((prev) => {
      const merged = ensureWeekShape({ ...prev }, weekKey);
      const days = { ...merged[weekKey] };
      const cur = { ...days[dayISO] };
      const list = [...(cur[slot] ?? [])];
      cur[slot] = updater(list);
      days[dayISO] = cur as (typeof days)[string];
      const next = { ...merged, [weekKey]: days };
      schedulePersist(next);
      return next;
    });
  };

  const shiftWeek = (delta: number) => {
    setAnchorMonday((m) => {
      const n = new Date(m);
      n.setDate(m.getDate() + delta * 7);
      return mondayOfWeek(n);
    });
    setSelectedDayIndex(0);
  };

  const plan = daysForWeek[selectedDayISO];

  return (
    <>
      <style>{`
        .mp-wrap { max-width: 720px; margin: 0 auto; animation: mpfade 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes mpfade { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }

        .mp-head { margin-bottom: 1.35rem; }
        .mp-head h2 { font-family:'Syne',sans-serif; font-size:1.2rem; font-weight:800; margin:0 0 0.35rem; color:var(--text); }
        .mp-head p { font-size:0.84rem; color:var(--muted); margin:0; line-height:1.45; }

        .mp-toolbar {
          display:flex; flex-wrap:wrap; align-items:center; gap:0.75rem;
          padding:1rem 1.15rem; margin-bottom:1.1rem;
          background:var(--dash-card-bg); border:1px solid var(--border2); border-radius:16px;
        }
        .mp-week-nav { display:flex; align-items:center; gap:0.45rem; flex-wrap:wrap; flex:1; min-width:0; }
        .mp-nav-btn {
          font:600 0.8rem 'DM Sans',sans-serif; cursor:pointer; padding:0.4rem 0.85rem; border-radius:100px;
          border:1px solid var(--border2); background:var(--input-bg); color:var(--text);
          transition:all 0.18s;
        }
        .mp-nav-btn:hover { border-color:rgba(232,82,42,0.45); color:var(--accent); }
        .mp-week-label { font:700 0.82rem 'DM Sans',sans-serif; color:var(--text); margin:0 0.35rem; }

        .mp-cal-wrap { display:flex; align-items:center; gap:0.45rem; font-size:0.78rem; color:var(--muted); }
        .mp-cal-wrap input[type="date"] {
          font:600 0.78rem 'DM Sans',sans-serif; padding:0.38rem 0.65rem; border-radius:10px;
          border:1px solid var(--border2); background:var(--input-bg); color:var(--text);
          cursor:pointer;
        }
        .mp-cal-wrap input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; }
        [data-theme='dark'] .mp-cal-wrap input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.85); }

        .mp-days-row { display:flex; gap:0.4rem; flex-wrap:wrap; margin-bottom:1.15rem; }
        .mp-day-chip {
          font:600 0.76rem 'DM Sans',sans-serif; cursor:pointer; padding:0.5rem 0.75rem; border-radius:12px;
          border:1px solid var(--border2); background:var(--input-bg); color:var(--muted);
          transition:all 0.18s; min-width:3.2rem; text-align:center;
        }
        .mp-day-chip:hover { border-color:rgba(232,82,42,0.35); color:rgba(255,255,255,0.75); }
        .mp-day-chip.on { border-color:rgba(232,82,42,0.55); background:rgba(232,82,42,0.12); color:var(--accent); }
        .mp-day-chip .mp-dn { display:block; font-size:0.65rem; font-weight:600; opacity:0.55; margin-top:0.12rem; }

        .mp-panel {
          background:var(--dash-card-bg); border:1px solid var(--border2); border-radius:18px; padding:1.25rem 1.35rem;
          backdrop-filter:blur(12px);
        }
        .mp-panel-title {
          font:800 0.72rem 'Syne',sans-serif; letter-spacing:0.06em; text-transform:uppercase; color:var(--muted);
          margin:0 0 1rem; padding-bottom:0.75rem; border-bottom:1px solid var(--border);
        }
        .mp-panel-title strong { color:var(--text); font-size:1.05rem; letter-spacing:0; text-transform:none; font-family:'DM Sans',sans-serif; }

        .mp-slot { margin-bottom:1.15rem; }
        .mp-slot:last-child { margin-bottom:0; }
        .mp-slot-h {
          font:600 0.78rem 'DM Sans',sans-serif; color:var(--muted); margin:0 0 0.5rem;
          display:flex; align-items:center; gap:0.4rem;
        }
        .mp-items { list-style:none; margin:0 0 0.5rem; padding:0; display:flex; flex-direction:column; gap:0.32rem; }
        .mp-item {
          display:flex; align-items:center; justify-content:space-between; gap:0.5rem;
          font-size:0.84rem; color:var(--text); padding:0.4rem 0.55rem; border-radius:10px;
          background:var(--input-bg); border:1px solid var(--border2);
        }
        .mp-item button {
          flex-shrink:0; border:none; background:transparent; color:rgba(255,255,255,0.28); cursor:pointer; font-size:1.1rem; line-height:1; padding:0 0.2rem;
        }
        .mp-item button:hover { color:#ff8a8a; }

        .mp-add { display:flex; flex-direction:column; gap:0.4rem; }
        .mp-add input {
          width:100%; box-sizing:border-box; padding:0.55rem 0.7rem; border-radius:10px; border:1px solid var(--border2);
          background:var(--input-bg); color:var(--text); font:0.8rem 'DM Sans',sans-serif; outline:none;
        }
        .mp-add input:focus { border-color:var(--accent); }
        .mp-add-row { display:flex; gap:0.4rem; }
        .mp-add-btn {
          font:600 0.75rem 'DM Sans',sans-serif; cursor:pointer; padding:0.5rem 0.85rem; border-radius:100px; border:none;
          background:var(--accent); color:#fff; white-space:nowrap;
        }
        .mp-add-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .mp-hints { display:flex; flex-wrap:wrap; gap:0.35rem; }
        .mp-hint {
          font:500 0.65rem 'DM Sans',sans-serif; cursor:pointer; padding:0.25rem 0.55rem; border-radius:100px;
          border:1px solid var(--border2); background:var(--input-bg); color:var(--muted);
        }
        .mp-hint:hover { border-color:rgba(232,82,42,0.35); color:var(--accent); }

        .mp-note { margin-top:1.35rem; font-size:0.78rem; color:var(--muted); opacity:0.5; line-height:1.5; }
      `}</style>

      <div className="mp-wrap">
        <div className="mp-head">
          <h2>📅 Meal planner</h2>
          <p>
            Pick a day, then add meals by slot. Use the calendar to jump to any date — your week updates
            automatically.
          </p>
        </div>

        <div className="mp-toolbar">
          <div className="mp-week-nav">
            <button type="button" className="mp-nav-btn" onClick={() => shiftWeek(-1)} aria-label="Previous week">
              ←
            </button>
            <span className="mp-week-label">{formatWeekRangeLabel(monday)}</span>
            <button type="button" className="mp-nav-btn" onClick={() => shiftWeek(1)} aria-label="Next week">
              →
            </button>
            <button
              type="button"
              className="mp-nav-btn"
              onClick={() => {
                const m = mondayOfWeek(new Date());
                setAnchorMonday(m);
                setSelectedDayIndex(indexOfDateInWeek(m, new Date()));
              }}
            >
              This week
            </button>
          </div>
          <div className="mp-cal-wrap">
            <span>Jump to</span>
            <input
              type="date"
              value={selectedDayISO}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) return;
                const d = new Date(v + 'T12:00:00');
                const m = mondayOfWeek(d);
                setAnchorMonday(m);
                setSelectedDayIndex(indexOfDateInWeek(m, d));
              }}
              aria-label="Pick a date"
            />
          </div>
        </div>

        <div className="mp-days-row" role="tablist" aria-label="Days this week">
          {Array.from({ length: 7 }, (_, i) => {
            const d = addDays(monday, i);
            const iso = toISODate(d);
            const isToday = toISODate(new Date()) === iso;
            return (
              <button
                key={iso}
                type="button"
                role="tab"
                aria-selected={selectedDayIndex === i}
                className={`mp-day-chip${selectedDayIndex === i ? ' on' : ''}`}
                onClick={() => setSelectedDayIndex(i)}
              >
                {dayShort(d)}
                <span className="mp-dn">
                  {d.getDate()}
                  {isToday ? ' · today' : ''}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mp-panel">
          <p className="mp-panel-title">
            {selectedDate.toLocaleDateString('en-PK', { weekday: 'long', month: 'long', day: 'numeric' })}
            <strong> · {selectedDayISO}</strong>
          </p>

          {SLOTS.map(({ key: slot, label, emoji }) => (
            <div key={slot} className="mp-slot">
              <p className="mp-slot-h">
                {emoji} {label}
              </p>
              <ul className="mp-items">
                {(plan?.[slot] ?? []).map((text, idx) => (
                  <li key={`${text}-${idx}`} className="mp-item">
                    <span>{text}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${text}`}
                      onClick={() =>
                        patchSlot(selectedDayISO, slot, (list) => list.filter((_, j) => j !== idx))
                      }
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <SlotAdd
                onAdd={(t) => patchSlot(selectedDayISO, slot, (list) => [...list, t])}
                slotLabel={label}
              />
            </div>
          ))}
        </div>

        <p className="mp-note">
          Tip: generate a dish in AI Chef, then paste the name into a slot. Plans sync to your account when
          Firestore is enabled; otherwise they stay in this browser.
        </p>
      </div>
    </>
  );
}

function SlotAdd({ onAdd, slotLabel }: { onAdd: (text: string) => void; slotLabel: string }) {
  const [q, setQ] = useState('');
  const hints = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return FOOD_HINTS.slice(0, 6);
    return FOOD_HINTS.filter((h) => h.toLowerCase().includes(s)).slice(0, 6);
  }, [q]);

  const submit = () => {
    const t = q.trim();
    if (!t) return;
    onAdd(t);
    setQ('');
  };

  return (
    <div className="mp-add">
      <div className="mp-add-row">
        <input
          type="search"
          placeholder={`Add to ${slotLabel.toLowerCase()}…`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button type="button" className="mp-add-btn" disabled={!q.trim()} onClick={submit}>
          Add
        </button>
      </div>
      <div className="mp-hints">
        {hints.map((h) => (
          <button key={h} type="button" className="mp-hint" onClick={() => onAdd(h)}>
            + {h}
          </button>
        ))}
      </div>
    </div>
  );
}
