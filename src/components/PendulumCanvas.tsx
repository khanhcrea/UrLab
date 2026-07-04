import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Eye, Save, Sliders, Info, Activity } from "lucide-react";
import { PendulumParams } from "../types";

interface PendulumCanvasProps {
  params: PendulumParams;
  setParams: (p: PendulumParams) => void;
  onSaveObservation: (results: { period: number; maxEnergy: number; thetaMaxDeg: number }) => void;
}

export default function PendulumCanvas({ params, setParams, onSaveObservation }: PendulumCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Physics States
  const [theta, setTheta] = useState((params.initialAngle * Math.PI) / 180); // in radians
  const [omega, setOmega] = useState(0); // angular velocity (rad/s)
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Custom View Options
  const [showVectors, setShowVectors] = useState(true);
  const [showProtractor, setShowProtractor] = useState(true);
  const [trail, setTrail] = useState<{ x: number; y: number; opacity: number }[]>([]);

  // Refs for animation loop to avoid dependency lag
  const stateRef = useRef({
    theta: (params.initialAngle * Math.PI) / 180,
    omega: 0,
    isPlaying: true,
    dragging: false,
  });

  // Keep ref updated
  useEffect(() => {
    stateRef.current.isPlaying = isPlaying;
  }, [isPlaying]);

  // Handle changes in initialAngle, Length, Gravity
  useEffect(() => {
    if (!stateRef.current.dragging) {
      stateRef.current.theta = (params.initialAngle * Math.PI) / 180;
      stateRef.current.omega = 0;
      setTheta((params.initialAngle * Math.PI) / 180);
      setOmega(0);
      setTrail([]);
    }
  }, [params.initialAngle, params.length, params.gravity]);

  // Main Canvas Render & Physics Update Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const updateSimulation = (now: number) => {
      // Calculate delta time
      let dt = (now - lastTime) / 1000;
      lastTime = now;

      // Cap dt to prevent huge jumps
      if (dt > 0.1) dt = 0.1;

      const L = params.length;
      const g = params.gravity;
      const m = params.mass;
      const b = params.damping; // damping coefficient

      // 1. Physics Step (if playing and not dragging)
      if (stateRef.current.isPlaying && !stateRef.current.dragging) {
        // Equation of motion: alpha = -(g/L) * sin(theta) - (damping / m) * omega
        const alpha = -(g / L) * Math.sin(stateRef.current.theta) - (b / m) * stateRef.current.omega;
        
        // Euler-Cromer integration (stable for oscillatory systems)
        stateRef.current.omega += alpha * dt;
        stateRef.current.theta += stateRef.current.omega * dt;

        // Sync with React states for UI indicators
        setTheta(stateRef.current.theta);
        setOmega(stateRef.current.omega);
      }

      // 2. Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Pivot position (centered horizontally near the top)
      const pivotX = canvas.width / 2;
      const pivotY = 60;
      
      // Scaling factor: map length L (meters) to pixels
      // Let 1.0 meter = 120 pixels
      const pixelLength = L * 100;
      
      // Bob Coordinates
      const bobX = pivotX + pixelLength * Math.sin(stateRef.current.theta);
      const bobY = pivotY + pixelLength * Math.cos(stateRef.current.theta);

      // Add to trail
      if (stateRef.current.isPlaying && !stateRef.current.dragging && Math.abs(stateRef.current.omega) > 0.05) {
        setTrail((prev) => {
          const newTrail = [{ x: bobX, y: bobY, opacity: 1.0 }, ...prev];
          return newTrail.slice(0, 20).map((t, idx) => ({ ...t, opacity: 1.0 - idx * 0.05 }));
        });
      }

      // Draw Protractor / Angle Grid background
      if (showProtractor) {
        ctx.save();
        ctx.strokeStyle = "rgba(100, 116, 139, 0.15)";
        ctx.fillStyle = "rgba(100, 116, 139, 0.05)";
        ctx.lineWidth = 1;

        // Draw radial arc
        ctx.beginPath();
        ctx.arc(pivotX, pivotY, pixelLength, 0, Math.PI);
        ctx.stroke();

        // Draw 15 degree tick marks
        for (let deg = -90; deg <= 90; deg += 15) {
          const rad = (deg * Math.PI) / 180 + Math.PI / 2;
          const tickLength = 12;
          const startX = pivotX + (pixelLength - tickLength) * Math.cos(rad);
          const startY = pivotY + (pixelLength - tickLength) * Math.sin(rad);
          const endX = pivotX + (pixelLength + 4) * Math.cos(rad);
          const endY = pivotY + (pixelLength + 4) * Math.sin(rad);

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // Angle labels
          if (deg % 30 === 0) {
            ctx.fillStyle = "rgba(100, 116, 139, 0.6)";
            ctx.font = "9px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const textX = pivotX + (pixelLength + 15) * Math.cos(rad);
            const textY = pivotY + (pixelLength + 15) * Math.sin(rad);
            ctx.fillText(`${deg}°`, textX, textY);
          }
        }
        ctx.restore();
      }

      // Draw Trail
      ctx.save();
      trail.forEach((point) => {
        ctx.fillStyle = `rgba(20, 184, 166, ${point.opacity * 0.25})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
        ctx.fill();
      });
      ctx.restore();

      // Draw Support Stand (Ceiling)
      ctx.save();
      ctx.fillStyle = "#475569";
      ctx.fillRect(pivotX - 60, pivotY - 12, 120, 10);
      
      // Pivot anchor circle
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.arc(pivotX, pivotY - 7, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();

      // Draw Rod/String
      ctx.save();
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY - 7);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();
      ctx.restore();

      // Draw Pendulum Bob (Size proportional to cube root of mass to represent physical size scale)
      ctx.save();
      const bobRadius = 12 + Math.cbrt(m) * 6;
      const gradient = ctx.createRadialGradient(
        bobX - bobRadius / 3,
        bobY - bobRadius / 3,
        1,
        bobX,
        bobY,
        bobRadius
      );
      gradient.addColorStop(0, "#2fd5f6");
      gradient.addColorStop(1, "#0284c7");
      
      ctx.fillStyle = gradient;
      ctx.shadowColor = "rgba(2, 132, 199, 0.4)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(bobX, bobY, bobRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();

      // Draw Force/Velocity Vectors
      if (showVectors && !stateRef.current.dragging) {
        ctx.save();
        
        // Scale vector lengths for visibility
        const velocityScale = 18;
        const forceScale = 15;

        // Current velocity: v = L * omega
        const v = L * stateRef.current.omega;
        // Direction of velocity is perpendicular to rod: (cos(theta), -sin(theta))
        const vx = v * Math.cos(stateRef.current.theta);
        const vy = -v * Math.sin(stateRef.current.theta);

        // 1. Draw Velocity Vector (Green Arrow)
        if (Math.abs(v) > 0.02) {
          drawArrow(ctx, bobX, bobY, bobX + vx * velocityScale, bobY + vy * velocityScale, "#22c55e", 2.5);
          ctx.fillStyle = "#22c55e";
          ctx.font = "10px sans-serif";
          ctx.fillText("v (Vận tốc)", bobX + vx * velocityScale + 8, bobY + vy * velocityScale + 4);
        }

        // 2. Draw Gravity and Restoring Forces
        // Gravity (Downwards)
        const FgY = m * g;
        drawArrow(ctx, bobX, bobY, bobX, bobY + forceScale * 3, "#ef4444", 2);
        ctx.fillStyle = "#ef4444";
        ctx.font = "10px sans-serif";
        ctx.fillText("P (Trọng lực)", bobX - 35, bobY + forceScale * 3 + 12);

        // Restoring Force (Tangential: Ft = -m * g * sin(theta))
        const Ft = -m * g * Math.sin(stateRef.current.theta);
        const Ftx = Ft * Math.cos(stateRef.current.theta);
        const Fty = -Ft * Math.sin(stateRef.current.theta);
        if (Math.abs(Ft) > 0.1) {
          drawArrow(ctx, bobX, bobY, bobX + Ftx * forceScale, bobY + Fty * forceScale, "#f59e0b", 2.5);
          ctx.fillStyle = "#f59e0b";
          ctx.font = "10px sans-serif";
          ctx.fillText("F_kéo về", bobX + Ftx * forceScale + 8, bobY + Fty * forceScale);
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(updateSimulation);
    };

    // Helper arrow-drawing function
    const drawArrow = (
      c: CanvasRenderingContext2D,
      fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      color: string,
      width: number
    ) => {
      const headLength = 8;
      const angle = Math.atan2(toY - fromY, toX - fromX);
      c.strokeStyle = color;
      c.fillStyle = color;
      c.lineWidth = width;
      c.beginPath();
      c.moveTo(fromX, fromY);
      c.lineTo(toX, toY);
      c.stroke();

      // head
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
  }, [params, showVectors, showProtractor, trail]);

  // Handle Drag-and-drop to pull the pendulum bob
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pivotX = canvas.width / 2;
    const pivotY = 60;
    const pixelLength = params.length * 100;

    const bobX = pivotX + pixelLength * Math.sin(stateRef.current.theta);
    const bobY = pivotY + pixelLength * Math.cos(stateRef.current.theta);

    // Calculate distance between click and current bob center
    const dist = Math.hypot(x - bobX, y - bobY);
    const m = params.mass;
    const bobRadius = 12 + Math.cbrt(m) * 6;

    if (dist < bobRadius + 15) {
      stateRef.current.dragging = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.dragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pivotX = canvas.width / 2;
    const pivotY = 60;

    // Calculate new angle relative to vertical downward line (dx, dy)
    const dx = x - pivotX;
    const dy = y - pivotY;

    // Angle theta: 0 is straight down, positive is to the right, negative to the left
    let newTheta = Math.atan2(dx, dy);

    // Clamp angle to -90 to +90 degrees for standard pendulum stability
    const maxRad = (90 * Math.PI) / 180;
    if (newTheta > maxRad) newTheta = maxRad;
    if (newTheta < -maxRad) newTheta = -maxRad;

    stateRef.current.theta = newTheta;
    stateRef.current.omega = 0; // reset speed while dragging
    
    setTheta(newTheta);
    setOmega(0);

    // Sync angle back to parameter slider
    const angleDeg = Math.round((newTheta * 180) / Math.PI);
    setParams({ ...params, initialAngle: angleDeg });
  };

  const handleMouseUpOrLeave = () => {
    if (stateRef.current.dragging) {
      stateRef.current.dragging = false;
      // Restart physics with the newly set dragging angle
    }
  };

  // Physical Energy Computations
  const L = params.length;
  const g = params.gravity;
  const m = params.mass;
  
  // Height from lowest position: h = L * (1 - cos(theta))
  const height = L * (1 - Math.cos(theta));
  // Potential Energy: Ep = m * g * h
  const potentialEnergy = m * g * height;
  // Linear Velocity: v = L * omega
  const vLinear = L * omega;
  // Kinetic Energy: Ek = 0.5 * m * v^2
  const kineticEnergy = 0.5 * m * vLinear * vLinear;
  const totalEnergy = potentialEnergy + kineticEnergy;

  const maxTotalEnergyRef = useRef(1);
  useEffect(() => {
    // Track maximum energy dynamically to keep bars scaled
    if (totalEnergy > maxTotalEnergyRef.current) {
      maxTotalEnergyRef.current = Math.max(totalEnergy, 1);
    }
  }, [totalEnergy]);

  // Reset max energy tracker when parameters update
  useEffect(() => {
    maxTotalEnergyRef.current = 1;
  }, [params.length, params.gravity, params.mass, params.initialAngle]);

  const handleReset = () => {
    stateRef.current.theta = (params.initialAngle * Math.PI) / 180;
    stateRef.current.omega = 0;
    setTheta((params.initialAngle * Math.PI) / 180);
    setOmega(0);
    setTrail([]);
  };

  // Period T = 2 * pi * sqrt(L/g)
  const theoreticalPeriod = g > 0 ? 2 * Math.PI * Math.sqrt(L / g) : 0;

  const onSave = () => {
    onSaveObservation({
      period: theoreticalPeriod,
      maxEnergy: totalEnergy,
      thetaMaxDeg: Math.abs(params.initialAngle)
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Simulation Box */}
      <div className="relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {/* Top Status Bar overlay */}
        <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between text-xs font-mono text-slate-400 pointer-events-none">
          <div className="flex gap-4">
            <span>Góc hiện tại: <strong className="text-teal-400">{Math.round((theta * 180) / Math.PI)}°</strong></span>
            <span>Vận tốc góc: <strong className="text-green-400">{omega.toFixed(2)} rad/s</strong></span>
          </div>
          <span className="hidden sm:inline bg-slate-900/90 px-2 py-0.5 rounded text-slate-500 border border-slate-800/60">
            Kéo thả quả cầu để thử nghiệm góc mới!
          </span>
        </div>

        {/* Physics HTML5 Canvas */}
        <div className="w-full flex justify-center bg-radial from-slate-900 to-slate-950">
          <canvas
            id="pendulum-simulation-canvas"
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

        {/* Dynamic Energy Bar Overlay at bottom */}
        <div className="bg-slate-900/90 border-t border-slate-800 p-4">
          <h4 className="text-xs font-bold text-slate-350 mb-2 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-blue-400" />
            Biểu Đồ Bảo Toàn Cơ Năng (Mechanical Energy)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] font-mono">
            {/* Kinetic Energy Bar */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-emerald-450">Động Năng (E_d)</span>
                <span>{kineticEnergy.toFixed(3)} J</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-75"
                  style={{ width: `${Math.min((kineticEnergy / maxTotalEnergyRef.current) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Potential Energy Bar */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sky-400">Thế Năng (E_t)</span>
                <span>{potentialEnergy.toFixed(3)} J</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-75"
                  style={{ width: `${Math.min((potentialEnergy / maxTotalEnergyRef.current) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Total Energy Bar */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-teal-400 font-bold">Cơ Năng Toàn Phần</span>
                <span>{totalEnergy.toFixed(3)} J</span>
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

      {/* Physics Controls Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2.5">
            <Sliders className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">Bảng Điều Khiển Vật Lý</h3>
          </div>
          {/* Simulation Play/Pause & Reset */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              id="control-play-pause"
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
              id="control-reset"
              onClick={handleReset}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Đặt lại về vị trí ban đầu"
            >
              <RotateCcw className="h-4 w-4" /> Đặt lại
            </button>
            <button
              id="control-save-observation"
              onClick={onSave}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-750 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer ml-auto sm:ml-0"
              title="Lưu kết quả đo vào Sổ tay"
            >
              <Save className="h-4 w-4" /> Lưu Số liệu
            </button>
          </div>
        </div>

        {/* Simulation Param Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-base">
          {/* Length Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="slider-length" className="font-bold text-slate-750 flex items-center gap-1.5 text-base">
                Chiều dài dây treo (L)
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono font-medium">Sổ tay</span>
              </label>
              <span className="font-mono text-sm text-blue-600 bg-blue-50 px-2.5 py-1 rounded font-black">
                {params.length.toFixed(2)} m
              </span>
            </div>
            <input
              id="slider-length"
              type="range"
              min="0.50"
              max="2.50"
              step="0.05"
              value={params.length}
              onChange={(e) => setParams({ ...params, length: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-450 font-mono">
              <span>0.50m (Ngắn)</span>
              <span>2.50m (Dài)</span>
            </div>
          </div>

          {/* Gravity Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="slider-gravity" className="font-bold text-slate-755 text-base">Gia tốc trọng trường (g)</label>
              <span className="font-mono text-sm text-blue-600 bg-blue-50 px-2.5 py-1 rounded font-black">
                {params.gravity.toFixed(2)} m/s²
              </span>
            </div>
            <input
              id="slider-gravity"
              type="range"
              min="0.00"
              max="25.00"
              step="0.1"
              value={params.gravity}
              onChange={(e) => setParams({ ...params, gravity: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            {/* Quick Presets */}
            <div className="flex justify-between items-center text-xs font-mono text-slate-500 flex-wrap gap-x-2 gap-y-1">
              <span className="hover:text-blue-600 cursor-pointer" onClick={() => setParams({ ...params, gravity: 0 })}>Zero G (0)</span>
              <span className="hover:text-blue-600 cursor-pointer underline decoration-dotted" onClick={() => setParams({ ...params, gravity: 1.62 })}>Mặt Trăng (1.62)</span>
              <span className="hover:text-blue-600 cursor-pointer underline decoration-dotted" onClick={() => setParams({ ...params, gravity: 9.8 })}>Trái Đất (9.8)</span>
              <span className="hover:text-blue-600 cursor-pointer underline decoration-dotted" onClick={() => setParams({ ...params, gravity: 24.79 })}>Sao Mộc (24.79)</span>
            </div>
          </div>

          {/* Initial Angle Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="slider-angle" className="font-bold text-slate-755 text-base">Góc lệch cực đại (θ₀)</label>
              <span className="font-mono text-sm text-blue-600 bg-blue-50 px-2.5 py-1 rounded font-black">
                {params.initialAngle}°
              </span>
            </div>
            <input
              id="slider-angle"
              type="range"
              min="-85"
              max="85"
              step="1"
              value={params.initialAngle}
              onChange={(e) => setParams({ ...params, initialAngle: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-450 font-mono">
              <span>-85° (Trái)</span>
              <span>0° (Cân bằng)</span>
              <span>85° (Phải)</span>
            </div>
          </div>

          {/* Mass Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="slider-mass" className="font-bold text-slate-755 text-base">Khối lượng quả nặng (m)</label>
              <span className="font-mono text-sm text-blue-600 bg-blue-50 px-2.5 py-1 rounded font-black">
                {params.mass.toFixed(1)} kg
              </span>
            </div>
            <input
              id="slider-mass"
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={params.mass}
              onChange={(e) => setParams({ ...params, mass: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-450 font-mono">
              <span>0.1kg (Nhẹ)</span>
              <span>3.0kg (Nặng)</span>
            </div>
          </div>

          {/* Damping / Air Resistance Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="slider-damping" className="font-bold text-slate-750 flex items-center gap-1.5 text-base">
                Lực cản không khí (b)
                <span className="text-slate-400 cursor-help" title="Làm dao động tắt dần theo thời gian">
                  <Info className="h-4 w-4" />
                </span>
              </label>
              <span className="font-mono text-sm text-blue-600 bg-blue-50 px-2.5 py-1 rounded font-black">
                {params.damping.toFixed(2)}
              </span>
            </div>
            <input
              id="slider-damping"
              type="range"
              min="0.00"
              max="0.25"
              step="0.01"
              value={params.damping}
              onChange={(e) => setParams({ ...params, damping: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-450 font-mono">
              <span>0.00 (Chân không)</span>
              <span>0.25 (Cản mạnh)</span>
            </div>
          </div>

          {/* Visualization toggles */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 pt-4 text-base">
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-750 select-none">
              <input
                id="toggle-vectors"
                type="checkbox"
                checked={showVectors}
                onChange={(e) => setShowVectors(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="font-bold text-slate-850">Hiện Vector Lực & Vận tốc</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-750 select-none">
              <input
                id="toggle-protractor"
                type="checkbox"
                checked={showProtractor}
                onChange={(e) => setShowProtractor(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="font-bold text-slate-850">Hiện Thước đo độ</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
