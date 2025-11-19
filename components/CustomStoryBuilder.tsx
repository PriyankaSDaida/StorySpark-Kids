import React, { useState } from 'react';
import { Story, StoryPage } from '../types';
import { generateIllustration } from '../services/gemini';
import { Plus, Trash2, Image as ImageIcon, Save, ArrowLeft, Bold, Italic, Loader2, Wand2 } from 'lucide-react';

interface CustomStoryBuilderProps {
  onStoryCreated: (story: Story) => void;
  onBack: () => void;
}

const CustomStoryBuilder: React.FC<CustomStoryBuilderProps> = ({ onStoryCreated, onBack }) => {
  const [title, setTitle] = useState('');
  const [pages, setPages] = useState<StoryPage[]>([
    { pageNumber: 1, text: '', imagePrompt: '' }
  ]);
  const [generatingImageFor, setGeneratingImageFor] = useState<number | null>(null);
  const [images, setImages] = useState<Record<number, string>>({});

  const addPage = () => {
    setPages([
      ...pages,
      { pageNumber: pages.length + 1, text: '', imagePrompt: '' }
    ]);
  };

  const removePage = (index: number) => {
    if (pages.length <= 1) return;
    const newPages = pages.filter((_, i) => i !== index).map((p, i) => ({ ...p, pageNumber: i + 1 }));
    setPages(newPages);
  };

  const updatePage = (index: number, field: keyof StoryPage, value: string) => {
    const newPages = [...pages];
    newPages[index] = { ...newPages[index], [field]: value };
    setPages(newPages);
  };

  const insertFormat = (index: number, tag: string) => {
    const textarea = document.getElementById(`page-text-${index}`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = pages[index].text;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    const newText = `${before}<${tag}>${selected}</${tag}>${after}`;
    updatePage(index, 'text', newText);
  };

  const handleGenerateImage = async (index: number) => {
    const prompt = pages[index].imagePrompt || pages[index].text;
    if (!prompt) return;

    setGeneratingImageFor(index);
    try {
      const imgUrl = await generateIllustration(prompt);
      setImages(prev => ({ ...prev, [index]: imgUrl }));
    } catch (e) {
      console.error(e);
      alert("Could not paint the picture just now. Try again!");
    } finally {
      setGeneratingImageFor(null);
    }
  };

  const handleFinish = () => {
    if (!title.trim()) {
        alert("Please give your story a title!");
        return;
    }
    // Merge generated images into the pages
    const finalPages = pages.map((p, i) => ({
        ...p,
        customImage: images[i]
    }));
    
    onStoryCreated({
        title,
        pages: finalPages
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 pb-24 animate-fade-in">
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-indigo-50/95 backdrop-blur z-20 py-4 border-b border-indigo-200">
        <button onClick={onBack} className="text-indigo-600 font-bold flex items-center gap-2">
          <ArrowLeft size={20} /> Exit
        </button>
        <h1 className="text-2xl font-bold text-indigo-900">Write Your Book</h1>
        <button 
          onClick={handleFinish}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 transition-transform transform hover:scale-105"
        >
          <Save size={20} /> Save & Read
        </button>
      </div>

      <div className="space-y-8">
        {/* Title Section */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-indigo-100">
            <label className="block text-indigo-900 font-bold text-lg mb-2">Story Title</label>
            <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="The Amazing Adventures of..."
                className="w-full text-2xl p-4 rounded-xl border-2 border-indigo-100 focus:border-indigo-500 outline-none"
            />
        </div>

        {/* Pages */}
        {pages.map((page, index) => (
            <div key={index} className="bg-white p-6 rounded-3xl shadow-lg border-2 border-indigo-50 relative">
                <div className="flex justify-between items-center mb-4">
                    <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full font-bold text-sm">
                        Page {index + 1}
                    </span>
                    {pages.length > 1 && (
                        <button onClick={() => removePage(index)} className="text-red-400 hover:text-red-600 p-2">
                            <Trash2 size={20} />
                        </button>
                    )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Left: Text */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="font-bold text-slate-700">Story Text</label>
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => insertFormat(index, 'b')}
                                    className="p-1 hover:bg-slate-100 rounded" title="Bold"
                                >
                                    <Bold size={18} className="text-slate-600" />
                                </button>
                                <button 
                                    onClick={() => insertFormat(index, 'i')}
                                    className="p-1 hover:bg-slate-100 rounded" title="Italic"
                                >
                                    <Italic size={18} className="text-slate-600" />
                                </button>
                            </div>
                        </div>
                        <textarea
                            id={`page-text-${index}`}
                            value={page.text}
                            onChange={(e) => updatePage(index, 'text', e.target.value)}
                            placeholder="Once upon a time..."
                            className="w-full h-48 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
                        />
                    </div>

                    {/* Right: Image */}
                    <div className="space-y-3">
                        <label className="font-bold text-slate-700">Illustration</label>
                        
                        {/* Generated Image Preview */}
                        <div className="aspect-square w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative flex items-center justify-center group">
                            {generatingImageFor === index ? (
                                <div className="text-indigo-500 flex flex-col items-center">
                                    <Loader2 size={32} className="animate-spin mb-2" />
                                    <span className="text-sm font-medium">Painting...</span>
                                </div>
                            ) : images[index] ? (
                                <img src={images[index]} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-slate-400 flex flex-col items-center text-center p-4">
                                    <ImageIcon size={32} className="mb-2" />
                                    <span className="text-sm">Describe the picture below and click paint!</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <input 
                                value={page.imagePrompt}
                                onChange={(e) => updatePage(index, 'imagePrompt', e.target.value)}
                                placeholder="Describe the picture..."
                                className="flex-grow p-2 px-3 rounded-lg border border-slate-200 text-sm"
                            />
                            <button 
                                onClick={() => handleGenerateImage(index)}
                                disabled={generatingImageFor === index}
                                className="bg-indigo-500 hover:bg-indigo-600 text-white p-2 px-4 rounded-lg font-medium flex items-center gap-2 text-sm shadow-md"
                            >
                                <Wand2 size={16} /> Paint
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        ))}

        <button 
            onClick={addPage}
            className="w-full py-4 border-2 border-dashed border-indigo-300 text-indigo-500 rounded-3xl hover:bg-indigo-50 font-bold flex items-center justify-center gap-2 transition-colors"
        >
            <Plus size={24} /> Add Another Page
        </button>
      </div>
    </div>
  );
};

export default CustomStoryBuilder;