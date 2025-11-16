import React, { useMemo, useState } from 'react';
import type { DailyTask } from '../types';
import { PlusIcon, TrashIcon, CheckCircleIcon } from './icons/Icon';

const STORAGE_KEY = 'life-tracker-daily-tasks';

const todayStr = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

function useDailyTasks() {
  const [tasks, setTasks] = useState<DailyTask[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as DailyTask[]) : [];
    } catch {
      return [];
    }
  });

  const persist = (next: DailyTask[]) => {
    setTasks(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    // Notify listeners (e.g., Sidebar) that daily tasks changed
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('daily-tasks-updated', { detail: { tasks: next } }));
    }
  };

  return { tasks, persist };
}

export const DailyView: React.FC = () => {
  const { tasks, persist } = useDailyTasks();
  const [title, setTitle] = useState('');
  const [progressText, setProgressText] = useState('');

  const today = todayStr();
  // Pending means not marked done today and still overall open
  const pending = useMemo(
    () => tasks.filter(t => t.status === 'open' && !t.history.some(h => h.date === today && h.status === 'done')),
    [tasks, today]
  );
  const dueToday = useMemo(
    () => pending.filter(task => task.history.some(h => h.date === today)),
    [pending, today]
  );
  const backlog = useMemo(
    () => pending.filter(task => !task.history.some(h => h.date === today)),
    [pending, today]
  );
  const doneToday = useMemo(
    () => tasks.filter(task => task.history.some(h => h.date === today && h.status === 'done')),
    [tasks, today]
  );

  const addTask = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const t = todayStr();
    const newTask: DailyTask = {
      id,
      title: trimmed,
      createdAt: now,
      status: 'open',
      history: [{ date: t, status: 'open' }],
    };
    persist([newTask, ...tasks]);
    setTitle('');
  };

  const updateProgress = (taskId: string) => {
    const t = todayStr();
    const trimmed = progressText.trim();
    const next = tasks.map(task => {
      if (task.id !== taskId) return task;
      const existing = task.history.find(h => h.date === t);
      if (existing) existing.progress = trimmed || existing.progress;
      else task.history.unshift({ date: t, status: 'open', progress: trimmed });
      return { ...task };
    });
    persist(next);
    setProgressText('');
  };

  const markDoneToday = (taskId: string) => {
    const t = todayStr();
    const next = tasks.map(task => {
      if (task.id !== taskId) return task;
      // set status done for today in history
      const existing = task.history.find(h => h.date === t);
      if (existing) existing.status = 'done';
      else task.history.unshift({ date: t, status: 'done' });
      // If done today, keep overall status open so it can reappear tomorrow as backlog if no new entry is added.
      // We'll roll-over automatically on next day render.
      return { ...task };
    });
    persist(next);
  };

  const deleteTask = (taskId: string) => {
    const next = tasks.filter(t => t.id !== taskId);
    persist(next);
  };

  // Backlog logic: Tasks without a history entry for today are considered backlog
  // (carryover). Tasks with today's entry and not done are "Due today".

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Daily Planner</h1>

      <div className="glass p-4 rounded-lg space-y-3">
        <h2 className="text-xl font-semibold">Add today's task</h2>
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e)=>setTitle(e.target.value)}
            placeholder="What’s in your list for today?"
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2"
          />
          <button onClick={addTask} className="px-3 py-2 rounded btn-gradient flex items-center gap-2">
            <PlusIcon /> Add
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass p-4 rounded-lg space-y-5">
          <div>
            <h3 className="text-lg font-semibold mb-3">Due today</h3>
            {dueToday.length === 0 ? (
              <p className="text-gray-400">Nothing due today yet.</p>
            ) : (
              <ul className="space-y-3">
                {dueToday.map(task => {
                  const todayHist = task.history.find(h => h.date === today);
                  const todayProgress = todayHist?.progress || '';
                  const isDoneToday = todayHist?.status === 'done';
                  return (
                    <li key={task.id} className="border border-gray-700 rounded p-3 bg-gray-900/60">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {todayProgress && (
                            <p className="text-sm text-gray-400">Today: {todayProgress}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => markDoneToday(task.id)}
                            className={`px-2 py-1 rounded ${isDoneToday ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                            title="Mark done for today"
                          >
                            <CheckCircleIcon />
                          </button>
                          <button onClick={() => deleteTask(task.id)} className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600" title="Delete task">
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <input
                          value={progressText}
                          onChange={(e)=>setProgressText(e.target.value)}
                          placeholder="Update today's progress..."
                          className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                        />
                        <button onClick={() => updateProgress(task.id)} className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm">Save</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Backlog from previous days</h3>
            {backlog.length === 0 ? (
              <p className="text-gray-400">No backlog. You’re all caught up.</p>
            ) : (
              <ul className="space-y-3">
                {backlog.map(task => {
                  const latest = task.history[0]; // most recent entry (not today)
                  const latestLabel = latest ? `${latest.date}: ${latest.progress || latest.status}` : '';
                  return (
                    <li key={task.id} className="border border-gray-700 rounded p-3 bg-gray-900/60">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {latestLabel && (
                            <p className="text-sm text-gray-400">Prev: {latestLabel}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateProgress(task.id)}
                            className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600"
                            title="Start today"
                          >
                            Start
                          </button>
                          <button onClick={() => deleteTask(task.id)} className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600" title="Delete task">
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <input
                          value={progressText}
                          onChange={(e)=>setProgressText(e.target.value)}
                          placeholder="Add today’s progress to bring it into ‘Due today’..."
                          className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                        />
                        <button onClick={() => updateProgress(task.id)} className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm">Save</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="glass p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Done today</h3>
          {doneToday.length === 0 ? (
            <p className="text-gray-400">No tasks marked done yet.</p>
          ) : (
            <ul className="space-y-3">
              {doneToday.map(task => (
                <li key={task.id} className="border border-gray-700 rounded p-3 bg-gray-900/60">
                  <div className="flex items-start justify-between">
                    <p className="font-medium">{task.title}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
