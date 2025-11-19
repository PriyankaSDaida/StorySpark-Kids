import React, { useState } from 'react';
import { AppView, Story } from './types';
import StoryCreator from './components/StoryCreator';
import CustomStoryBuilder from './components/CustomStoryBuilder';
import BookReader from './components/BookReader';
import ChatBot from './components/ChatBot';
import { BookOpen, MessageCircle, Sparkles, PenTool } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [activeStory, setActiveStory] = useState<Story | null>(null);

  const handleStoryCreated = (story: Story) => {
    setActiveStory(story);
    setCurrentView(AppView.BOOK_READER);
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.STORY_CREATOR:
        return (
          <StoryCreator 
            onStoryCreated={handleStoryCreated} 
            onBack={() => setCurrentView(AppView.HOME)} 
          />
        );
      case AppView.CUSTOM_CREATOR:
        return (
            <CustomStoryBuilder 
                onStoryCreated={handleStoryCreated}
                onBack={() => setCurrentView(AppView.HOME)}
            />
        );
      case AppView.BOOK_READER:
        return activeStory ? (
          <BookReader 
            story={activeStory} 
            onExit={() => setCurrentView(AppView.HOME)} 
          />
        ) : (
            <div className="flex flex-col items-center justify-center h-full">
                <p>No story found.</p>
                <button onClick={() => setCurrentView(AppView.HOME)}>Go Home</button>
            </div>
        );
      case AppView.CHAT:
        return <ChatBot onBack={() => setCurrentView(AppView.HOME)} />;
      case AppView.HOME:
      default:
        return (
          <div className="flex flex-col items-center justify-center w-full max-w-6xl mx-auto p-4 animate-fade-in">
            <div className="mb-12 text-center">
                <h1 className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 mb-4 tracking-tight pb-2">
                    StorySpark
                </h1>
                <p className="text-xl text-slate-500 font-medium">
                    Where your imagination comes to life!
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                {/* Create Magic Story Card */}
                <button 
                    onClick={() => setCurrentView(AppView.STORY_CREATOR)}
                    className="group relative bg-white p-8 rounded-[2rem] shadow-xl border-4 border-transparent hover:border-indigo-200 transition-all transform hover:-translate-y-2 hover:shadow-2xl text-left overflow-hidden h-full"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-15 transition-opacity">
                        <Sparkles size={120} className="text-indigo-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Sparkles size={28} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">Magic Maker</h2>
                        <p className="text-slate-500 font-medium">
                            Tell the AI an idea and watch it write a book for you instantly!
                        </p>
                    </div>
                </button>

                {/* Write Your Own Card */}
                <button 
                    onClick={() => setCurrentView(AppView.CUSTOM_CREATOR)}
                    className="group relative bg-white p-8 rounded-[2rem] shadow-xl border-4 border-transparent hover:border-purple-200 transition-all transform hover:-translate-y-2 hover:shadow-2xl text-left overflow-hidden h-full"
                >
                     <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-15 transition-opacity">
                        <PenTool size={120} className="text-purple-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <PenTool size={28} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-purple-600 transition-colors">Write Your Own</h2>
                        <p className="text-slate-500 font-medium">
                            Write your own story page by page and paint the pictures yourself!
                        </p>
                    </div>
                </button>

                {/* Chat Card */}
                <button 
                    onClick={() => setCurrentView(AppView.CHAT)}
                    className="group relative bg-white p-8 rounded-[2rem] shadow-xl border-4 border-transparent hover:border-rose-200 transition-all transform hover:-translate-y-2 hover:shadow-2xl text-left overflow-hidden h-full"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-15 transition-opacity">
                        <MessageCircle size={120} className="text-rose-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                            <MessageCircle size={28} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-rose-600 transition-colors">Chat with Spark</h2>
                        <p className="text-slate-500 font-medium">
                            Talk to your friendly AI companion about anything!
                        </p>
                    </div>
                </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-rose-50 flex items-center justify-center p-4 md:p-8">
      {renderView()}
    </div>
  );
}