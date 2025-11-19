import React, { useState } from 'react';
import { generateStory } from '../services/gemini';
import { Story } from '../types';
import { Wand2, Star, Rocket, Book, Loader2 } from 'lucide-react';

interface StoryCreatorProps {
  onStoryCreated: (story: Story) => void;
  onBack: () => void;
}

const StoryCreator: React.FC<StoryCreatorProps> = ({ onStoryCreated, onBack }) => {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!topic.trim()) return;
    
    setIsLoading(true);
    setError('');
    try {
      const story = await generateStory(topic);
      onStoryCreated(story);
    } catch (e) {
        console.error(e);
      setError('Oops! The magic wand stuttered. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "A dragon who loves ice cream",
    "A robot who goes to school",
    "A magical forest behind the sofa",
    "A bunny flying to the moon"
  ];

  return (
    <div className="w-full max-w-2xl mx-auto p-6 flex flex-col items-center animate-fade-in">
      <h1 className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2 text-center tracking-tight">
        Create a Magic Story
      </h1>
      <p className="text-slate-500 text-lg mb-10 text-center">
        What should your story be about today?
      </p>

      <div className="w-full bg-white rounded-3xl shadow-xl p-8 border-4 border-indigo-50 relative overflow-hidden">
        
        {/* Decorative Elements */}
        <Star className="absolute top-4 left-4 text-yellow-400 opacity-50" size={32} />
        <Rocket className="absolute bottom-4 right-4 text-rose-400 opacity-50" size={32} />

        <div className="mb-6">
          <label className="block text-indigo-900 font-bold text-lg mb-3 ml-2">
            Tell me an idea...
          </label>
          <input 
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., A cat who becomes a pirate"
            className="w-full text-2xl p-5 rounded-2xl border-2 border-indigo-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all bg-indigo-50/50 placeholder-indigo-200 text-indigo-900"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
            {suggestions.map((s, i) => (
                <button 
                    key={i}
                    onClick={() => setTopic(s)}
                    className="bg-white border border-indigo-100 hover:border-indigo-300 text-indigo-400 text-sm px-4 py-2 rounded-full transition-colors"
                >
                    {s}
                </button>
            ))}
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-xl text-center border border-red-100">
                {error}
            </div>
        )}

        <button 
          onClick={handleCreate}
          disabled={isLoading || !topic.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-2xl font-bold py-5 rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <>
                <Loader2 className="animate-spin" size={32} />
                Writing your story...
            </>
          ) : (
            <>
                <Wand2 className="animate-pulse" size={32} />
                Make Magic Happen!
            </>
          )}
        </button>
      </div>
      
      <button onClick={onBack} className="mt-8 text-slate-400 hover:text-slate-600 font-medium flex items-center gap-2">
         <Book size={18} /> Back to Home
      </button>
    </div>
  );
};

export default StoryCreator;
