
import { GoogleGenAI } from "@google/genai";
import type { TimeFrameData, Habit } from '../types';

// Safely resolve API key for both Vite (frontend) and Node (backend) contexts.
// Keep variable name GEMINI_API_KEY intact per project requirement.
const resolveApiKey = (): string | undefined => {
  // Prefer Vite-exposed key when running in the browser
  const viteKey = (typeof import.meta !== 'undefined' && (import.meta as any).env)
    ? (import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.GEMINI_API_KEY
    : undefined;
  if (viteKey) return viteKey as string;
  // Fallbacks for Node/server or define-replaced values
  if (typeof process !== 'undefined') {
    return process.env.GEMINI_API_KEY || (process as any).env?.API_KEY;
  }
  return undefined;
};

const getClient = (): GoogleGenAI | null => {
  try {
    const key = resolveApiKey();
    if (!key) return null;
    return new GoogleGenAI({ apiKey: key });
  } catch (e) {
    console.error('Failed to initialize AI client:', e);
    return null;
  }
};

export const getHabitSuggestions = async (habits: Habit[]): Promise<string> => {
  try {
    const habitSummary = habits.map(h => `- ${h.name} (Goal: ${h.goal} times, Current: ${h.progress.filter(Boolean).length} times)`).join('\n');
    const prompt = `
      You are a supportive and insightful life coach. Based on the following habits a user is tracking, provide 3-5 actionable, encouraging, and specific suggestions for improvement. Keep the tone positive and constructive. Format the response as a list.

      User's Habits:
      ${habitSummary}
    `;
    const client = getClient();
    if (!client) return "AI is not configured. Please set GEMINI_API_KEY and try again.";
    const response = await client.models.generateContent({
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

    const client = getClient();
    if (!client) return "AI is not configured. Please set GEMINI_API_KEY and try again.";
    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error getting life analysis:", error);
    return "Sorry, I couldn't generate an analysis at this time. Please try again later.";
  }
};
