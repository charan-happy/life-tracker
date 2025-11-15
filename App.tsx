
import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { IdeasView } from './components/IdeasView';
import { TimeFrameView } from './components/TimeFrameView';
import { HabitTrackerView } from './components/HabitTrackerView';
import type { View } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('Dashboard');

  const renderView = useCallback(() => {
    switch (currentView) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Ideas':
        return <IdeasView />;
      case 'Weekly':
        return <TimeFrameView period="Weekly" />;
      case 'Monthly':
        return <TimeFrameView period="Monthly" />;
      case 'Yearly':
        return <TimeFrameView period="Yearly" />;
      case 'Habits':
        return <HabitTrackerView />;
      default:
        return <Dashboard />;
    }
  }, [currentView]);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
