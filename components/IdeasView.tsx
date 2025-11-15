
import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Idea } from '../types';
import { PencilIcon, TrashIcon, PlusIcon } from './icons/Icon';

export const IdeasView: React.FC = () => {
  const [ideas, setIdeas] = useLocalStorage<Idea[]>('life-tracker-ideas', []);
  const [newIdea, setNewIdea] = useState('');
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);

  const handleAddIdea = () => {
    if (newIdea.trim()) {
      setIdeas([...ideas, { id: Date.now().toString(), text: newIdea, createdAt: new Date().toISOString() }]);
      setNewIdea('');
    }
  };

  const handleUpdateIdea = () => {
    if (editingIdea && editingIdea.text.trim()) {
      setIdeas(ideas.map(idea => idea.id === editingIdea.id ? editingIdea : idea));
      setEditingIdea(null);
    }
  };
  
  const handleDeleteIdea = (id: string) => {
    if (window.confirm('Are you sure you want to delete this idea?')) {
        setIdeas(ideas.filter(idea => idea.id !== id));
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Capture Ideas</h1>
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg mb-6">
        <textarea
          value={newIdea}
          onChange={(e) => setNewIdea(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
        <button onClick={handleAddIdea} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
            <PlusIcon /> <span className="ml-2">Add Idea</span>
        </button>
      </div>

      <div className="space-y-4">
        {ideas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(idea => (
          <div key={idea.id} className="bg-gray-800 p-4 rounded-lg shadow-md flex justify-between items-start">
            {editingIdea?.id === idea.id ? (
              <div className="flex-1">
                <textarea
                  value={editingIdea.text}
                  onChange={(e) => setEditingIdea({ ...editingIdea, text: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                  rows={2}
                />
                <div className="mt-2 space-x-2">
                    <button onClick={handleUpdateIdea} className="px-3 py-1 bg-green-600 text-white rounded-md text-sm">Save</button>
                    <button onClick={() => setEditingIdea(null)} className="px-3 py-1 bg-gray-600 text-white rounded-md text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <p className="text-gray-200">{idea.text}</p>
                <p className="text-xs text-gray-500 mt-2">{new Date(idea.createdAt).toLocaleString()}</p>
              </div>
            )}
            <div className="flex space-x-2 ml-4">
              <button onClick={() => setEditingIdea(idea)} className="p-2 text-gray-400 hover:text-white"><PencilIcon /></button>
              <button onClick={() => handleDeleteIdea(idea.id)} className="p-2 text-gray-400 hover:text-red-500"><TrashIcon /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
