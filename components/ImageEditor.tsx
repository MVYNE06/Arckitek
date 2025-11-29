import React, { useState } from 'react';
import { editImage } from '../services/geminiService';
import { IconSpark, IconEdit } from './Icons';

interface ImageEditorProps {
  imageSrc: string;
  onSave: (newImageSrc: string) => void;
  onCancel: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ imageSrc, onSave, onCancel }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Use the current visible image (either original or previously generated) as the base
      const sourceImage = generatedImage || imageSrc;
      const result = await editImage(sourceImage, prompt);
      
      if (result) {
        setGeneratedImage(result);
        setPrompt(''); // Clear prompt on success
      } else {
        setError("Could not generate edit. Try a different prompt.");
      }
    } catch (e) {
      console.error(e);
      setError("An error occurred during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (generatedImage) {
      onSave(generatedImage);
    }
  };

  const activeImage = generatedImage || imageSrc;

  return (
    <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900">
             <div className="flex items-center gap-2">
                <IconEdit className="text-[#EA4335]" />
                <h3 className="text-white font-bold text-lg">Magic Editor</h3>
             </div>
             <button onClick={onCancel} className="text-slate-400 hover:text-white transition">Close</button>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-hidden relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-950 flex items-center justify-center p-4">
             <img 
                src={activeImage} 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-slate-800"
                alt="Editing Target"
             />
             
             {isGenerating && (
                 <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center backdrop-blur-sm">
                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4285F4] mb-4"></div>
                     <p className="text-white font-medium animate-pulse">Gemini is reimagining...</p>
                 </div>
             )}

             {error && (
                 <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm">
                     {error}
                 </div>
             )}
        </div>

        {/* Controls */}
        <div className="p-6 bg-slate-900 border-t border-slate-800">
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <input 
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe changes (e.g., 'Add a futuristic tower', 'Make it night time')"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#4285F4] pr-12"
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    />
                    <IconSpark className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
                
                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-[#4285F4] to-[#EA4335] text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-blue-500/20"
                >
                    Generate
                </button>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-800">
                <div className="text-xs text-slate-500">
                    Powered by Gemini 2.5 Flash Image
                </div>
                <div className="flex gap-3">
                    {generatedImage && (
                        <button 
                            onClick={() => setGeneratedImage(null)}
                            className="px-4 py-2 text-slate-400 hover:text-white transition text-sm"
                        >
                            Revert to Original
                        </button>
                    )}
                    <button 
                        onClick={handleSave}
                        disabled={!generatedImage}
                        className="px-6 py-2 bg-[#34A853] text-white font-medium rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:grayscale"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;