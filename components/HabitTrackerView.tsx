
import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Habit } from '../types';
import { PlusIcon, SparklesIcon, TrashIcon } from './icons/Icon';
import { getHabitSuggestions } from '@/services/charanService';

const DEFAULT_HABITS: Habit[] = [
    { id: 'h1', name: 'Exercise for 30 minutes', goal: 5, progress: Array(7).fill(false) },
    { id: 'h2', name: 'Read 10 pages of a book', goal: 7, progress: Array(7).fill(false) },
    { id: 'h3', name: 'Meditate for 10 minutes', goal: 7, progress: Array(7).fill(false) },
    { id: 'h4', name: 'Practice a skill for 20 minutes', goal: 4, progress: Array(7).fill(false) },
];

export const HabitTrackerView: React.FC = () => {
    const [habits, setHabits] = useLocalStorage<Habit[]>('life-tracker-habits', DEFAULT_HABITS);
    const [newHabitName, setNewHabitName] = useState('');
    const [newHabitGoal, setNewHabitGoal] = useState(5);
    const [suggestions, setSuggestions] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleToggleProgress = (habitId: string, dayIndex: number) => {
        setHabits(habits.map(habit => 
            habit.id === habitId 
            ? { ...habit, progress: habit.progress.map((p, i) => i === dayIndex ? !p : p) } 
            : habit
        ));
    };

    const handleAddHabit = () => {
        if (newHabitName.trim()) {
            const newHabit: Habit = {
                id: Date.now().toString(),
                name: newHabitName,
                goal: newHabitGoal,
                progress: Array(7).fill(false)
            };
            setHabits([...habits, newHabit]);
            setNewHabitName('');
            setNewHabitGoal(5);
        }
    };

    const handleDeleteHabit = (id: string) => {
        if (window.confirm('Are you sure you want to delete this habit?')) {
            setHabits(habits.filter(h => h.id !== id));
        }
    };
    
    const fetchSuggestions = async () => {
        setIsLoading(true);
        setSuggestions('');
        const result = await getHabitSuggestions(habits);
        setSuggestions(result);
        setIsLoading(false);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Habit Tracker</h1>
        <div className="glass p-6 rounded-lg shadow-lg mb-6">
                <h2 className="text-xl font-bold mb-4">Add a New Habit</h2>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input type="text" value={newHabitName} onChange={e => setNewHabitName(e.target.value)} placeholder="e.g., Drink 8 glasses of water" className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-md" />
                    <div className="flex items-center gap-2">
                        <label htmlFor="goal" className="text-sm">Goal (weekly):</label>
                        <input type="number" id="goal" value={newHabitGoal} onChange={e => setNewHabitGoal(parseInt(e.target.value))} min="1" max="7" className="w-16 p-2 bg-gray-700 border border-gray-600 rounded-md" />
                    </div>
                    <button onClick={handleAddHabit} className="px-4 py-2 rounded-md btn-gradient flex items-center justify-center"><PlusIcon /></button>
                </div>
            </div>

            <div className="space-y-4 mb-8">
                {habits.map(habit => (
                    <div key={habit.id} className="glass p-4 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-3">
                            <div>
                               <p className="font-semibold text-lg">{habit.name}</p>
                               <p className="text-sm text-gray-400">
                                 Progress: {habit.progress.filter(Boolean).length} / {habit.goal} this week
                               </p>
                            </div>
                            <button onClick={() => handleDeleteHabit(habit.id)} className="p-2 text-gray-400 hover:text-red-500"><TrashIcon /></button>
                        </div>
                        <div className="flex justify-around items-center">
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                                <div key={index} className="flex flex-col items-center gap-1">
                                    <span className="text-xs text-gray-500">{day}</span>
                                    <button
                                        onClick={() => handleToggleProgress(habit.id, index)}
                                        className={`w-8 h-8 rounded-full border-2 transition-colors ${
                                            habit.progress[index] ? 'bg-green-500 border-green-400' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                                        }`}
                                    ></button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="glass p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 flex items-center"><SparklesIcon /> <span className="ml-2">AI Improvement Suggestions</span></h2>
                <button
                    onClick={fetchSuggestions}
                    disabled={isLoading}
                    className="flex items-center justify-center px-4 py-2 rounded-md btn-gradient disabled:opacity-60 transition-colors"
                >
                    {isLoading ? 'Getting suggestions...' : 'Get Suggestions'}
                </button>
                {suggestions && (
                    <div className="mt-6 p-4 bg-gray-900/70 rounded-md border border-gray-700 backdrop-blur">
                        <h3 className="text-xl font-semibold mb-2">Suggestions for you:</h3>
                        <div className="prose prose-invert max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: suggestions.replace(/\n/g, '<br />') }}></div>
                    </div>
                )}
            </div>
        </div>
    );
};
