
import React, { useState, useMemo } from 'react';
import { MOTIVATIONAL_QUOTES } from '../constants';
import { getLifeAnalysis } from '@/services/charanService';
import type { TimeFrameData } from '../types';
import { SparklesIcon } from './icons/Icon';

export const Dashboard: React.FC = () => {
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { quote, author } = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    return MOTIVATIONAL_QUOTES[randomIndex];
  }, []);
  
  const imageUrl = useMemo(() => `https://picsum.photos/seed/${quote.replace(/\s/g, '')}/1200/400`, [quote]);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalysis('');
    
    const weeklyData: TimeFrameData = JSON.parse(localStorage.getItem('life-tracker-Weekly') || 'null');
    const monthlyData: TimeFrameData = JSON.parse(localStorage.getItem('life-tracker-Monthly') || 'null');
    
    const data = {
        Weekly: weeklyData,
        Monthly: monthlyData
    };

    const result = await getLifeAnalysis(data);
    setAnalysis(result);
    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="relative rounded-lg overflow-hidden h-48 md:h-64 shadow-lg">
        <img src={imageUrl} alt="Motivational background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/50 to-transparent flex flex-col justify-center items-center text-center p-4">
          <p className="text-xl md:text-3xl font-semibold text-white">"{quote}"</p>
          <p className="text-sm md:text-lg text-gray-300 mt-2">- {author}</p>
        </div>
      </div>
      
      <div className="glass p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 flex items-center"><SparklesIcon /> <span className="ml-2">AI-Powered Self Analysis</span></h2>
        <p className="text-gray-400 mb-4">
          Click the button below to get an AI-powered analysis of your recent progress based on your weekly and monthly entries.
        </p>
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="flex items-center justify-center px-4 py-2 rounded-md btn-gradient disabled:opacity-70 transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : (
            'Analyze My Progress'
          )}
        </button>
        {analysis && (
          <div className="mt-6 p-4 bg-gray-900/70 rounded-md border border-gray-700 backdrop-blur">
            <h3 className="text-xl font-semibold mb-2">Your Analysis:</h3>
            <div className="prose prose-invert max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }}></div>
          </div>
        )}
      </div>
    </div>
  );
};
