import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { sendChatMessage } from '../services/gemini';
import { Send, Bot, User, Sparkles } from 'lucide-react';

const ChatBot: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Hi there! I'm StorySpark. I love talking about stories, space, dinosaurs, and magic! What do you want to talk about?", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      const responseText = await sendChatMessage(messages, input);
      const botMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: ChatMessage = { role: 'model', text: "Oops! My brain got a little fuzzy. Can you say that again?", timestamp: Date.now() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-[85vh] w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-indigo-100">
      {/* Header */}
      <div className="bg-indigo-500 p-4 flex items-center justify-between text-white shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
             <Bot size={28} />
          </div>
          <div>
             <h2 className="font-bold text-lg">Chat with StorySpark</h2>
             <p className="text-xs text-indigo-100">Your AI Friend</p>
          </div>
        </div>
        <button onClick={onBack} className="text-sm bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-full transition">
            Close Chat
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-indigo-50 to-white">
        {messages.map((msg, i) => (
          <div key={i} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
               <div className={`w-10 h-10 min-w-10 rounded-full flex items-center justify-center shadow-sm
                    ${msg.role === 'user' ? 'bg-rose-400 text-white' : 'bg-indigo-400 text-white'}`}>
                  {msg.role === 'user' ? <User size={20} /> : <Sparkles size={20} />}
               </div>
               <div className={`p-4 rounded-2xl text-lg leading-relaxed shadow-sm
                    ${msg.role === 'user' 
                        ? 'bg-rose-100 text-rose-900 rounded-tr-none' 
                        : 'bg-white text-slate-800 rounded-tl-none border border-indigo-100'
                    }`}>
                  {msg.text}
               </div>
            </div>
          </div>
        ))}
        
        {isThinking && (
          <div className="flex w-full justify-start">
             <div className="flex gap-3 max-w-[80%]">
                <div className="w-10 h-10 rounded-full bg-indigo-400 text-white flex items-center justify-center">
                   <Sparkles size={20} className="animate-spin" />
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-indigo-100 text-slate-500 italic flex items-center gap-2">
                   Thinking<span className="animate-bounce">.</span><span className="animate-bounce delay-75">.</span><span className="animate-bounce delay-150">.</span>
                </div>
             </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-indigo-50">
        <div className="flex gap-3 items-center bg-slate-100 rounded-full p-2 pl-6 focus-within:ring-2 focus-within:ring-indigo-300 transition-all">
           <input 
             type="text"
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && handleSend()}
             placeholder="Ask me anything..."
             className="flex-grow bg-transparent outline-none text-lg text-slate-700 placeholder-slate-400"
           />
           <button 
             onClick={handleSend}
             disabled={!input.trim() || isThinking}
             className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 text-white p-3 rounded-full transition-colors shadow-md"
           >
             <Send size={24} />
           </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
