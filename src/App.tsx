import { useEffect, useRef, useState } from 'react';
import './App.css';

//Definições de Cores Alvo para Baquetas
const TARGET_COLORS = [

  {
    id: 'verdeStick',
    name: 'Baqueta Esq. (Verde)',

    hueRange: [90, 150],

    satRange: [60, 100],

    lightRange: [30, 80],
    debugColor: '#00ff00'
  },

  {
    id: 'vermelhaStick',
    name: 'Baqueta Dir. (Vermelha)',


    hueRange: [0, 20],

    satRange: [60, 100],

    lightRange: [30, 70],
    debugColor: '#ff0000'
  },
];

const DRUM_PADS = [
  { id: 'hihat', name: 'Chimbal', x: 0.7, y: 0.4, w: 0.2, h: 0.2, color: 'rgba(255, 255, 0, 0.4)', soundUrl: '/sounds/hihat.wav' },
  { id: 'snare', name: 'Caixa', x: 0.4, y: 0.6, w: 0.2, h: 0.2, color: 'rgba(0, 150, 255, 0.4)', soundUrl: '/sounds/snare.wav' },
  { id: 'crash', name: 'Prato', x: 0.1, y: 0.3, w: 0.2, h: 0.2, color: 'rgba(255, 100, 0, 0.4)', soundUrl: '/sounds/crash.wav' },
];

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
};

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const activeHits = useRef<Record<string, boolean>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBuffersRef = useRef<Record<string, AudioBuffer>>({});

  useEffect(() => {
    async function setupCamera() {
      if (!navigator.mediaDevices) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: false,
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) { console.error('Erro na câmera:', error); }
    }
    setupCamera();
  }, []);

  const initAudioAndLoadSounds = async () => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;
    for (const pad of DRUM_PADS) {
      try {
        const response = await fetch(pad.soundUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        audioBuffersRef.current[pad.id] = audioBuffer;
      } catch (error) { console.error(`Erro ao carregar o som ${pad.soundUrl}:`, error); }
    }
    setIsAudioReady(true);
  };

  const playSound = (id: string) => {
    const ctx = audioCtxRef.current;
    const buffer = audioBuffersRef.current[id];
    if (ctx && buffer) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    }
  };

  const processColorTracking = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const hiddenCanvas = hiddenCanvasRef.current;
    if (video && canvas && hiddenCanvas && video.readyState >= 2) {
      const { videoWidth, videoHeight } = video;
      if (canvas.width !== videoWidth) {
        canvas.width = videoWidth; canvas.height = videoHeight;
        hiddenCanvas.width = videoWidth; hiddenCanvas.height = videoHeight;
      }
      const ctx = canvas.getContext('2d');
      const hiddenCtx = hiddenCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx || !hiddenCtx) return;
      hiddenCtx.drawImage(video, 0, 0, videoWidth, videoHeight);
      const imageData = hiddenCtx.getImageData(0, 0, videoWidth, videoHeight);
      const pixels = imageData.data;
      const matches: Record<string, { sumX: number, sumY: number, count: number }> = {
        verdeStick: { sumX: 0, sumY: 0, count: 0 },
        vermelhaStick: { sumX: 0, sumY: 0, count: 0 }
      };
      const step = 4;
      for (let i = 0; i < pixels.length; i += step * 4) {
        const r = pixels[i]; const g = pixels[i + 1]; const b = pixels[i + 2];
        const [h, s, l] = rgbToHsl(r, g, b);
        TARGET_COLORS.forEach(target => {
          const isHueMatch = h >= target.hueRange[0] && h <= target.hueRange[1];
          const isSatMatch = s >= target.satRange[0] && s <= target.satRange[1];
          const isLightMatch = l >= target.lightRange[0] && l <= target.lightRange[1];
          if (isHueMatch && isSatMatch && isLightMatch) {
            const pixelIndex = i / 4;
            matches[target.id].sumX += pixelIndex % videoWidth;
            matches[target.id].sumY += Math.floor(pixelIndex / videoWidth);
            matches[target.id].count++;
          }
        });
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      DRUM_PADS.forEach(pad => {
        const px = pad.x * canvas.width; const py = pad.y * canvas.height;
        const pw = pad.w * canvas.width; const ph = pad.h * canvas.height;
        ctx.fillStyle = activeHits.current[pad.id] ? 'rgba(255, 255, 255, 0.8)' : pad.color;
        ctx.fillRect(px, py, pw, ph);
        ctx.fillStyle = 'white'; ctx.font = '24px sans-serif';
        ctx.fillText(pad.name, px + 10, py + 30);
      });
      const currentFrameHits: Record<string, boolean> = {};
      TARGET_COLORS.forEach(target => {
        const match = matches[target.id];

        if (match.count > 15) {
          const centroidX = match.sumX / match.count;
          const centroidY = match.sumY / match.count;
          ctx.beginPath();

          ctx.arc(centroidX, centroidY, 15, 0, 2 * Math.PI);
          ctx.fillStyle = target.debugColor;
          ctx.fill();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4;
          ctx.stroke();
          DRUM_PADS.forEach(pad => {
            const px = pad.x * canvas.width; const py = pad.y * canvas.height;
            const pw = pad.w * canvas.width; const ph = pad.h * canvas.height;
            const isColliding = centroidX >= px && centroidX <= px + pw && centroidY >= py && centroidY <= py + ph;
            if (isColliding) {
              currentFrameHits[pad.id] = true;
              if (!activeHits.current[pad.id]) { playSound(pad.id); }
            }
          });
        }
      });
      activeHits.current = currentFrameHits;
    }
    requestAnimationFrame(processColorTracking);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#121212', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginTop: '2rem' }}>Bateria Invisível 🥁</h1>

      <p style={{ color: '#888' }}>use baqueta com massa VERDE na ponta Esq. e VERMELHA na ponta Dir.</p>

      {!isAudioReady ? (
        <button
          onClick={initAudioAndLoadSounds}
          style={{ padding: '12px 24px', fontSize: '18px', cursor: 'pointer', backgroundColor: '#ff0055', color: 'white', border: 'none', borderRadius: '8px', marginTop: '10px' }}
        >
          Ligar o Som e Tocar!
        </button>
      ) : (
        <p style={{ color: '#00ff00' }}>Áudio pronto! Pode tocar.</p>
      )}
      <div style={{ position: 'relative', marginTop: '1rem', display: 'inline-block' }}>
        <video ref={videoRef} autoPlay playsInline onPlay={processColorTracking} style={{ borderRadius: '12px', border: '4px solid #333', transform: 'scaleX(-1)', display: 'block', width: '100%', maxWidth: '800px' }} />
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)', pointerEvents: 'none', borderRadius: '12px' }} />
        <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}