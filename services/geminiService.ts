
import { GoogleGenAI } from "@google/genai";
import type { TimeFrameData, Habit } from '../types';

// Fix: Aligned with @google/genai guidelines to use process.env.API_KEY directly.
// Assumes the API key is pre-configured and available in the execution environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const getHabitSuggestions = async (habits: Habit[]): Promise<string> => {
  try {
    const habitSummary = habits.map(h => `- ${h.name} (Goal: ${h.goal} times, Current: ${h.progress.filter(Boolean).length} times)`).join('\n');
    const prompt = `
      You are a supportive and insightful life coach. Based on the following habits a user is tracking, provide 3-5 actionable, encouraging, and specific suggestions for improvement. Keep the tone positive and constructive. Format the response as a list.

      User's Habits:
      ${habitSummary}
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error getting habit suggestions:", error);
    return "Sorry, I couldn't generate suggestions at this time. Please try again later.";
  }
};


export const getLifeAnalysis = async (data: { [key: string]: TimeFrameData }): Promise<string> => {
    try {
    // Fix: Corrected the default data object to fully match the TimeFrameData type, preventing potential runtime errors.
    const weekly = data.Weekly || { goals: [], achievements: [], challenges: [], reflections: [], learnings: [], people: [], learningLinks: [] };
    const monthly = data.Monthly || { goals: [], achievements: [], challenges: [], reflections: [], learnings: [], people: [], learningLinks: [] };
    
    const prompt = `
      You are an insightful and empathetic personal development coach. Analyze the following life-tracking data for a user and provide a summary of their progress, identify recurring themes or patterns, and offer 3 concrete suggestions for growth.

      **Last Week's Data:**
      Achievements: ${weekly.achievements.map(a => `- ${a.text}`).join('\n') || 'None recorded.'}
      Challenges: ${weekly.challenges.map(c => `- ${c.text}`).join('\n') || 'None recorded.'}
      Reflections for Improvement: ${weekly.reflections.map(r => `- ${r.text}`).join('\n') || 'None recorded.'}
      Goals: ${weekly.goals.map(g => `- ${g.text} (Completed: ${g.completed})`).join('\n') || 'None recorded.'}

      **Last Month's Data:**
      Achievements: ${monthly.achievements.map(a => `- ${a.text}`).join('\n') || 'None recorded.'}
      Challenges: ${monthly.challenges.map(c => `- ${c.text}`).join('\n') || 'None recorded.'}
      Reflections for Improvement: ${monthly.reflections.map(r => `- ${r.text}`).join('\n') || 'None recorded.'}
      Goals: ${monthly.goals.map(g => `- ${g.text} (Completed: ${g.completed})`).join('\n') || 'None recorded.'}

      Based on this data, provide your analysis in a structured, easy-to-read format with a positive and encouraging tone. Use Markdown for formatting. Start with a brief "Overall Summary", then a section for "Key Themes", and finally a section for "Growth Suggestions".
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error getting life analysis:", error);
    return "Sorry, I couldn't generate an analysis at this time. Please try again later.";
  }
};
