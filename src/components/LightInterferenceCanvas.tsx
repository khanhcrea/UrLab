import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Save, Sliders, Info, Sparkles } from "lucide-react";
import { LightInterferenceParams } from "../types";

interface LightInterferenceCanvasProps {
  params: LightInterferenceParams;
  setParams: (p: LightInterferenceParams) => void;
  onSaveObservation: (results: {
    fringeWidth1: number;
    fringeWidth2: number;
    overlapType: string;
  }) => void;
}

// Convert wavelength (nm) to RGB values (0-1)
function wavelengthToRGBComponents(wavelength: number): { r: number; g: number; b: number } {
  let r = 0, g = 0, b = 0;
  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380);
    g = 0.0;
    b = 1.0;
  } else if (wavelength >= 440 && wavelength < 490) {
    r = 0.0;
    g = (wavelength - 440) / (490 - 440);
    b = 1.0;
  } else if (wavelength >= 490 && wavelength < 510) {
    r = 0.0;
    g = 1.0;
    b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510);
    g = 1.0;
    b = 0.0;
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1.0;
    g = -(wavelength - 645) / (645 - 580);
    b = 0.0;
  } else if (wavelength >= 645 && wavelength <= 780) {
    r = 1.0;
    g = 0.0;
    b = 0.0;
  }

  // Factor to dim light at the edges of the visible spectrum
  let factor = 0.0;
  if (wavelength >= 380 && wavelength < 420) {
    factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
  } else if (wavelength >= 420 && wavelength < 701) {
    factor = 1.0;
  } else if (wavelength >= 701 && wavelength <= 780) {
    factor = 0.3 + 0.7 * (780 - wavelength) / (780 - 701);
  }

  return {
    r: r * factor,
    g: g * factor,
    b: b * factor,
  };
}

export default function LightInterferenceCanvas({
  params,
  setParams,
  onSaveObservation,
}: LightInterferenceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const plotRef = useRef<HTMLCanvasElement>(null);

  // Simulation play/pause state for animating propagation waves
  const [isPlaying, setIsPlaying] = useState(true);
  const [phaseOffset, setPhaseOffset] = useState(0);

  // Animation phase loop
  useEffect(() => {
    if (!isPlaying) return;
    let animationId: number;
    const animate = () => {
      setPhaseOffset((prev) => (prev + 0.15) % (2 * Math.PI));
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying]);

  // Calculations
  const { mode, a, D, lambda1, lambda2, showBeam1, showBeam2 } = params;
  const effectiveShowBeam2 = mode === "double" ? showBeam2 : false;

  // Fringe widths in mm: i = lambda * D / a (with lambda in micrometers to match units)
  // lambda (nm) = lambda * 10^-6 mm
  // D (m) = D * 10^3 mm
  // a (mm)
  // i (mm) = (lambda * 10^-6 * D * 10^3) / a = (lambda * D) / (a * 1000)
  const fringeWidth1 = (lambda1 * D) / (a * 1000);
  const fringeWidth2 = (lambda2 * D) / (a * 1000);

  // Redraw both panels
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dimensions
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // DRAW LAB SCHEMATIC BACKGROUND
    ctx.fillStyle = "#0f172a"; // Dark space
    ctx.fillRect(0, 0, width, height);

    // Position coordinates
    const sourceX = 40;
    const slitsX = 180;
    const screenX = width - 40;
    const centerY = height / 2;

    const slit1Y = centerY - (a * 25); // Scale slit spacing visually
    const slit2Y = centerY + (a * 25);

    // 1. Draw Lasers Source
    if (showBeam1) {
      const c1 = wavelengthToRGBComponents(lambda1);
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = `rgb(${c1.r * 255}, ${c1.g * 255}, ${c1.b * 255})`;
      ctx.strokeStyle = `rgba(${c1.r * 255}, ${c1.g * 255}, ${c1.b * 255}, 0.85)`;
      ctx.lineWidth = 3;
      
      // Laser 1 emitter box
      ctx.fillStyle = "#334155";
      ctx.fillRect(sourceX - 25, centerY - 25, 25, 12);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(sourceX - 8, centerY - 21, 4, 4);

      // Beam 1 path
      ctx.beginPath();
      ctx.moveTo(sourceX, centerY - 19);
      ctx.lineTo(slitsX, slit1Y);
      ctx.lineTo(slitsX, slit2Y);
      ctx.stroke();
      ctx.restore();
    }

    if (effectiveShowBeam2) {
      const c2 = wavelengthToRGBComponents(lambda2);
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = `rgb(${c2.r * 255}, ${c2.g * 255}, ${c2.b * 255})`;
      ctx.strokeStyle = `rgba(${c2.r * 255}, ${c2.g * 255}, ${c2.b * 255}, 0.85)`;
      ctx.lineWidth = 3;

      // Laser 2 emitter box
      ctx.fillStyle = "#334155";
      ctx.fillRect(sourceX - 25, centerY + 13, 25, 12);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(sourceX - 8, centerY + 17, 4, 4);

      // Beam 2 path
      ctx.beginPath();
      ctx.moveTo(sourceX, centerY + 19);
      ctx.lineTo(slitsX, slit1Y);
      ctx.lineTo(slitsX, slit2Y);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Draw Waves Propagation after double slits (diffraction pattern approximation)
    if (showBeam1 || effectiveShowBeam2) {
      ctx.save();
      // Draw wavefront circles
      const numWaves = 6;
      const maxRadius = screenX - slitsX;
      
      for (let i = 1; i <= numWaves; i++) {
        const radius = ((i * (maxRadius / numWaves) + (phaseOffset * 3)) % maxRadius);
        const opacity = (1 - radius / maxRadius) * 0.25;

        if (showBeam1) {
          const c1 = wavelengthToRGBComponents(lambda1);
          ctx.strokeStyle = `rgba(${c1.r * 255}, ${c1.g * 255}, ${c1.b * 255}, ${opacity})`;
          ctx.lineWidth = 1.5;
          // From Slit 1
          ctx.beginPath();
          ctx.arc(slitsX, slit1Y, radius, -Math.PI/3, Math.PI/3);
          ctx.stroke();

          // From Slit 2
          ctx.beginPath();
          ctx.arc(slitsX, slit2Y, radius, -Math.PI/3, Math.PI/3);
          ctx.stroke();
        }

        if (effectiveShowBeam2) {
          const c2 = wavelengthToRGBComponents(lambda2);
          ctx.strokeStyle = `rgba(${c2.r * 255}, ${c2.g * 255}, ${c2.b * 255}, ${opacity})`;
          ctx.lineWidth = 1.5;
          // From Slit 1
          ctx.beginPath();
          ctx.arc(slitsX, slit1Y, radius, -Math.PI/3, Math.PI/3);
          ctx.stroke();

          // From Slit 2
          ctx.beginPath();
          ctx.arc(slitsX, slit2Y, radius, -Math.PI/3, Math.PI/3);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 3. Draw Double Slits Block (Young's Slits barrier)
    ctx.fillStyle = "#475569";
    ctx.fillRect(slitsX - 4, 15, 8, slit1Y - 17); // Top block
    ctx.fillRect(slitsX - 4, slit1Y + 3, 8, (slit2Y - slit1Y) - 6); // Middle block
    ctx.fillRect(slitsX - 4, slit2Y + 3, 8, height - slit2Y - 18); // Bottom block

    // Label slits
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "9px monospace";
    ctx.fillText("S1", slitsX - 18, slit1Y + 3);
    ctx.fillText("S2", slitsX - 18, slit2Y + 3);
    ctx.fillText(`a = ${a.toFixed(1)}mm`, slitsX - 25, centerY - 38);

    // 4. Draw Screen Projector Line
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(screenX, 10, 15, height - 20);
    ctx.strokeStyle = "#475569";
    ctx.strokeRect(screenX, 10, 15, height - 20);

    // Label Screen
    ctx.save();
    ctx.translate(screenX + 24, centerY);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("MÀN QUAN SÁT", 0, 0);
    ctx.restore();

    // Draw dimension indicator D
    ctx.save();
    ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(slitsX, height - 15);
    ctx.lineTo(screenX, height - 15);
    ctx.stroke();
    // arrows
    ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
    ctx.beginPath();
    ctx.moveTo(slitsX, height - 15);
    ctx.lineTo(slitsX + 6, height - 18);
    ctx.lineTo(slitsX + 6, height - 12);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(screenX, height - 15);
    ctx.lineTo(screenX - 6, height - 18);
    ctx.lineTo(screenX - 6, height - 12);
    ctx.fill();
    
    ctx.font = "10px sans-serif";
    ctx.fillText(`D = ${D.toFixed(1)} m`, (slitsX + screenX) / 2 - 20, height - 20);
    ctx.restore();

  }, [params, phaseOffset]);

  // REDRAW INTERFERENCE PROJECTOR AND PLOT
  useEffect(() => {
    const canvas = plotRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Screen slice rendering height: let top 80 pixels be the projection of fringes
    // and bottom 100 pixels be the Intensity Line Plot
    const screenProjHeight = 70;
    const plotCenterY = 145;
    const plotMaxHeight = 50;

    // Draw background for projection screen
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, screenProjHeight);

    // Horizontal scale: let width of canvas map to -6.0 mm to +6.0 mm screen coordinate x
    const screenRangeMm = 12.0; // Total 12 mm visible on screen
    const halfWidth = width / 2;

    const c1 = wavelengthToRGBComponents(lambda1);
    const c2 = wavelengthToRGBComponents(lambda2);

    // Draw Fringe pattern & collect plot points
    const points1: number[] = [];
    const points2: number[] = [];
    const combinedPoints: { r: number; g: number; b: number }[] = [];

    for (let pixelX = 0; pixelX < width; pixelX++) {
      // Coordinate x on screen in mm relative to center (0)
      const xMm = ((pixelX - halfWidth) / halfWidth) * (screenRangeMm / 2);

      // Light Intensity at position x
      // Phase difference delta = 2 * pi * d / lambda = 2 * pi * x * a / (lambda * D)
      // Intensity I = I0 * cos^2(delta / 2) = I0 * cos^2(pi * x * a / (lambda * D))
      // Unit match: x (mm), a (mm), D (m) = D * 10^3 mm, lambda (nm) = lambda * 10^-6 mm
      // delta_half = pi * x * a / (lambda * D)
      // with lambda in micrometers (lambda_nm / 1000) and D in meters:
      // delta_half = pi * x(mm) * a(mm) / ( (lambda_nm / 1e6) * (D * 1000) )
      //            = pi * x * a * 1000 / (lambda_nm * D)
      const val1 = showBeam1
        ? Math.pow(Math.cos((Math.PI * xMm * a * 1000) / (lambda1 * D)), 2)
        : 0;

      const val2 = effectiveShowBeam2
        ? Math.pow(Math.cos((Math.PI * xMm * a * 1000) / (lambda2 * D)), 2)
        : 0;

      points1.push(val1);
      points2.push(val2);

      // Additive color mixing
      const rMix = Math.min((c1.r * val1 + c2.r * val2) * 255, 255);
      const gMix = Math.min((c1.g * val1 + c2.g * val2) * 255, 255);
      const bMix = Math.min((c1.b * val1 + c2.b * val2) * 255, 255);

      combinedPoints.push({ r: rMix, g: gMix, b: bMix });

      // Draw vertical fringe line
      ctx.fillStyle = `rgb(${Math.round(rMix)}, ${Math.round(gMix)}, ${Math.round(bMix)})`;
      ctx.fillRect(pixelX, 0, 1, screenProjHeight);
    }

    // DRAW PLOT GRIDLINES
    ctx.save();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 3]);

    // Plot vertical lines every 1mm
    for (let mm = -5; mm <= 5; mm++) {
      const pX = halfWidth + (mm / (screenRangeMm / 2)) * halfWidth;
      ctx.beginPath();
      ctx.moveTo(pX, screenProjHeight);
      ctx.lineTo(pX, height - 20);
      ctx.stroke();

      // label mm
      ctx.fillStyle = "#64748b";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${mm > 0 ? "+" : ""}${mm}`, pX, height - 8);
    }

    // Plot baseline
    ctx.strokeStyle = "#cbd5e1";
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, plotCenterY);
    ctx.lineTo(width, plotCenterY);
    ctx.stroke();
    ctx.restore();

    // 1. Draw Intensity Curve 1 (if enabled)
    if (showBeam1) {
      ctx.save();
      ctx.strokeStyle = `rgba(${c1.r * 255}, ${c1.g * 255}, ${c1.b * 255}, 0.7)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let px = 0; px < width; px++) {
        const py = plotCenterY - points1[px] * plotMaxHeight;
        if (px === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 2. Draw Intensity Curve 2 (if enabled)
    if (effectiveShowBeam2) {
      ctx.save();
      ctx.strokeStyle = `rgba(${c2.r * 255}, ${c2.g * 255}, ${c2.b * 255}, 0.7)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let px = 0; px < width; px++) {
        const py = plotCenterY - points2[px] * plotMaxHeight;
        if (px === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw OVERLAPPED combined intensity curve
    if (showBeam1 && effectiveShowBeam2) {
      ctx.save();
      ctx.strokeStyle = "#fbbf24"; // Gold color representing overlap summation
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let px = 0; px < width; px++) {
        // Average combined representation
        const py = plotCenterY - ((points1[px] + points2[px]) / 2) * plotMaxHeight;
        if (px === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Screen Center Mark
    ctx.strokeStyle = "rgba(220, 38, 38, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(halfWidth, 0);
    ctx.lineTo(halfWidth, height - 18);
    ctx.stroke();

    // Small center text
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText("Vân trung tâm (x = 0)", halfWidth + 5, screenProjHeight - 10);

  }, [params]);

  // Handle simulation observation logging
  const handleSave = () => {
    let overlapType = "N/A";
    if (showBeam1 && effectiveShowBeam2) {
      const ratio = fringeWidth1 / fringeWidth2;
      overlapType = `Tỷ số khoảng vân i₁/i₂ = ${ratio.toFixed(2)}`;
    } else {
      overlapType = "Giao thoa đơn sắc (1 chùm)";
    }
    onSaveObservation({
      fringeWidth1: showBeam1 ? fringeWidth1 : 0,
      fringeWidth2: effectiveShowBeam2 ? fringeWidth2 : 0,
      overlapType,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Simulation Viewport Panels */}
      <div className="relative bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col">
        {/* Visual Lab Space Header */}
        <div className="bg-slate-950 p-3.5 border-b border-slate-850 flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1.5 font-bold">
            <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
            {mode === "single"
              ? "Mô phỏng Giao Thoa Ánh Sáng Đơn Sắc (Young's Slits Experiment)"
              : "Mô phỏng Giao Thoa 2 Chùm Sáng (Young's Slits Experiment)"}
          </span>
          <span className="text-[10px] bg-slate-900 px-2.5 py-1 rounded text-teal-400 font-mono">
            Vùng quan sát: -6mm đến +6mm
          </span>
        </div>

        {/* Lab Schematic */}
        <div className="w-full flex justify-center bg-slate-950">
          <canvas
            ref={canvasRef}
            width={520}
            height={200}
            className="w-full max-w-[520px] h-[200px] block"
          />
        </div>

        {/* Real-time Fringes Projector & Plot */}
        <div className="bg-slate-100 p-4 border-t border-slate-250">
          <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            Vân giao thoa thực tế & Đồ thị phân bố cường độ sáng I(x)
          </h4>
          <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <canvas
              ref={plotRef}
              width={520}
              height={200}
              className="w-full h-[200px] block"
            />
          </div>
          {/* Label explanations */}
          <div className="mt-2.5 flex flex-wrap gap-4 items-center justify-between text-[10px] text-slate-500 font-medium">
            <div className="flex gap-3">
              {showBeam1 && (
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `rgb(${wavelengthToRGBComponents(lambda1).r*255}, ${wavelengthToRGBComponents(lambda1).g*255}, ${wavelengthToRGBComponents(lambda1).b*255})` }} />
                  {mode === "single" ? "Đường cường độ chùm sáng" : "Đường cường độ chùm 1"}
                </span>
              )}
              {effectiveShowBeam2 && (
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `rgb(${wavelengthToRGBComponents(lambda2).r*255}, ${wavelengthToRGBComponents(lambda2).g*255}, ${wavelengthToRGBComponents(lambda2).b*255})` }} />
                  Đường cường độ chùm 2
                </span>
              )}
              {showBeam1 && effectiveShowBeam2 && (
                <span className="flex items-center gap-1 text-amber-600">
                  <span className="h-0.5 w-3 bg-amber-400" />
                  Đồ thị giao thoa tổng hợp (Cực đại trùng)
                </span>
              )}
            </div>
            <span>Các vạch hiển thị ở trục dưới biểu diễn độ rộng x (milimét).</span>
          </div>
        </div>
      </div>

      {/* Sliders and Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2.5">
            <Sliders className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">Thông Số Giao Thoa</h3>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              id="light-play-pause"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm transition-all cursor-pointer ${
                isPlaying ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isPlaying ? "Tạm dừng Sóng" : "Chạy tiếp Sóng"}
            </button>
            <button
              id="light-save"
              onClick={handleSave}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-750 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Lưu số liệu quang học
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex flex-col sm:flex-row bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1">
          <button
            id="mode-light-single"
            onClick={() => setParams({ ...params, mode: "single" })}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer text-center ${
              mode === "single"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-655 hover:text-slate-900"
            }`}
          >
            <span className="h-3 w-3 rounded-full bg-blue-600 animate-pulse" />
            1. Bắn 1 chùm sáng (Đơn sắc)
          </button>
          <button
            id="mode-light-double"
            onClick={() => setParams({ ...params, mode: "double" })}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer text-center ${
              mode === "double"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-655 hover:text-slate-900"
            }`}
          >
            <div className="flex gap-0.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
            </div>
            2. Bắn 2 chùm sáng (Giao thoa trùng)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-base">
          {/* Laser Slit spacing a & distance D */}
          <div className="space-y-5">
            <h4 className="font-bold text-slate-800 text-sm border-b border-slate-150 pb-2 uppercase tracking-wider">
              Cấu hình hình học thí nghiệm
            </h4>

            {/* Slit spacing a */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="slider-light-a" className="font-bold text-slate-755 text-base">Khoảng cách 2 khe (a)</label>
                <span className="font-mono text-sm text-blue-600 bg-blue-50 px-2.5 py-1 rounded font-black">
                  {a.toFixed(2)} mm
                </span>
              </div>
              <input
                id="slider-light-a"
                type="range"
                min="0.15"
                max="2.00"
                step="0.05"
                value={a}
                onChange={(e) => setParams({ ...params, a: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-450 font-mono">
                <span>0.15 mm (Khe Gần)</span>
                <span>2.00 mm (Khe Xa)</span>
              </div>
            </div>

            {/* Screen Distance D */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="slider-light-D" className="font-bold text-slate-755 text-base">Khoảng cách đến màn (D)</label>
                <span className="font-mono text-sm text-blue-600 bg-blue-50 px-2.5 py-1 rounded font-black">
                  {D.toFixed(1)} m
                </span>
              </div>
              <input
                id="slider-light-D"
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={D}
                onChange={(e) => setParams({ ...params, D: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-450 font-mono">
                <span>0.5 m (Màn Gần)</span>
                <span>3.0 m (Màn Xa)</span>
              </div>
            </div>
          </div>

          {/* Laser beams parameters */}
          <div className="space-y-5">
            <h4 className="font-bold text-slate-800 text-sm border-b border-slate-150 pb-2 uppercase tracking-wider">
              {mode === "single" ? "Tùy chỉnh bước sóng (Đơn sắc)" : "Tùy chỉnh chùm bức xạ (2 bước sóng)"}
            </h4>

            {/* Laser 1 setup */}
            <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 font-bold text-slate-800 text-sm cursor-pointer select-none">
                  {mode === "double" && (
                    <input
                      id="checkbox-beam-1"
                      type="checkbox"
                      checked={showBeam1}
                      onChange={(e) => setParams({ ...params, showBeam1: e.target.checked })}
                      className="rounded text-blue-600 h-5 w-5 focus:ring-blue-500 cursor-pointer"
                    />
                  )}
                  {mode === "single" ? "Chùm sáng giao thoa (Laser)" : "Chùm sáng 1 (Laser 1)"}
                </label>
                {showBeam1 && (
                  <span className="font-mono text-xs text-white px-2.5 py-1 rounded-lg font-black shadow-sm" style={{ backgroundColor: `rgb(${wavelengthToRGBComponents(lambda1).r*200}, ${wavelengthToRGBComponents(lambda1).g*200}, ${wavelengthToRGBComponents(lambda1).b*200})` }}>
                    {lambda1} nm
                  </span>
                )}
              </div>
              
              {showBeam1 && (
                <div className="mt-2 space-y-2">
                  <input
                    id="slider-light-lambda1"
                    type="range"
                    min="380"
                    max="780"
                    step="5"
                    value={lambda1}
                    onChange={(e) => setParams({ ...params, lambda1: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600"
                  />
                  <div className="flex justify-between text-xs text-slate-450 font-mono">
                    <span>380nm (Tím)</span>
                    <span>530nm (Lục)</span>
                    <span>780nm (Đỏ)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Laser 2 setup - only visible in double mode */}
            {mode === "double" && (
              <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800 text-sm select-none">
                    <input
                      id="checkbox-beam-2"
                      type="checkbox"
                      checked={showBeam2}
                      onChange={(e) => setParams({ ...params, showBeam2: e.target.checked })}
                      className="rounded text-blue-600 h-5 w-5 focus:ring-blue-500"
                    />
                    Chùm sáng 2 (Laser 2)
                  </label>
                  {showBeam2 && (
                    <span className="font-mono text-xs text-white px-2.5 py-1 rounded-lg font-black shadow-sm" style={{ backgroundColor: `rgb(${wavelengthToRGBComponents(lambda2).r*200}, ${wavelengthToRGBComponents(lambda2).g*200}, ${wavelengthToRGBComponents(lambda2).b*200})` }}>
                      {lambda2} nm
                    </span>
                  )}
                </div>
                
                {showBeam2 && (
                  <div className="mt-2 space-y-2">
                    <input
                      id="slider-light-lambda2"
                      type="range"
                      min="380"
                      max="780"
                      step="5"
                      value={lambda2}
                      onChange={(e) => setParams({ ...params, lambda2: parseInt(e.target.value) })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600"
                    />
                    <div className="flex justify-between text-xs text-slate-450 font-mono">
                      <span>380nm (Tím)</span>
                      <span>530nm (Lục)</span>
                      <span>780nm (Đỏ)</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
