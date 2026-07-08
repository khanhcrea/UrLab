import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Eye, Save, Sliders, Info, Radio, Activity } from "lucide-react";
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
  const [showCoordinateAxis, setShowCoordinateAxis] = useState(true);

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
        
        const axisX = 30; // origin of u-x graph
        
        ctx.strokeStyle = "rgba(100, 116, 139, 0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        // Draw Coordinate Axes if enabled
        if (showCoordinateAxis) {
          ctx.strokeStyle = "rgba(148, 163, 184, 0.55)"; // Slate-400
          ctx.lineWidth = 2;
          
          // 1. Vertical Axis Ou (pointing upwards)
          ctx.beginPath();
          ctx.moveTo(axisX, centerY + A + 25);
          ctx.lineTo(axisX, centerY - A - 25);
          ctx.stroke();

          // Arrow head for Ou
          ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
          ctx.beginPath();
          ctx.moveTo(axisX, centerY - A - 25);
          ctx.lineTo(axisX - 4, centerY - A - 17);
          ctx.lineTo(axisX + 4, centerY - A - 17);
          ctx.closePath();
          ctx.fill();

          // Label 'u' at top
          ctx.fillStyle = "#cbd5e1";
          ctx.font = "italic bold 14px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText("u (px)", axisX, centerY - A - 29);

          // 2. Horizontal Axis Ox (pointing right)
          ctx.beginPath();
          ctx.moveTo(axisX - 10, centerY);
          ctx.lineTo(width - 15, centerY);
          ctx.stroke();

          // Arrow head for Ox
          ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
          ctx.beginPath();
          ctx.moveTo(width - 15, centerY);
          ctx.lineTo(width - 23, centerY - 4);
          ctx.lineTo(width - 23, centerY + 4);
          ctx.closePath();
          ctx.fill();

          // Label 'x' at right
          ctx.fillStyle = "#cbd5e1";
          ctx.font = "italic bold 14px sans-serif";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText("x", width - 10, centerY);

          // 3. Ticks and Labels on Ou (vertical)
          ctx.fillStyle = "#cbd5e1"; // Higher contrast text color
          ctx.font = "bold 12px monospace";
          ctx.textAlign = "right";
          ctx.textBaseline = "middle";
          ctx.lineWidth = 1.5;

          // Origin (0)
          ctx.fillText("0", axisX - 8, centerY + 10);

          // Positive peak (+A)
          ctx.strokeStyle = "rgba(148, 163, 184, 0.6)";
          ctx.beginPath();
          ctx.moveTo(axisX - 7, centerY - A);
          ctx.lineTo(axisX + 7, centerY - A);
          ctx.stroke();
          
          ctx.fillStyle = "#86efac"; // soft green for peak
          ctx.font = "bold 12px monospace";
          ctx.fillText(`+A (${A}px)`, axisX - 10, centerY - A);

          // Negative peak (-A)
          ctx.beginPath();
          ctx.moveTo(axisX - 7, centerY + A);
          ctx.lineTo(axisX + 7, centerY + A);
          ctx.stroke();
          
          ctx.fillStyle = "#fca5a5"; // soft red for trough
          ctx.fillText(`-A (-${A}px)`, axisX - 10, centerY + A);

          // 4. Wavelength ticks on Ox (horizontal)
          ctx.fillStyle = "#cbd5e1";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          
          // Show ticks at λ/2, λ, 3λ/2, 2λ...
          for (let i = 1; i <= 6; i++) {
            const tickX = axisX + i * (lambda / 2);
            if (tickX < width - 30) {
              ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
              ctx.beginPath();
              ctx.moveTo(tickX, centerY - 4);
              ctx.lineTo(tickX, centerY + 4);
              ctx.stroke();

              let tickLabel = "";
              if (i === 1) tickLabel = "λ/2";
              else if (i === 2) tickLabel = "λ";
              else if (i === 3) tickLabel = "3λ/2";
              else if (i === 4) tickLabel = "2λ";
              else if (i === 5) tickLabel = "5λ/2";
              else if (i === 6) tickLabel = "3λ";

              ctx.fillStyle = "#cbd5e1";
              ctx.font = "bold 11px sans-serif";
              ctx.fillText(tickLabel, tickX, centerY + 8);
              
              // print value under tick label
              ctx.fillStyle = "#94a3b8";
              ctx.font = "bold 10px monospace";
              const valMeters = ((i * LWaveLength / 2) / 100).toFixed(2);
              ctx.fillText(`${valMeters}m`, tickX, centerY + 20);
            }
          }
        }
        ctx.restore();

        // Draw propagating wave path
        ctx.save();
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

          // If highlighted, show vertical indicator path & coordinates
          if (i === 4) {
            ctx.save();
            ctx.strokeStyle = "rgba(239, 68, 68, 0.35)";
            ctx.lineWidth = 1.2;
            ctx.setLineDash([3, 3]);
            
            // Standard bounding guide
            ctx.beginPath();
            ctx.moveTo(px, centerY - A);
            ctx.lineTo(px, centerY + A);
            ctx.stroke();

            if (showCoordinateAxis) {
              // Projections to the axes
              ctx.strokeStyle = "rgba(239, 68, 68, 0.5)";
              
              // to Vertical displacement Axis (Ou)
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(axisX, py);
              ctx.stroke();

              // to Horizontal distance Axis (Ox)
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(px, centerY);
              ctx.stroke();
              
              ctx.setLineDash([]);

              // Displacement label on Ou axis
              ctx.fillStyle = "#ef4444";
              ctx.font = "bold 12px monospace";
              ctx.textAlign = "right";
              ctx.textBaseline = "middle";
              const currentDispValue = (centerY - py); // positive upwards
              ctx.fillText(`u = ${currentDispValue >= 0 ? "+" : ""}${currentDispValue.toFixed(1)}px`, axisX - 10, py);

              // Distance label on Ox axis
              ctx.fillStyle = "#ef4444";
              ctx.font = "bold 12px monospace";
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              const currentXValue = px - axisX;
              ctx.fillText(`x = ${currentXValue.toFixed(0)}px`, px, centerY + 8);
            } else {
              ctx.setLineDash([]);
            }
            ctx.restore();
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
          // horizontal displacement: dx = A * 0.8 * dampingFactor * Math.sin(k * originalX - offset);
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

        // Draw horizontal coordinate scale for longitudinal waves
        if (showCoordinateAxis) {
          ctx.save();
          const axisY = height - 20;
          ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(30, axisY);
          ctx.lineTo(width - 15, axisY);
          ctx.stroke();

          // Arrow head
          ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
          ctx.beginPath();
          ctx.moveTo(width - 15, axisY);
          ctx.lineTo(width - 23, axisY - 3);
          ctx.lineTo(width - 23, axisY + 3);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = "#cbd5e1";
          ctx.font = "italic bold 14px sans-serif";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText("x (m)", width - 10, axisY);

          // Tick marks at regular intervals (e.g. 50px, 100px, 150px...)
          ctx.font = "bold 11px monospace";
          ctx.fillStyle = "#cbd5e1";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          for (let xCoord = 50; xCoord < width - 30; xCoord += 50) {
            ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
            ctx.beginPath();
            ctx.moveTo(xCoord, axisY - 4);
            ctx.lineTo(xCoord, axisY + 4);
            ctx.stroke();
            ctx.fillText(`${(xCoord / 100).toFixed(1)}m`, xCoord, axisY + 6);
          }
          ctx.restore();
        }

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
  }, [params, waveType, isPlaying, showCoordinateAxis]);

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
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="flex flex-col lg:flex-row border-b border-slate-800">
          {/* Real-time Parameters Dashboard - Structured Sidebar layout, NO OVERLAP */}
          <div className="w-full lg:w-[240px] bg-slate-900/40 p-5 border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col justify-center shrink-0 select-none">
            <span className="text-xs uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-800/80 pb-2 mb-3">
              <Activity className="h-4 w-4 text-red-500 animate-pulse" />
              Bảng số liệu thời gian thực
            </span>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400 font-medium">Tần số (f):</span>
                <span className="font-mono text-base font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {params.frequency.toFixed(1)} Hz
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400 font-medium">Bước sóng (λ):</span>
                <span className="font-mono text-base font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {(LWaveLength / 100).toFixed(2)} m
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-slate-800/60 pt-2.5">
                <span className="text-slate-400 font-medium">Tốc độ sóng (v):</span>
                <span className="font-mono text-base font-black text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  {(params.speed / 100).toFixed(2)} m/s
                </span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 leading-normal border-t border-slate-800/40 pt-2.5 mt-3 font-sans">
              {waveType === "transverse" ? "* Hạt đỏ dao động thẳng đứng!" : waveType === "longitudinal" ? "* Sóng nén / giãn dọc!" : "* Giao thoa 2 nguồn kết hợp"}
            </div>
          </div>

          {/* Canvas viewport */}
          <div className="flex-1 flex justify-center bg-radial from-slate-900 to-slate-950 p-4 items-center">
            <canvas
              id="wave-simulation-canvas"
              ref={canvasRef}
              width={480}
              height={360}
              className="w-full max-w-[480px] h-[360px] block"
            />
          </div>
        </div>

        {/* Type Select and info overlay */}
        <div className="bg-slate-900/95 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
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
              <label htmlFor="slider-wave-amp" className="font-bold text-slate-755 text-base">Biên độ sóng (A)</label>
              <span className="font-mono text-base text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-lg font-black border border-blue-250 shadow-sm">
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
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-450 font-mono">
              <span>10px (Thấp)</span>
              <span>70px (Cao)</span>
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="slider-wave-freq" className="font-bold text-slate-755 text-base">Tần số dao động (f)</label>
              <span className="font-mono text-base text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-lg font-black border border-blue-250 shadow-sm">
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
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-450 font-mono">
              <span>0.2 Hz (Chậm)</span>
              <span>4.0 Hz (Nhanh)</span>
            </div>
          </div>

          {/* Speed */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="slider-wave-speed" className="font-bold text-slate-755 text-base">Tốc độ truyền sóng (v)</label>
              <span className="font-mono text-base text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-lg font-black border border-blue-250 shadow-sm">
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
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-450 font-mono">
              <span>40 px/s (Trì trì)</span>
              <span>200 px/s (Vụt qua)</span>
            </div>
          </div>

          {/* Damping */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="slider-wave-damping" className="font-bold text-slate-755 text-base flex items-center gap-1.5">
                Sự tắt dần trong môi trường (damping)
                <span className="text-slate-400 cursor-help" title="Làm biên độ sóng giảm dần khi truyền ra xa">
                  <Info className="h-4 w-4" />
                </span>
              </label>
              <span className="font-mono text-base text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-lg font-black border border-blue-250 shadow-sm">
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
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-450 font-mono">
              <span>0.0 (Bảo toàn)</span>
              <span>5.0 (Tắt nhanh)</span>
            </div>
          </div>

          {/* Visualization Toggles */}
          <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row sm:items-center gap-6 pt-4 text-sm border-t border-slate-100">
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-750 select-none">
              <input
                id="wave-toggle-coordinate-axis"
                type="checkbox"
                checked={showCoordinateAxis}
                onChange={(e) => setShowCoordinateAxis(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="font-bold text-slate-850">Hiện Trục tọa độ & Chỉ số (u-x)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
