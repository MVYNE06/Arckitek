import React, { useState, useRef, useEffect } from 'react';
import { sendMessage, editImage, generateImage } from '../services/geminiService';
import { IconSpark, IconBrain, IconGlobe, IconEdit } from './Icons';
import { Message, ImageGenSettings } from '../types';

interface ChatInterfaceProps {
  initialImage: string | null;
  onClearImage: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialImage, onClearImage }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Welcome to Arckitek. Load a model, capture the viewport, or upload an image to analyze.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  
  // Image Generation State
  const [showGenModal, setShowGenModal] = useState(false);
  const [genSettings, setGenSettings] = useState<ImageGenSettings>({ aspectRatio: '1:1', size: '1K', prompt: '' });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && !initialImage) return;

    const userMsg: Message = { 
        role: 'user', 
        text: input, 
        image: initialImage || undefined 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // If an image is present and user asks for an edit (simple heuristic)
    const isEditRequest = initialImage && (input.toLowerCase().includes('add') || input.toLowerCase().includes('remove') || input.toLowerCase().includes('change') || input.toLowerCase().includes('filter'));

    try {
        if (isEditRequest && initialImage) {
             const editedImage = await editImage(initialImage, userMsg.text || 'Make requested edits');
             if (editedImage) {
                 setMessages(prev => [...prev, { role: 'model', image: editedImage, text: "Here is the edited visualization." }]);
             } else {
                 setMessages(prev => [...prev, { role: 'model', text: "I tried to edit the image but couldn't generate a result." }]);
             }
        } else {
            // Standard Chat / Analysis
            const streamResponse = await sendMessage({
                history: messages.map(m => ({ 
                    role: m.role, 
                    parts: [{ text: m.text || '' }] // simplified history
                })),
                message: userMsg.text || 'Analyze this image',
                image: userMsg.image,
                useThinking,
                useSearch,
                onStream: (text) => {
                    // We handle streaming by updating the last message
                     // This is simplified; in a real app, we'd update a partial message state
                }
            });
            
            setMessages(prev => [...prev, { 
                role: 'model', 
                text: streamResponse.text,
                groundingUrls: streamResponse.groundingChunks?.map(c => ({ title: c.web?.title || 'Source', uri: c.web?.uri || '' }))
            }]);
        }
    } catch (e) {
        setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error." }]);
    } finally {
        setIsLoading(false);
        if (initialImage) onClearImage(); // Clear image context after sending
    }
  };

  const handleGenImage = async () => {
      setShowGenModal(false);
      setIsLoading(true);
      setMessages(prev => [...prev, { role: 'user', text: `Generate ${genSettings.size} image: ${genSettings.prompt}` }]);
      
      try {
          const img = await generateImage(genSettings.prompt, genSettings.size, genSettings.aspectRatio);
          if (img) {
              setMessages(prev => [...prev, { role: 'model', image: img, text: `Generated concept.` }]);
          } else {
              setMessages(prev => [...prev, { role: 'model', text: "Failed to generate image." }]);
          }
      } catch (e) {
          setMessages(prev => [...prev, { role: 'model', text: "Error generating image." }]);
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 w-full md:w-[400px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between glass">
        <h2 className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853]">Gemini Assistant</h2>
        <div className="flex gap-2">
            <button 
                onClick={() => setUseThinking(!useThinking)}
                className={`p-2 rounded-full transition ${useThinking ? 'bg-purple-900 text-purple-200' : 'text-slate-500 hover:bg-slate-800'}`}
                title="Thinking Mode (Gemini 3 Pro)"
            >
                <IconBrain />
            </button>
            <button 
                onClick={() => setUseSearch(!useSearch)}
                className={`p-2 rounded-full transition ${useSearch ? 'bg-green-900 text-green-200' : 'text-slate-500 hover:bg-slate-800'}`}
                title="Search Grounding"
            >
                <IconGlobe />
            </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3 ${
              m.role === 'user' 
                ? 'bg-[#4285F4] text-white rounded-br-none' 
                : 'bg-slate-800 text-slate-200 rounded-bl-none'
            }`}>
              {m.image && (
                <img src={m.image} alt="Attachment" className="mb-2 rounded-lg max-w-full" />
              )}
              {m.text && <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>}

              {m.groundingUrls && m.groundingUrls.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-700">
                      <p className="text-xs text-slate-400 font-bold mb-1">Sources:</p>
                      <ul className="text-xs space-y-1">
                          {m.groundingUrls.map((url, idx) => (
                              <li key={idx}><a href={url.uri} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate block">{url.title}</a></li>
                          ))}
                      </ul>
                  </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex items-center gap-2 text-slate-500 text-sm animate-pulse">
                <IconSpark className="w-4 h-4" />
                <span>Thinking...</span>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preview Attachment */}
      {initialImage && (
        <div className="px-4 py-2 bg-slate-800 border-t border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <img src={initialImage} className="w-10 h-10 rounded object-cover border border-slate-600" alt="Preview"/>
                <span className="text-xs text-blue-300">Image attached</span>
            </div>
            <button onClick={onClearImage} className="text-xs text-red-400 hover:text-red-300">Remove</button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-slate-800 bg-slate-900">
          <div className="flex gap-2">
              <button 
                onClick={() => setShowGenModal(!showGenModal)}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Generate Image"
              >
                  <IconEdit />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={initialImage ? "Ask to analyze..." : "Ask Gemini..."}
                className="flex-1 bg-slate-800 text-white rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-[#4285F4] border border-slate-700 placeholder-slate-500"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading}
                className="p-3 rounded-xl bg-[#4285F4] hover:bg-blue-600 text-white transition shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                  <IconSpark />
              </button>
          </div>
      </div>

      {/* Image Gen Modal */}
      {showGenModal && (
          <div className="absolute bottom-20 left-4 right-4 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl z-10 animate-fade-in-up">
              <h3 className="text-sm font-bold text-white mb-3">Generate Architectural Concept</h3>
              <input 
                 className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white mb-3"
                 placeholder="Describe the building..."
                 value={genSettings.prompt}
                 onChange={e => setGenSettings({...genSettings, prompt: e.target.value})}
              />
              <div className="flex gap-2 mb-3">
                  <select 
                    className="bg-slate-900 border border-slate-700 rounded text-xs text-white p-2"
                    value={genSettings.size}
                    onChange={e => setGenSettings({...genSettings, size: e.target.value as any})}
                  >
                      <option value="1K">1K</option>
                      <option value="2K">2K</option>
                      <option value="4K">4K</option>
                  </select>
                  <select 
                    className="bg-slate-900 border border-slate-700 rounded text-xs text-white p-2"
                    value={genSettings.aspectRatio}
                    onChange={e => setGenSettings({...genSettings, aspectRatio: e.target.value})}
                  >
                      <option value="1:1">1:1</option>
                      <option value="16:9">16:9</option>
                      <option value="4:3">4:3</option>
                  </select>
              </div>
              <button onClick={handleGenImage} className="w-full bg-gradient-to-r from-[#4285F4] to-[#EA4335] text-white py-2 rounded text-sm font-medium">Generate</button>
          </div>
      )}
    </div>
  );
};

export default ChatInterface;