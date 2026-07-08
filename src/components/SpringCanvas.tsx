import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Save, Sliders, Info, Activity } from "lucide-react";
import { SpringParams } from "../types";

interface SpringCanvasProps {
  params: SpringParams;
  setParams: (p: SpringParams) => void;
  onSaveObservation: (results: { period: number; maxEnergy: number; frequency: number }) => void;
}

export default function SpringCanvas({ params, setParams, onSaveObservation }: SpringCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulation state
  const [x, setX] = useState(params.initialX / 100); // displacement from equilibrium in meters
  const [v, setV] = useState(0); // velocity (m/s)
  const [isPlaying, setIsPlaying] = useState(true);

  // Visualization options
  const [showVectors, setShowVectors] = useState(true);
  const [showEquilibrium, setShowEquilibrium] = useState(true);
  const [showCoordinateAxis, setShowCoordinateAxis] = useState(true);

  // Refs for physics loop
  const stateRef = useRef({
    x: params.initialX / 100,
    v: 0,
    isPlaying: true,
    dragging: false,
  });

  useEffect(() => {
    stateRef.current.isPlaying = isPlaying;
  }, [isPlaying]);

  // Sync parameters when changed in sliders
  useEffect(() => {
    if (!stateRef.current.dragging) {
      stateRef.current.x = params.initialX / 100;
      stateRef.current.v = 0;
      setX(params.initialX / 100);
      setV(0);
    }
  }, [params.initialX, params.k, params.mass]);

  // Canvas render and physics update loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const updateSimulation = (now: number) => {
      let dt = (now - lastTime) / 1000;
      lastTime = now;

      if (dt > 0.1) dt = 0.1; // clamp delta time

      const k = params.k;
      const m = params.mass;
      const b = params.damping;

      // 1. Physics update
      if (stateRef.current.isPlaying && !stateRef.current.dragging) {
        // Force F = -k*x - b*v
        const F = -k * stateRef.current.x - b * stateRef.current.v;
        const acceleration = F / m;

        // Euler-Cromer integration for stability
        stateRef.current.v += acceleration * dt;
        stateRef.current.x += stateRef.current.v * dt;

        setX(stateRef.current.x);
        setV(stateRef.current.v);
      }

      // 2. Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const ceilingY = 50;
      const equilibriumY = 180; // equilibrium position in pixels

      // Map displacement (meters) to pixels
      // Let 1.0 meter displacement = 400 pixels (since max initialX is 10cm or 0.1m, 0.1m * 1000 = 100px displacement)
      const scale = 1000; 
      const currentY = equilibriumY + stateRef.current.x * scale;

      // Draw Ceiling Support
      ctx.save();
      ctx.fillStyle = "#475569";
      ctx.fillRect(centerX - 60, ceilingY - 10, 120, 10);
      ctx.restore();

      // Draw Equilibrium Guideline
      if (showEquilibrium) {
        ctx.save();
        ctx.strokeStyle = "rgba(16, 185, 129, 0.35)";
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(centerX - 100, equilibriumY);
        ctx.lineTo(centerX + 100, equilibriumY);
        ctx.stroke();

        ctx.fillStyle = "rgba(16, 185, 129, 0.8)";
        ctx.font = "10px sans-serif";
        ctx.fillText("Vị trí cân bằng (O)", centerX + 110, equilibriumY + 3);
        ctx.restore();
      }

      // Draw Spring
      ctx.save();
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      
      const numCoils = 16;
      const springWidth = 24;
      const topOffset = 10;
      const bottomOffset = 15;
      
      const startY = ceilingY;
      const endY = currentY - bottomOffset;
      const activeHeight = endY - (startY + topOffset);

      ctx.moveTo(centerX, startY);
      ctx.lineTo(centerX, startY + topOffset);

      for (let i = 0; i < numCoils; i++) {
        const fraction = (i + 0.5) / numCoils;
        const coilY = startY + topOffset + activeHeight * fraction;
        const direction = i % 2 === 0 ? 1 : -1;
        const coilX = centerX + springWidth * direction;
        ctx.lineTo(coilX, coilY);
      }

      ctx.lineTo(centerX, endY);
      ctx.lineTo(centerX, currentY);
      ctx.stroke();
      ctx.restore();

      // Draw Mass (Oscillating block)
      ctx.save();
      const blockWidth = 50 + Math.cbrt(m) * 15;
      const blockHeight = 40 + Math.cbrt(m) * 10;
      
      const blockX = centerX - blockWidth / 2;
      const blockY = currentY;

      // Metallic block styling
      const grad = ctx.createLinearGradient(blockX, blockY, blockX + blockWidth, blockY + blockHeight);
      grad.addColorStop(0, "#3b82f6");
      grad.addColorStop(1, "#1d4ed8");
      
      ctx.fillStyle = grad;
      ctx.shadowColor = "rgba(59, 130, 246, 0.4)";
      ctx.shadowBlur = 8;
      ctx.fillRect(blockX, blockY, blockWidth, blockHeight);
      
      // Draw label inside block
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${m.toFixed(2)} kg`, centerX, blockY + blockHeight / 2 + 4);
      ctx.restore();

      // Draw Force & Velocity Vectors
      if (showVectors && !stateRef.current.dragging) {
        ctx.save();
        const vectorScale = 4.0; // scale force vector for readability

        // 1. Elastic Restoring Force F_dh = -k * x
        const F_dh = -k * stateRef.current.x;
        const arrowY = currentY + blockHeight / 2;

        if (Math.abs(F_dh) > 0.05) {
          // force is upwards when x > 0 (downwards) and vice versa
          const targetY = arrowY + F_dh * vectorScale;
          drawArrow(ctx, centerX, arrowY, centerX, targetY, "#ef4444", 2.5);
          ctx.fillStyle = "#ef4444";
          ctx.font = "10px sans-serif";
          ctx.fillText("F_đh (Lực đàn hồi)", centerX - 105, targetY + (F_dh > 0 ? 12 : -4));
        }

        // 2. Velocity vector
        const currentV = stateRef.current.v;
        if (Math.abs(currentV) > 0.05) {
          const targetVY = arrowY + currentV * 25; // scaled velocity
          drawArrow(ctx, centerX + 40, arrowY, centerX + 40, targetVY, "#22c55e", 2.5);
          ctx.fillStyle = "#22c55e";
          ctx.font = "10px sans-serif";
          ctx.fillText("v (Vận tốc)", centerX + 48, targetVY + 3);
        }

        ctx.restore();
      }

      // Draw Coordinate Axis (Trục tọa độ thẳng đứng Oy từ -A đến A)
      if (showCoordinateAxis) {
        ctx.save();

        const axisX = centerX - 120;
        const amplitudeCm = Math.abs(params.initialX);
        const pixelAmplitude = (amplitudeCm / 100) * scale; // 1000 px/m * (cm / 100)
        const currentBlockY = equilibriumY + stateRef.current.x * scale;

        // 1. Draw horizontal dashed projection line from block to the Axis
        ctx.strokeStyle = "rgba(14, 165, 233, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(centerX, currentBlockY);
        ctx.lineTo(axisX, currentBlockY);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash

        // 2. Draw the Vertical Axis Line (Oy pointing downwards)
        const axisTop = equilibriumY - Math.max(pixelAmplitude, 60) - 20;
        const axisBottom = equilibriumY + Math.max(pixelAmplitude, 60) + 20;

        ctx.strokeStyle = "rgba(148, 163, 184, 0.4)"; // Slate-400
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(axisX, axisTop);
        ctx.lineTo(axisX, axisBottom + 15); // extend bottom for arrow head
        ctx.stroke();

        // Arrow head pointing downwards (positive direction)
        ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
        ctx.beginPath();
        ctx.moveTo(axisX, axisBottom + 15);
        ctx.lineTo(axisX - 4, axisBottom + 7);
        ctx.lineTo(axisX + 4, axisBottom + 7);
        ctx.closePath();
        ctx.fill();

        // Label for axis variable "x" at the bottom
        ctx.fillStyle = "#cbd5e1"; // Slate-300
        ctx.font = "italic bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("x (cm)", axisX, axisBottom + 22);

        // 3. Draw tick marks and labels
        ctx.fillStyle = "#cbd5e1"; // Higher contrast text color
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 1.5;

        // Equilibrium position (0)
        ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
        ctx.beginPath();
        ctx.moveTo(axisX - 7, equilibriumY);
        ctx.lineTo(axisX + 7, equilibriumY);
        ctx.stroke();
        
        ctx.fillStyle = "#cbd5e1";
        ctx.fillText("0 (VTCB)", axisX - 10, equilibriumY);

        // If amplitude is non-zero, draw -A and +A ticks
        if (pixelAmplitude > 1) {
          // Negative Amplitude (-A) - Upper bound for compression
          ctx.strokeStyle = "#ef4444"; // red for upper bound
          ctx.beginPath();
          ctx.moveTo(axisX - 7, equilibriumY - pixelAmplitude);
          ctx.lineTo(axisX + 7, equilibriumY - pixelAmplitude);
          ctx.stroke();

          ctx.fillStyle = "#fca5a5"; // soft red
          ctx.font = "bold 13px monospace";
          ctx.fillText("-A", axisX - 10, equilibriumY - pixelAmplitude);
          ctx.font = "bold 11px monospace";
          ctx.fillStyle = "#ef4444";
          ctx.fillText(`-${amplitudeCm}cm`, axisX - 10, equilibriumY - pixelAmplitude + 14);

          // Positive Amplitude (+A) - Lower bound for stretch
          ctx.strokeStyle = "#22c55e"; // green for lower bound
          ctx.beginPath();
          ctx.moveTo(axisX - 7, equilibriumY + pixelAmplitude);
          ctx.lineTo(axisX + 7, equilibriumY + pixelAmplitude);
          ctx.stroke();

          ctx.font = "bold 13px monospace";
          ctx.fillStyle = "#86efac"; // soft green
          ctx.fillText("+A", axisX - 10, equilibriumY + pixelAmplitude);
          ctx.font = "bold 11px monospace";
          ctx.fillStyle = "#22c55e";
          ctx.fillText(`+${amplitudeCm}cm`, axisX - 10, equilibriumY + pixelAmplitude + 14);
        }

        // 4. Draw current position marker on the vertical axis
        const currentXCm = stateRef.current.x * 100;
        
        // Draw a distinct glowing dot representing current x(t)
        ctx.shadowColor = "#38bdf8"; // Sky-400 glow
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#0284c7"; // Sky-600
        ctx.strokeStyle = "#38bdf8"; // Sky-400 border
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(axisX, currentBlockY, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Reset shadow for subsequent draws
        ctx.shadowBlur = 0;

        // Label for current position x(t) value to the right of the axis
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(`x = ${currentXCm >= 0 ? "+" : ""}${currentXCm.toFixed(1)}cm`, axisX + 12, currentBlockY);

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(updateSimulation);
    };

    // Draw arrow utility
    const drawArrow = (
      c: CanvasRenderingContext2D,
      fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      color: string,
      width: number
    ) => {
      const headLength = 7;
      const angle = Math.atan2(toY - fromY, toX - fromX);
      c.strokeStyle = color;
      c.fillStyle = color;
      c.lineWidth = width;
      c.beginPath();
      c.moveTo(fromX, fromY);
      c.lineTo(toX, toY);
      c.stroke();

      c.beginPath();
      c.moveTo(toX, toY);
      c.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
      c.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
      c.closePath();
      c.fill();
    };

    animationFrameId = requestAnimationFrame(updateSimulation);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [params, showVectors, showEquilibrium, showCoordinateAxis]);

  // Handle Drag-and-drop to pull mass down or push it up
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;

    const m = params.mass;
    const blockHeight = 40 + Math.cbrt(m) * 10;
    const scale = 1000;
    const currentY = 180 + stateRef.current.x * scale;

    // Check if clicked inside or near block vertical boundaries
    if (y >= currentY - 15 && y <= currentY + blockHeight + 15) {
      stateRef.current.dragging = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.dragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;

    const equilibriumY = 180;
    const scale = 1000;

    // Displacement in meters: (y - equilibriumY) / scale
    let newX = (y - equilibriumY) / scale;

    // Clamp displacement to ±10 cm (±0.10 m) for stability
    if (newX > 0.10) newX = 0.10;
    if (newX < -0.10) newX = -0.10;

    stateRef.current.x = newX;
    stateRef.current.v = 0; // stop motion during dragging

    setX(newX);
    setV(0);

    // Sync displacement back to parameters (in cm)
    const dispCm = Math.round(newX * 100);
    setParams({ ...params, initialX: dispCm });
  };

  const handleMouseUpOrLeave = () => {
    if (stateRef.current.dragging) {
      stateRef.current.dragging = false;
    }
  };

  const handleReset = () => {
    stateRef.current.x = params.initialX / 100;
    stateRef.current.v = 0;
    setX(params.initialX / 100);
    setV(0);
  };

  // Energy calculations
  const k = params.k;
  const m = params.mass;
  const elasticEnergy = 0.5 * k * x * x; // 0.5 * k * x^2
  const kineticEnergy = 0.5 * m * v * v; // 0.5 * m * v^2
  const totalEnergy = elasticEnergy + kineticEnergy;

  const maxTotalEnergyRef = useRef(1.0);
  useEffect(() => {
    if (totalEnergy > maxTotalEnergyRef.current) {
      maxTotalEnergyRef.current = Math.max(totalEnergy, 0.1);
    }
  }, [totalEnergy]);

  useEffect(() => {
    maxTotalEnergyRef.current = 0.1;
  }, [params.k, params.mass, params.initialX]);

  const theoreticalPeriod = k > 0 ? 2 * Math.PI * Math.sqrt(m / k) : 0;
  const frequency = theoreticalPeriod > 0 ? 1 / theoreticalPeriod : 0;

  const onSave = () => {
    onSaveObservation({
      period: theoreticalPeriod,
      maxEnergy: totalEnergy,
      frequency: frequency,
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
                <span className="text-slate-400 font-medium">Li độ (x):</span>
                <span className="font-mono text-base font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {(x * 100).toFixed(1)} cm
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400 font-medium">Vận tốc (v):</span>
                <span className="font-mono text-base font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {(v * 100).toFixed(1)} cm/s
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-slate-800/60 pt-2.5">
                <span className="text-slate-400 font-medium">Chu kỳ lý thuyết T:</span>
                <span className="font-mono text-base font-black text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  {theoreticalPeriod.toFixed(3)}s
                </span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 leading-normal border-t border-slate-800/40 pt-2.5 mt-3 font-sans">
              * Kéo thả khối kim loại để chỉnh li độ x₀
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 flex justify-center bg-radial from-slate-900 to-slate-950 p-4 items-center">
            <canvas
              id="spring-simulation-canvas"
              ref={canvasRef}
              width={480}
              height={360}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              className="w-full max-w-[480px] h-[360px] cursor-grab active:cursor-grabbing block"
            />
          </div>
        </div>

        {/* Energy bar overlays */}
        <div className="bg-slate-900/90 p-4">
          <h4 className="text-xs font-bold text-slate-350 mb-2 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-blue-400" />
            Biểu Đồ Năng Lượng Dao Động (Oscillator Energy)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] font-mono">
            {/* Kinetic Energy */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-emerald-450">Động Năng (W_đ)</span>
                <span>{kineticEnergy.toFixed(4)} J</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-75"
                  style={{ width: `${Math.min((kineticEnergy / maxTotalEnergyRef.current) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Elastic Potential Energy */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sky-400">Thế Năng Đàn Hồi (W_t)</span>
                <span>{elasticEnergy.toFixed(4)} J</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-75"
                  style={{ width: `${Math.min((elasticEnergy / maxTotalEnergyRef.current) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Mechanical Energy */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-teal-400 font-bold">Cơ Năng (W)</span>
                <span>{totalEnergy.toFixed(4)} J</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-400 rounded-full"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Physics sliders */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2.5">
            <Sliders className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">Bảng Điều Khiển Con Lắc Lò Xo</h3>
          </div>
          
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              id="spring-play-pause"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm transition-all cursor-pointer ${
                isPlaying ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4" /> Tạm dừng
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Chạy tiếp
                </>
              )}
            </button>
            <button
              id="spring-reset"
              onClick={handleReset}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" /> Đặt lại
            </button>
            <button
              id="spring-save"
              onClick={onSave}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-750 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <Save className="h-4 w-4" /> Lưu Số liệu
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-base">
          {/* Spring Constant (k) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="slider-spring-k" className="font-bold text-slate-755 text-base">Độ cứng lò xo (k)</label>
              <span className="font-mono text-base text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-lg font-black border border-blue-250 shadow-sm">
                {params.k} N/m
              </span>
            </div>
            <input
              id="slider-spring-k"
              type="range"
              min="10"
              max="100"
              step="5"
              value={params.k}
              onChange={(e) => setParams({ ...params, k: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-450 font-mono">
              <span>10 N/m (Yếu)</span>
              <span>100 N/m (Cứng)</span>
            </div>
          </div>

          {/* Mass (m) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="slider-spring-mass" className="font-bold text-slate-755 text-base">Khối lượng vật nặng (m)</label>
              <span className="font-mono text-base text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-lg font-black border border-blue-250 shadow-sm">
                {params.mass.toFixed(2)} kg
              </span>
            </div>
            <input
              id="slider-spring-mass"
              type="range"
              min="0.10"
              max="3.00"
              step="0.05"
              value={params.mass}
              onChange={(e) => setParams({ ...params, mass: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-450 font-mono">
              <span>0.10 kg (Nhẹ)</span>
              <span>3.00 kg (Nặng)</span>
            </div>
          </div>

          {/* Initial displacement (x0) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="slider-spring-x0" className="font-bold text-slate-755 text-base">Li độ ban đầu (x₀)</label>
              <span className="font-mono text-base text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-lg font-black border border-blue-250 shadow-sm">
                {params.initialX} cm
              </span>
            </div>
            <input
              id="slider-spring-x0"
              type="range"
              min="-10"
              max="10"
              step="1"
              value={params.initialX}
              onChange={(e) => setParams({ ...params, initialX: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-450 font-mono">
              <span>-10 cm (Co)</span>
              <span>0 cm (Cân bằng)</span>
              <span>10 cm (Giãn)</span>
            </div>
          </div>

          {/* Damping */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="slider-spring-damping" className="font-bold text-slate-750 flex items-center gap-1.5 text-base">
                Lực cản môi trường (damping)
                <span className="text-slate-400 cursor-help" title="Làm dao động tắt dần theo thời gian">
                  <Info className="h-4 w-4" />
                </span>
              </label>
              <span className="font-mono text-base text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-lg font-black border border-blue-250 shadow-sm">
                {params.damping.toFixed(2)}
              </span>
            </div>
            <input
              id="slider-spring-damping"
              type="range"
              min="0.00"
              max="0.50"
              step="0.02"
              value={params.damping}
              onChange={(e) => setParams({ ...params, damping: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-450 font-mono">
              <span>0.00 (Chân không)</span>
              <span>0.50 (Cản mạnh)</span>
            </div>
          </div>

          {/* Visualization Toggles */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 pt-4 text-base">
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-750 select-none">
              <input
                id="spring-toggle-vectors"
                type="checkbox"
                checked={showVectors}
                onChange={(e) => setShowVectors(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="font-bold text-slate-850">Hiện Vector Lực & Vận tốc</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-750 select-none">
              <input
                id="spring-toggle-equilibrium"
                type="checkbox"
                checked={showEquilibrium}
                onChange={(e) => setShowEquilibrium(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="font-bold text-slate-850">Hiện Vị trí cân bằng</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-750 select-none">
              <input
                id="spring-toggle-coordinate-axis"
                type="checkbox"
                checked={showCoordinateAxis}
                onChange={(e) => setShowCoordinateAxis(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="font-bold text-slate-850">Hiện Trục tọa độ (-A đến A)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
