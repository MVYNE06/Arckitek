import React, { useRef, forwardRef, useImperativeHandle, useEffect } from 'react';

export interface ThreeDViewerHandle {
  captureScreenshot: () => Promise<string>;
}

interface ThreeDViewerProps {
  url?: string | null;
}

const ThreeDViewer = forwardRef<ThreeDViewerHandle, ThreeDViewerProps>(({ url }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    captureScreenshot: async () => {
      if (url) {
        // Iframe capture flow
        try {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { displaySurface: 'browser' },
            audio: false,
            // @ts-ignore
            preferCurrentTab: true,
            selfBrowserSurface: 'include'
          });

          const track = stream.getVideoTracks()[0];
          const imageCapture = new (window as any).ImageCapture(track);
          const bitmap = await imageCapture.grabFrame();
          
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.drawImage(bitmap, 0, 0);
          
          track.stop();
          return canvas.toDataURL('image/png');
        } catch (e) {
          console.error("Screen capture failed:", e);
          alert("Capture cancelled.");
          return '';
        }
      } else {
        // Local canvas capture
        if (canvasRef.current) {
            return canvasRef.current.toDataURL('image/png');
        }
        return '';
      }
    }
  }));

  // Animation Logic for "No Model" State
  useEffect(() => {
    if (url || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853']; // Google Colors

    // Abstract Shape Definition
    const shapes = [
        { type: 'cube', offset: 0, color: colors[0], speed: 1 },
        { type: 'cube', offset: Math.PI / 2, color: colors[1], speed: 0.8 },
        { type: 'cube', offset: Math.PI, color: colors[2], speed: 1.2 },
        { type: 'cube', offset: Math.PI * 1.5, color: colors[3], speed: 0.9 },
    ];

    const drawCube = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, rotX: number, rotY: number) => {
        ctx.save();
        ctx.translate(x, y);
        // Simple 3D projection logic
        const vertices = [
            [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
        ].map(v => {
            // Rotate Y
            let x = v[0] * Math.cos(rotY) - v[2] * Math.sin(rotY);
            let z = v[0] * Math.sin(rotY) + v[2] * Math.cos(rotY);
            // Rotate X
            let y = v[1] * Math.cos(rotX) - z * Math.sin(rotX);
            z = v[1] * Math.sin(rotX) + z * Math.cos(rotX);
            
            // Perspective
            const scale = 200 / (200 + z);
            return { x: x * size * scale, y: y * size * scale };
        });

        // Draw edges
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const edges = [
            [0,1], [1,2], [2,3], [3,0], // back
            [4,5], [5,6], [6,7], [7,4], // front
            [0,4], [1,5], [2,6], [3,7]  // connectors
        ];
        edges.forEach(edge => {
            ctx.moveTo(vertices[edge[0]].x, vertices[edge[0]].y);
            ctx.lineTo(vertices[edge[1]].x, vertices[edge[1]].y);
        });
        ctx.stroke();
        ctx.restore();
    };

    const render = () => {
        if (!containerRef.current) return;
        // Resize canvas to fit container
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        shapes.forEach((shape, i) => {
            // Orbit logic
            const orbitRadius = 150 + Math.sin(t * 0.002 + i) * 30;
            const orbitAngle = t * 0.01 * shape.speed + shape.offset;
            
            const x = cx + Math.cos(orbitAngle) * orbitRadius;
            const y = cy + Math.sin(orbitAngle) * orbitRadius * 0.5; // Elliptical orbit

            drawCube(ctx, x, y, 30, shape.color, t * 0.02, t * 0.03 + i);
        });

        // Center pulsing element
        const pulse = 1 + Math.sin(t * 0.05) * 0.2;
        drawCube(ctx, cx, cy, 20 * pulse, '#ffffff', t * 0.01, -t * 0.01);

        t++;
        animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [url]);

  return (
    <div className="w-full h-full relative group bg-slate-950 flex items-center justify-center overflow-hidden" ref={containerRef}>
      {url ? (
          <iframe 
            src={url} 
            className="w-full h-full border-0" 
            title="Spline Viewer"
            allow="fullscreen; clipboard-read; clipboard-write"
          />
      ) : (
          <div className="absolute inset-0">
             <canvas ref={canvasRef} className="block" />
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853] opacity-20 tracking-widest blur-sm scale-150 select-none">
                    ARCKITEK
                 </h2>
             </div>
             <div className="absolute bottom-10 w-full text-center pointer-events-none">
                <p className="text-slate-500 text-sm tracking-widest uppercase">Waiting for model...</p>
             </div>
          </div>
      )}
    </div>
  );
});

export default ThreeDViewer;