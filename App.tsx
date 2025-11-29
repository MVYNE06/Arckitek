import React, { useState, useRef } from 'react';
import ThreeDViewer, { ThreeDViewerHandle } from './components/ThreeDViewer';
import ChatInterface from './components/ChatInterface';
import ImageEditor from './components/ImageEditor';
import { IconCube, IconLink, IconUpload, IconEdit } from './components/Icons';

export default function App() {
  const viewerRef = useRef<ThreeDViewerHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [splineUrl, setSplineUrl] = useState<string>('');
  const [tempUrl, setTempUrl] = useState('');

  const handleEditorSave = (newImg: string) => {
      setCapturedImage(newImg);
      setIsEditing(false);
  };

  const handleLoadUrl = () => {
      if (tempUrl) {
          setSplineUrl(tempUrl);
          setShowLinkInput(false);
      }
  };

  const handleUploadClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              if (typeof event.target?.result === 'string') {
                  setCapturedImage(event.target.result);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleEditClick = () => {
      if (capturedImage) {
          setIsEditing(true);
      } else {
          alert("Please upload an image first to edit.");
      }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* Hidden File Input */}
      <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/png, image/jpeg, image/jpg"
          onChange={handleFileChange}
      />

      {/* Sidebar / Navigation */}
      <div className="w-16 md:w-20 border-r border-slate-800 flex flex-col items-center py-6 gap-6 bg-slate-900 z-20">
        <div style={{ background: 'linear-gradient(135deg, #4285F4, #EA4335, #FBBC05, #34A853)' }} className="w-10 h-10 rounded-xl shadow-lg mb-4 flex items-center justify-center font-bold text-white text-lg">A</div>
        
        <button 
            className="p-3 rounded-xl bg-slate-800 text-[#4285F4] border border-slate-700 hover:bg-slate-700 transition" 
            title="3D Viewport"
            onClick={() => setSplineUrl('')}
        >
            <IconCube />
        </button>

        <button
            onClick={() => setShowLinkInput(true)}
            className="p-3 rounded-xl bg-slate-800 text-[#FBBC05] border border-slate-700 hover:bg-slate-700 transition"
            title="Load Spline URL"
        >
            <IconLink />
        </button>

        <button 
            onClick={handleUploadClick}
            className="p-3 rounded-xl bg-slate-800 text-[#34A853] border border-slate-700 hover:bg-slate-700 transition"
            title="Upload Image to Explain"
        >
            <IconUpload />
        </button>

        <button 
            onClick={handleEditClick}
            className="p-3 rounded-xl bg-slate-800 text-[#EA4335] border border-slate-700 hover:bg-slate-700 transition"
            title="Edit Captured Image"
        >
            <IconEdit />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        
        {/* 3D Viewport Area */}
        <div className="flex-1 relative bg-slate-950">
            <ThreeDViewer ref={viewerRef} url={splineUrl} />
            
            {/* URL Input Modal */}
            {showLinkInput && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-2xl w-full max-w-md">
                        <h3 className="text-lg font-bold text-white mb-2">Load Spline Model</h3>
                        <p className="text-sm text-slate-400 mb-4">Paste a public Spline design URL.</p>
                        <input 
                            type="text" 
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-[#4285F4] outline-none mb-4"
                            placeholder="https://my.spline.design/..."
                            value={tempUrl}
                            onChange={(e) => setTempUrl(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowLinkInput(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                            <button onClick={handleLoadUrl} className="px-4 py-2 bg-[#4285F4] hover:bg-blue-600 text-white rounded-lg font-medium">Load Model</button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Editor Modal Overlay */}
        {isEditing && capturedImage && (
            <ImageEditor 
                imageSrc={capturedImage} 
                onSave={handleEditorSave} 
                onCancel={() => setIsEditing(false)} 
            />
        )}

        {/* Chat / Sidebar Panel */}
        <div className="w-full md:w-[400px] h-[40vh] md:h-full border-t md:border-t-0 md:border-l border-slate-800 z-10 shadow-2xl">
            <ChatInterface 
                initialImage={capturedImage} 
                onClearImage={() => setCapturedImage(null)} 
            />
        </div>

      </div>
    </div>
  );
}