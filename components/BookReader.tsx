import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Story } from '../types';
import { generateIllustration, generateSpeech } from '../services/gemini';
import { decodeBase64, decodeAudioData, playBuffer } from '../utils/audioUtils';
import { ArrowLeft, ArrowRight, Volume2, Loader2, RefreshCw, BookOpen, Mic, MicOff, Play, Square, Heart } from 'lucide-react';

interface BookReaderProps {
  story: Story;
  onExit: () => void;
}

const BookReader: React.FC<BookReaderProps> = ({ story, onExit }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [images, setImages] = useState<Record<number, string>>({});
  const [audioCache, setAudioCache] = useState<Record<number, AudioBuffer>>({});
  const [userRecordings, setUserRecordings] = useState<Record<number, string>>({}); // Blob URLs
  
  const [loadingImage, setLoadingImage] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isPlayingUser, setIsPlayingUser] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [dedicationUrl, setDedicationUrl] = useState<string | null>(story.dedicationAudio || null);
  const [showDedicationModal, setShowDedicationModal] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const userAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio Context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    // HTML5 Audio for user recordings
    userAudioRef.current = new Audio();
    userAudioRef.current.onended = () => setIsPlayingUser(false);

    return () => {
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
      if (activeSourceRef.current) activeSourceRef.current.stop();
      if (userAudioRef.current) {
          userAudioRef.current.pause();
          userAudioRef.current.src = '';
      }
    };
  }, []);

  const pageData = story.pages[currentPage];

  // Fetch Image for current page if not exists
  useEffect(() => {
    const fetchImage = async () => {
      if (images[currentPage] || loadingImage) return;

      // Use pre-generated custom image if available
      if (pageData.customImage) {
         setImages(prev => ({ ...prev, [currentPage]: pageData.customImage! }));
         return;
      }
      
      setLoadingImage(true);
      try {
        const imgUrl = await generateIllustration(pageData.imagePrompt);
        setImages(prev => ({ ...prev, [currentPage]: imgUrl }));
      } catch (error) {
        console.error("Image gen error:", error);
      } finally {
        setLoadingImage(false);
      }
    };
    fetchImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]); 

  // Fetch TTS Audio
  useEffect(() => {
    const fetchAudio = async () => {
        stopAllAudio();

        if (audioCache[currentPage] || loadingAudio) return;

        setLoadingAudio(true);
        try {
            // Strip HTML tags for TTS
            const cleanText = pageData.text.replace(/<[^>]*>/g, '');
            const base64Audio = await generateSpeech(cleanText);
            if (audioContextRef.current) {
                const audioBytes = decodeBase64(base64Audio);
                const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000);
                setAudioCache(prev => ({ ...prev, [currentPage]: audioBuffer }));
            }
        } catch (error) {
            console.error("Audio gen error:", error);
        } finally {
            setLoadingAudio(false);
        }
    };
    fetchAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const stopAllAudio = () => {
      if (activeSourceRef.current) {
          try { activeSourceRef.current.stop(); } catch(e){}
          activeSourceRef.current = null;
      }
      if (userAudioRef.current) {
          userAudioRef.current.pause();
          userAudioRef.current.currentTime = 0;
      }
      setIsPlayingTTS(false);
      setIsPlayingUser(false);
  };

  const playTTS = useCallback(() => {
    if (!audioContextRef.current || !audioCache[currentPage]) return;
    stopAllAudio();

    const source = playBuffer(audioCache[currentPage], audioContextRef.current);
    activeSourceRef.current = source;
    setIsPlayingTTS(true);

    source.onended = () => setIsPlayingTTS(false);
  }, [audioCache, currentPage]);

  const playUserAudio = (url: string) => {
      if (!userAudioRef.current) return;
      stopAllAudio();
      userAudioRef.current.src = url;
      userAudioRef.current.play();
      setIsPlayingUser(true);
  };

  // Recording Logic
  const startRecording = async (forDedication: boolean = false) => {
      stopAllAudio();
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;
          audioChunksRef.current = [];

          recorder.ondataavailable = (e) => {
              if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };

          recorder.onstop = () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
              const audioUrl = URL.createObjectURL(audioBlob);
              
              if (forDedication) {
                  setDedicationUrl(audioUrl);
              } else {
                  setUserRecordings(prev => ({ ...prev, [currentPage]: audioUrl }));
              }
              
              // Clean up tracks
              stream.getTracks().forEach(track => track.stop());
          };

          recorder.start();
          setIsRecording(true);
      } catch (err) {
          console.error("Error accessing mic:", err);
          alert("We need microphone access to record your voice!");
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };

  const nextPage = () => {
    if (currentPage < story.pages.length - 1) {
      setCurrentPage(p => p + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6">
        <button onClick={onExit} className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-2">
          <BookOpen size={20} /> Back to Library
        </button>
        <h2 className="text-xl md:text-2xl font-bold text-indigo-900 text-center truncate max-w-md">
            {story.title}
        </h2>
        
        <button 
            onClick={() => setShowDedicationModal(true)}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold transition-colors ${dedicationUrl ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-500'}`}
        >
            <Heart size={16} className={dedicationUrl ? "fill-current" : ""} />
            {dedicationUrl ? "Dedication" : "Add Dedication"}
        </button>
      </div>

      {/* Dedication Modal */}
      {showDedicationModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-rose-200 animate-bounce-in">
                  <h3 className="text-2xl font-bold text-rose-500 mb-4 text-center">A Special Message</h3>
                  <p className="text-slate-600 mb-6 text-center">Record a message to go with this story!</p>
                  
                  <div className="flex justify-center gap-4 mb-6">
                    {!isRecording ? (
                        <button 
                            onClick={() => startRecording(true)}
                            className="bg-rose-500 hover:bg-rose-600 text-white p-4 rounded-full shadow-lg"
                        >
                            <Mic size={32} />
                        </button>
                    ) : (
                         <button 
                            onClick={stopRecording}
                            className="bg-slate-700 hover:bg-slate-800 text-white p-4 rounded-full shadow-lg animate-pulse"
                        >
                            <Square size={32} />
                        </button>
                    )}
                  </div>

                  {dedicationUrl && !isRecording && (
                      <div className="flex justify-center mb-6">
                           <button 
                                onClick={() => playUserAudio(dedicationUrl)}
                                className="flex items-center gap-2 bg-rose-100 text-rose-600 px-4 py-2 rounded-full font-bold"
                           >
                               <Play size={20} /> Play Message
                           </button>
                      </div>
                  )}

                  <div className="flex justify-center">
                      <button onClick={() => setShowDedicationModal(false)} className="text-slate-400 hover:text-slate-600 font-medium">
                          Close
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Book Content */}
      <div className="bg-white rounded-3xl shadow-2xl w-full overflow-hidden border-4 border-indigo-100 flex flex-col md:flex-row min-h-[500px]">
        
        {/* Image Section */}
        <div className="w-full md:w-1/2 bg-slate-100 relative flex items-center justify-center min-h-[300px] md:min-h-full group">
          {loadingImage ? (
            <div className="flex flex-col items-center gap-4 text-indigo-400 animate-pulse">
              <Loader2 size={48} className="animate-spin" />
              <p className="font-medium">Painting your story...</p>
            </div>
          ) : images[currentPage] ? (
            <img 
              src={images[currentPage]} 
              alt={`Illustration for page ${currentPage + 1}`}
              className="w-full h-full object-cover animate-fade-in"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
               <p>Waiting for magic...</p>
            </div>
          )}
          
          {/* Regenerate Button */}
          {!loadingImage && images[currentPage] && !pageData.customImage && (
             <button 
               onClick={() => { setImages(p => { const n = {...p}; delete n[currentPage]; return n; }); }}
               className="absolute top-4 right-4 bg-white/80 p-2 rounded-full hover:bg-white text-indigo-600 shadow-sm backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
               title="Redraw"
             >
               <RefreshCw size={16} />
             </button>
          )}
        </div>

        {/* Text Section */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative bg-orange-50/30">
            <div className="flex-grow flex items-center">
                <div 
                    className="text-xl md:text-2xl leading-relaxed font-medium text-slate-700 text-center md:text-left"
                    dangerouslySetInnerHTML={{ __html: pageData.text }} 
                />
            </div>

            {/* Controls Container */}
            <div className="mt-8 flex flex-col gap-4">
                {/* Main TTS Control */}
                <button
                    onClick={isPlayingTTS ? stopAllAudio : playTTS}
                    disabled={loadingAudio || !audioCache[currentPage]}
                    className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-bold text-lg transition-all shadow-md
                        ${loadingAudio 
                            ? 'bg-slate-200 text-slate-400 cursor-wait' 
                            : isPlayingTTS 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-indigo-500 text-white hover:bg-indigo-600'
                        }
                    `}
                >
                    {loadingAudio ? (
                        <Loader2 size={24} className="animate-spin" />
                    ) : (
                        <Volume2 size={24} className={isPlayingTTS ? 'animate-pulse' : ''} />
                    )}
                    {loadingAudio ? "Loading Voice..." : isPlayingTTS ? "Stop Reading" : "Read to Me"}
                </button>

                {/* User Recording Controls */}
                <div className="flex gap-3">
                    {/* Record Button */}
                    <button
                        onClick={isRecording ? stopRecording : () => startRecording(false)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all shadow-sm border-2
                            ${isRecording 
                                ? 'bg-red-50 border-red-200 text-red-500 animate-pulse' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }
                        `}
                    >
                        {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                        {isRecording ? "Stop Rec" : "Record Me"}
                    </button>

                    {/* Play Recording Button */}
                    {userRecordings[currentPage] && (
                        <button
                            onClick={() => isPlayingUser ? stopAllAudio() : playUserAudio(userRecordings[currentPage])}
                            disabled={isRecording}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all shadow-sm border-2
                                ${isPlayingUser
                                    ? 'bg-green-100 border-green-300 text-green-600' 
                                    : 'bg-white border-slate-200 text-green-600 hover:bg-green-50'
                                }
                            `}
                        >
                             <Play size={20} /> Play My Voice
                        </button>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between w-full mt-8 px-4">
        <button 
            onClick={prevPage} 
            disabled={currentPage === 0}
            className={`p-4 rounded-full shadow-md transition-all flex items-center justify-center
                ${currentPage === 0 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-white text-indigo-600 hover:bg-indigo-50 hover:scale-110'
                }`}
        >
            <ArrowLeft size={32} />
        </button>
        
        <div className="text-indigo-300 font-bold text-xl self-center">
             {currentPage + 1} / {story.pages.length}
        </div>

        <button 
            onClick={nextPage}
            disabled={currentPage === story.pages.length - 1}
            className={`p-4 rounded-full shadow-md transition-all flex items-center justify-center
                ${currentPage === story.pages.length - 1
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-white text-indigo-600 hover:bg-indigo-50 hover:scale-110'
                }`}
        >
            <ArrowRight size={32} />
        </button>
      </div>
    </div>
  );
};

export default BookReader;