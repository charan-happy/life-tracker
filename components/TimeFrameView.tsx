
import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Period, TimeFrameData, Goal, ReviewEntry, ReviewCategory, LearningLink } from '../types';
import { PencilIcon, TrashIcon, PlusIcon } from './icons/Icon';

interface TimeFrameViewProps {
  period: Period;
}

const categoryLabels: Record<ReviewCategory, string> = {
  achievements: 'Achievements',
  challenges: 'Challenges Overcome',
  reflections: 'How I Can Become a Better Person',
  learnings: 'What I Learned',
  people: 'Best People I Met & What I Learned',
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="glass p-6 rounded-lg shadow-lg mb-6">
    <h2 className="text-2xl font-bold mb-4">{title}</h2>
    {children}
  </div>
);

export const TimeFrameView: React.FC<TimeFrameViewProps> = ({ period }) => {
  const [data, setData] = useLocalStorage<TimeFrameData>(`life-tracker-${period}`, {
    goals: [],
    achievements: [],
    challenges: [],
    reflections: [],
    learnings: [],
    people: [],
    learningLinks: []
  });
  
  const [newGoal, setNewGoal] = useState('');
  const [newEntryText, setNewEntryText] = useState('');
  const [currentCategory, setCurrentCategory] = useState<ReviewCategory>('achievements');
  const [newLink, setNewLink] = useState({ url: '', description: ''});

  // Generic handler for adding review entries
  const handleAddReviewEntry = () => {
    if (newEntryText.trim()) {
      const newEntry: ReviewEntry = { id: Date.now().toString(), text: newEntryText };
      setData(prevData => ({
        ...prevData,
        [currentCategory]: [...prevData[currentCategory], newEntry]
      }));
      setNewEntryText('');
    }
  };

  const handleDeleteReviewEntry = (category: ReviewCategory, id: string) => {
    if(window.confirm('Are you sure?')) {
        setData(prevData => ({
            ...prevData,
            [category]: prevData[category].filter(entry => entry.id !== id)
        }));
    }
  };
  
  // Handlers for goals
  const handleAddGoal = () => {
    if (newGoal.trim()) {
        const goal: Goal = { id: Date.now().toString(), text: newGoal, completed: false };
        setData(prevData => ({ ...prevData, goals: [...prevData.goals, goal] }));
        setNewGoal('');
    }
  };
  
  const toggleGoal = (id: string) => {
      setData(prevData => ({
          ...prevData,
          goals: prevData.goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g)
      }));
  };

  const handleDeleteGoal = (id: string) => {
    if(window.confirm('Are you sure?')) {
        setData(prevData => ({ ...prevData, goals: prevData.goals.filter(g => g.id !== id) }));
    }
  };

  // Handlers for learning links
  const handleAddLink = () => {
    if (newLink.url.trim() && newLink.description.trim()) {
      const link: LearningLink = { ...newLink, id: Date.now().toString() };
      setData(prevData => ({ ...prevData, learningLinks: [...prevData.learningLinks, link] }));
      setNewLink({ url: '', description: '' });
    }
  };

  const handleDeleteLink = (id: string) => {
    if(window.confirm('Are you sure?')) {
      setData(prevData => ({ ...prevData, learningLinks: prevData.learningLinks.filter(l => l.id !== id) }));
    }
  };


  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">{period} Review & Goals</h1>

      {/* GOALS SECTION */}
      <Section title={`${period} Goals`}>
        <div className="flex gap-2 mb-4">
            <input type="text" value={newGoal} onChange={e => setNewGoal(e.target.value)} placeholder="Set a new goal..." className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <button onClick={handleAddGoal} className="px-4 py-2 rounded-md btn-gradient flex items-center"><PlusIcon /></button>
        </div>
        <ul className="space-y-2">
            {data.goals.map(goal => (
        <li key={goal.id} className="flex items-center justify-between bg-gray-700/80 p-3 rounded-md">
                    <span className={`cursor-pointer ${goal.completed ? 'line-through text-gray-500' : ''}`} onClick={() => toggleGoal(goal.id)}>{goal.text}</span>
                    <button onClick={() => handleDeleteGoal(goal.id)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon /></button>
                </li>
            ))}
        </ul>
      </Section>
      
      {/* REVIEW SECTION */}
      <Section title={`${period} Review`}>
         <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-700 pb-4">
            {Object.keys(categoryLabels).map(cat => (
                <button key={cat} onClick={() => { setCurrentCategory(cat as ReviewCategory); setNewEntryText(''); }} className={`px-3 py-1 rounded-full text-sm ${currentCategory === cat ? 'bg-indigo-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}>{categoryLabels[cat as ReviewCategory]}</button>
            ))}
         </div>
         <div className="flex gap-2 mb-4">
             <input type="text" value={newEntryText} onChange={e => setNewEntryText(e.target.value)} placeholder={`Add ${categoryLabels[currentCategory]}...`} className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
       <button onClick={handleAddReviewEntry} className="px-4 py-2 rounded-md btn-gradient flex items-center"><PlusIcon /></button>
         </div>
         <h3 className="font-semibold text-lg mb-2">{categoryLabels[currentCategory]}</h3>
         <ul className="space-y-2">
            {data[currentCategory].map(entry => (
        <li key={entry.id} className="flex items-center justify-between bg-gray-700/80 p-3 rounded-md">
                    <span>{entry.text}</span>
                    <button onClick={() => handleDeleteReviewEntry(currentCategory, entry.id)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon /></button>
                </li>
            ))}
            {data[currentCategory].length === 0 && <p className="text-gray-500">No entries yet.</p>}
         </ul>
      </Section>
      
      {/* LEARNING LINKS SECTION */}
      <Section title={`${period} Learning Plan`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
          <input type="text" value={newLink.description} onChange={e => setNewLink({...newLink, description: e.target.value})} placeholder="Description (e.g., React Hooks Tutorial)" className="md:col-span-2 p-2 bg-gray-700 border border-gray-600 rounded-md" />
          <input type="url" value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} placeholder="https://example.com" className="p-2 bg-gray-700 border border-gray-600 rounded-md" />
        </div>
    <button onClick={handleAddLink} className="px-4 py-2 rounded-md btn-gradient flex items-center"><PlusIcon /> <span className="ml-2">Add Link</span></button>
        <ul className="space-y-2 mt-4">
            {data.learningLinks.map(link => (
        <li key={link.id} className="flex items-center justify-between bg-gray-700/80 p-3 rounded-md">
                    <div>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{link.description}</a>
                        <p className="text-xs text-gray-500">{link.url}</p>
                    </div>
                    <button onClick={() => handleDeleteLink(link.id)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon /></button>
                </li>
            ))}
        </ul>
      </Section>
    </div>
  );
};
