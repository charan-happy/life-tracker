
import React, { useEffect, useState } from 'react';
import type { View } from '../types';
import { HomeIcon, LightbulbIcon, CalendarIcon, CheckCircleIcon, SparklesIcon } from './icons/Icon';
import { loadCloudData, saveCloudData } from '../services/api';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

// Fix: Changed JSX.Element to React.ReactNode to resolve "Cannot find namespace 'JSX'" error.
const navItems: { view: View; label: string; icon: React.ReactNode }[] = [
  { view: 'Dashboard', label: 'Dashboard', icon: <HomeIcon /> },
  { view: 'Ideas', label: 'Ideas', icon: <LightbulbIcon /> },
  { view: 'Weekly', label: 'Weekly', icon: <CalendarIcon /> },
  { view: 'Monthly', label: 'Monthly', icon: <CalendarIcon /> },
  { view: 'Yearly', label: 'Yearly', icon: <CalendarIcon /> },
  { view: 'Habits', label: 'Habits', icon: <CheckCircleIcon /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const [userId, setUserId] = useState('');
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    const existing = localStorage.getItem('life-tracker-user-id');
    if (existing) setUserId(existing);
  }, []);

  const generateId = () => {
    const id = crypto.randomUUID();
    setUserId(id);
    localStorage.setItem('life-tracker-user-id', id);
  };

  const handleSave = async () => {
    if (!userId) return setSyncMsg('Set a user id first');
    const payload = {
      ideas: JSON.parse(localStorage.getItem('life-tracker-ideas') || '[]'),
      habits: JSON.parse(localStorage.getItem('life-tracker-habits') || '[]'),
      Weekly: JSON.parse(localStorage.getItem('life-tracker-Weekly') || 'null'),
      Monthly: JSON.parse(localStorage.getItem('life-tracker-Monthly') || 'null'),
      Yearly: JSON.parse(localStorage.getItem('life-tracker-Yearly') || 'null'),
    };
    const res = await saveCloudData(userId, payload);
    setSyncMsg(res.ok ? 'Saved to cloud' : (res.message || 'Save failed'));
    setTimeout(() => setSyncMsg(null), 2500);
  };

  const handleLoad = async () => {
    if (!userId) return setSyncMsg('Set a user id first');
    const data = await loadCloudData(userId);
    if (!data) {
      setSyncMsg('Nothing found');
      setTimeout(() => setSyncMsg(null), 2500);
      return;
    }
    // Persist to localStorage for the app to pick up
    localStorage.setItem('life-tracker-ideas', JSON.stringify((data as any).ideas ?? []));
    localStorage.setItem('life-tracker-habits', JSON.stringify((data as any).habits ?? []));
    if ((data as any).Weekly) localStorage.setItem('life-tracker-Weekly', JSON.stringify((data as any).Weekly));
    if ((data as any).Monthly) localStorage.setItem('life-tracker-Monthly', JSON.stringify((data as any).Monthly));
    if ((data as any).Yearly) localStorage.setItem('life-tracker-Yearly', JSON.stringify((data as any).Yearly));
    setSyncMsg('Loaded from cloud');
    setTimeout(() => setSyncMsg(null), 2500);
  };

  return (
    <nav className="w-16 md:w-64 bg-gray-900/70 glass border-r border-gray-700 p-2 md:p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center space-x-2 mb-10 px-2">
          <SparklesIcon />
          <h1 className="text-xl font-bold hidden md:block bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">Life Tracker</h1>
        </div>
        <ul>
          {navItems.map((item) => (
            <li key={item.view}>
              <button
                onClick={() => setCurrentView(item.view)}
                className={`w-full flex items-center space-x-3 p-3 my-1 rounded-lg transition-colors duration-200 ${
                  currentView === item.view
                    ? 'btn-gradient text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="hidden md:block">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="hidden md:block text-xs text-gray-400 space-y-2">
        <div className="space-y-2">
          <label className="block text-[11px] uppercase tracking-wide text-gray-500">Cloud Sync ID</label>
          <div className="flex gap-2">
            <input value={userId} onChange={(e)=>{setUserId(e.target.value); localStorage.setItem('life-tracker-user-id', e.target.value);}} placeholder="your-id" className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200" />
            <button onClick={generateId} className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600">New</button>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex-1 px-2 py-1 rounded btn-gradient">Save</button>
            <button onClick={handleLoad} className="flex-1 px-2 py-1 rounded bg-gray-700 hover:bg-gray-600">Load</button>
          </div>
          {syncMsg && <p className="text-[11px] text-gray-400">{syncMsg}</p>}
        </div>
        <p className="text-center">Powered by Gemini</p>
      </div>
    </nav>
  );
};
