import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Eye, Save, Sliders, Info, Radio } from "lucide-react";
import { WaveParams } from "../types";

interface WaveCanvasProps {
  params: WaveParams;
  setParams: (p: WaveParams) => void;
  onSaveObservation: (results: { frequency: number; wavelength: string; speed: number }) => void;
}

export default function WaveCanvas({ params, setParams, onSaveObservation }: WaveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [waveType, setWaveType] = useState<"transverse" | "longitudinal" | "interference">("transverse");
  const [phaseOffset, setPhaseOffset] = useState(0);

  // Animation Loop for waves
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let offset = 0;
    let lastTime = performance.now();

    const drawWave = (now: number) => {
      let dt = (now - lastTime) / 1000;
      lastTime = now;
      if (dt > 0.1) dt = 0.1;

      if (isPlaying) {
        // Offset increments proportional to frequency
        offset += params.frequency * Math.PI * 2 * dt;
        setPhaseOffset(offset);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Formula parameters
      const A = params.amplitude;
      const f = params.frequency;
      const v = params.speed; // pixels per second
      
      // wavelength lambda = v / f
      const lambda = f > 0 ? v / f : 9999;
      // wave number k = 2 * pi / lambda
      const k = 2 * Math.PI / lambda;

      if (waveType === "transverse") {
        // Draw standard horizontal transverse wave
        ctx.save();
        ctx.strokeStyle = "rgba(100, 116, 139, 0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        // Draw propagating wave path
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 3;
        ctx.shadowColor = "rgba(2, 132, 199, 0.4)";
        ctx.shadowBlur = 8;
        ctx.beginPath();

        for (let x = 0; x < width; x += 2) {
          // y = A * sin(k * x - offset)
          const dampingFactor = Math.exp(-x * (params.damping * 0.003));
          const y = centerY + A * dampingFactor * Math.sin(k * x - offset);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw animated particles/dots on the wave
        ctx.shadowBlur = 0;
        const numParticles = 12;
        for (let i = 0; i < numParticles; i++) {
          const px = (width / (numParticles - 1)) * i;
          const dampingFactor = Math.exp(-px * (params.damping * 0.003));
          const py = centerY + A * dampingFactor * Math.sin(k * px - offset);
          
          ctx.fillStyle = i === 4 ? "#ef4444" : "#14b8a6"; // highlight one red particle to show vertical oscillation motion
          ctx.beginPath();
          ctx.arc(px, py, i === 4 ? 6 : 4, 0, 2 * Math.PI);
          ctx.fill();

          // If highlighted, show vertical indicator path
          if (i === 4) {
            ctx.strokeStyle = "rgba(239, 68, 68, 0.3)";
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(px, centerY - A);
            ctx.lineTo(px, centerY + A);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
        ctx.restore();

      } else if (waveType === "longitudinal") {
        // Longitudinal sound/pressure wave represented by horizontal displacement dots
        ctx.save();
        const numLines = 50;
        ctx.fillStyle = "#38bdf8";
        
        for (let i = 0; i < numLines; i++) {
          const originalX = (width / numLines) * i;
          const dampingFactor = Math.exp(-originalX * (params.damping * 0.003));
          // horizontal displacement: dx = A * sin(k * x - offset)
          const dx = A * 0.8 * dampingFactor * Math.sin(k * originalX - offset);
          const px = originalX + dx;

          // Draw vertical columns of dots to make it dense and intuitive
          for (let y = 30; y < height - 30; y += 15) {
            ctx.beginPath();
            // Highlight one vertical band to make compression/rarefaction travel visible
            ctx.fillStyle = (i === 15) ? "#ef4444" : "rgba(56, 189, 248, 0.75)";
            ctx.arc(px, y, (i === 15) ? 4.5 : 3, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
        ctx.restore();

      } else if (waveType === "interference") {
        // Two source interference pattern! (2D wave ripples top-down view)
        ctx.save();
        const source1X = width / 2;
        const source1Y = height / 2 - 45;
        const source2X = width / 2;
        const source2Y = height / 2 + 45;

        // Render ripples as animated expanding circular wavefront lines
        ctx.lineWidth = 1.5;
        
        const maxRadius = Math.hypot(width, height);
        // Step through radius to draw concentric circle wavefronts (representing crests)
        for (let r = (offset * (v / (f * 25))) % lambda; r < maxRadius; r += lambda) {
          if (r <= 0) continue;
          
          // Source 1
          ctx.strokeStyle = `rgba(14, 165, 233, ${Math.max(1 - r/maxRadius, 0) * 0.45})`;
          ctx.beginPath();
          ctx.arc(source1X, source1Y, r, 0, 2 * Math.PI);
          ctx.stroke();

          // Source 2
          ctx.strokeStyle = `rgba(20, 184, 166, ${Math.max(1 - r/maxRadius, 0) * 0.45})`;
          ctx.beginPath();
          ctx.arc(source2X, source2Y, r, 0, 2 * Math.PI);
          ctx.stroke();
        }

        // Highlight source antenna hubs
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#0284c7";
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(source1X, source1Y, 6, 0, 2 * Math.PI);
        ctx.fill();

        ctx.shadowColor = "#14b8a6";
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(source2X, source2Y, 6, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(drawWave);
    };

    animationFrameId = requestAnimationFrame(drawWave);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [params, waveType, isPlaying]);

  const handleReset = () => {
    setPhaseOffset(0);
  };

  const LWaveLength = params.frequency > 0 ? (params.speed / params.frequency) : 0;

  const onSave = () => {
    onSaveObservation({
      frequency: params.frequency,
      wavelength: `${(LWaveLength / 100).toFixed(2)} m (quy đổi)`,
      speed: params.speed
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Simulation Viewport */}
      <div className="relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {/* Header Overlay */}
        <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between text-xs font-mono text-slate-400 pointer-events-none">
          <div className="flex gap-4">
            <span>Tần số (f): <strong className="text-teal-400">{params.frequency.toFixed(1)} Hz</strong></span>
            <span>Bước sóng (λ): <strong className="text-sky-400">{(LWaveLength / 100).toFixed(2)} m</strong></span>
          </div>
          <span className="hidden sm:inline bg-slate-900/90 px-2 py-0.5 rounded text-slate-500 border border-slate-800/60">
            {waveType === "transverse" ? "Hạt đỏ dao động thẳng đứng!" : waveType === "longitudinal" ? "Sóng nén / giãn dọc!" : "Giao thoa 2 nguồn kết hợp"}
          </span>
        </div>

        {/* Canvas viewport */}
        <div className="w-full flex justify-center bg-radial from-slate-900 to-slate-950">
          <canvas
            id="wave-simulation-canvas"
            ref={canvasRef}
            width={480}
            height={360}
            className="w-full max-w-[480px] h-[360px] block"
          />
        </div>

        {/* Type Select and info overlay */}
        <div className="bg-slate-900/95 border-t border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 font-bold">
            <Radio className="h-4 w-4 text-teal-400" />
            Kiểu Sóng:
          </div>
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              id="wave-type-transverse"
              onClick={() => setWaveType("transverse")}
              className={`px-3 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                waveType === "transverse"
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sóng ngang
            </button>
            <button
              id="wave-type-longitudinal"
              onClick={() => setWaveType("longitudinal")}
              className={`px-3 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                waveType === "longitudinal"
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sóng dọc
            </button>
            <button
              id="wave-type-interference"
              onClick={() => setWaveType("interference")}
              className={`px-3 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                waveType === "interference"
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Giao thoa 2D
            </button>
          </div>
        </div>
      </div>

      {/* Physics Sliders and Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Thông số Sóng Cơ Học</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              id="wave-play-pause"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm transition-all cursor-pointer ${
                isPlaying ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5" /> Tạm dừng
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" /> Chạy tiếp
                </>
              )}
            </button>
            <button
              id="wave-reset"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Đặt lại
            </button>
            <button
              id="wave-save-obs"
              onClick={onSave}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-750 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" /> Lưu Số liệu
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          {/* Amplitude */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="slider-wave-amp" className="font-semibold text-slate-700">Biên độ sóng (A)</label>
              <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold">
                {params.amplitude} px
              </span>
            </div>
            <input
              id="slider-wave-amp"
              type="range"
              min="10"
              max="70"
              step="1"
              value={params.amplitude}
              onChange={(e) => setParams({ ...params, amplitude: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>10px (Thấp)</span>
              <span>70px (Cao)</span>
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="slider-wave-freq" className="font-semibold text-slate-700">Tần số dao động (f)</label>
              <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold">
                {params.frequency.toFixed(1)} Hz
              </span>
            </div>
            <input
              id="slider-wave-freq"
              type="range"
              min="0.2"
              max="4.0"
              step="0.1"
              value={params.frequency}
              onChange={(e) => setParams({ ...params, frequency: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0.2 Hz (Chậm)</span>
              <span>4.0 Hz (Nhanh)</span>
            </div>
          </div>

          {/* Speed */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="slider-wave-speed" className="font-semibold text-slate-700">Tốc độ truyền sóng (v)</label>
              <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold">
                {params.speed} px/s
              </span>
            </div>
            <input
              id="slider-wave-speed"
              type="range"
              min="40"
              max="200"
              step="5"
              value={params.speed}
              onChange={(e) => setParams({ ...params, speed: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>40 px/s (Trì trì)</span>
              <span>200 px/s (Vụt qua)</span>
            </div>
          </div>

          {/* Damping */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="slider-wave-damping" className="font-semibold text-slate-700 flex items-center gap-1">
                Sự tắt dần trong môi trường (damping)
                <span className="text-[10px] text-slate-400 cursor-help" title="Làm biên độ sóng giảm dần khi truyền ra xa">
                  <Info className="h-3.5 w-3.5" />
                </span>
              </label>
              <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold">
                {params.damping.toFixed(1)}
              </span>
            </div>
            <input
              id="slider-wave-damping"
              type="range"
              min="0.0"
              max="5.0"
              step="0.2"
              value={params.damping}
              onChange={(e) => setParams({ ...params, damping: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0.0 (Bảo toàn)</span>
              <span>5.0 (Tắt nhanh)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
