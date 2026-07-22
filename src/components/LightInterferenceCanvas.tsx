import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Save, Sliders, Info, Sparkles } from "lucide-react";
import { LightInterferenceParams } from "../types";
import { Latex } from "./FormulaBox";

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

// Sinc-squared envelope function representing single-slit diffraction modulating the fringes
function getSincSquared(xMm: number, aMm: number, lambdaNm: number, DNm: number): number {
  // Let slit width b = aMm / 5, with a minimum of 0.04mm to prevent extremely wide envelopes at small 'a'
  const bMm = Math.max(aMm / 5, 0.04);
  
  // beta = pi * b * x / (lambda * D)
  // units: x in mm, b in mm, lambda in nm, D in m
  // beta = pi * xMm * bMm * 1000 / (lambdaNm * DNm)
  const beta = (Math.PI * xMm * bMm * 1000) / (lambdaNm * DNm);
  
  if (Math.abs(beta) < 0.001) return 1.0;
  return Math.pow(Math.sin(beta) / beta, 2);
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
    const sourceX = 45;
    const slitsX = 180;
    const screenX = width - 40;
    const centerY = height / 2;

    const slit1Y = centerY - (a * 25); // Scale slit spacing visually
    const slit2Y = centerY + (a * 25);

    // 1. Draw Single Wave Source & Slit S0 (left side of double slits)
    const c1 = wavelengthToRGBComponents(lambda1);
    const r1 = Math.round(c1.r * 255);
    const g1 = Math.round(c1.g * 255);
    const b1 = Math.round(c1.b * 255);
    const colorStr = `rgb(${r1}, ${g1}, ${b1})`;
    const colorStrAlpha = (alpha: number) => `rgba(${r1}, ${g1}, ${b1}, ${alpha})`;

    // Draw Light Bulb or Laser Illuminator pointing to S0
    ctx.save();
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    ctx.fillRect(8, centerY - 15, 18, 30);
    ctx.strokeRect(8, centerY - 15, 18, 30);
    // Draw nozzle pointing to S0
    ctx.fillStyle = "#334155";
    ctx.fillRect(26, centerY - 5, 4, 10);
    // Glow of the source inside nozzle
    ctx.fillStyle = colorStr;
    ctx.beginPath();
    ctx.arc(24, centerY, 3, 0, 2 * Math.PI);
    ctx.fill();
    
    // Narrow laser beam from the nozzle to S0
    ctx.strokeStyle = colorStrAlpha(0.65);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, centerY);
    ctx.lineTo(sourceX - 3, centerY);
    ctx.stroke();
    ctx.restore();

    // Barrier at sourceX with a single slit S0 in the middle
    ctx.save();
    ctx.fillStyle = "#334155";
    ctx.fillRect(sourceX - 3, 15, 6, centerY - 20); // top half
    ctx.fillRect(sourceX - 3, centerY + 5, 6, height - centerY - 20); // bottom half
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.strokeRect(sourceX - 3, 15, 6, centerY - 20);
    ctx.strokeRect(sourceX - 3, centerY + 5, 6, height - centerY - 20);

    // Glowing slit opening S0
    ctx.fillStyle = colorStr;
    ctx.fillRect(sourceX - 3, centerY - 3, 6, 6);

    // Label for S0
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 12px monospace";
    ctx.fillText("S0", sourceX - 22, centerY + 4);
    ctx.restore();

    // 1.5. Draw Coherent Waves Propagation from S0 to the double slits S1, S2
    ctx.save();
    const numWaves = 12;
    const maxRadius = screenX - slitsX;
    const spacing = maxRadius / numWaves; // match right side wave spacing exactly
    const maxRadiusLeft = slitsX - sourceX; // 180 - 45 = 135
    const numWavesLeft = Math.ceil(maxRadiusLeft / spacing) + 1;

    for (let j = 0; j < numWavesLeft; j++) {
      // Propagation speed & direction matches right side waves
      const radius = ((j * spacing + (phaseOffset * 4)) % maxRadiusLeft);
      const opacity = Math.max(0, (1 - radius / maxRadiusLeft) * 0.45);

      ctx.strokeStyle = colorStrAlpha(opacity);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      // Draw arc going rightwards (from -Math.PI/2.2 to Math.PI/2.2)
      ctx.arc(sourceX, centerY, radius, -Math.PI / 2.2, Math.PI / 2.2);
      ctx.stroke();
    }
    ctx.restore();

    // 2. Draw Waves Propagation after double slits as concentric animated wavefronts
    ctx.save();
    
    for (let i = 1; i <= numWaves; i++) {
      const radius = ((i * spacing + (phaseOffset * 4)) % maxRadius);
      const opacity = Math.max(0, (1 - radius / maxRadius) * 0.35);

      // From Slit 1
      ctx.strokeStyle = colorStrAlpha(opacity);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(slitsX, slit1Y, radius, -Math.PI / 2.5, Math.PI / 2.5);
      ctx.stroke();

      // From Slit 2
      ctx.beginPath();
      ctx.arc(slitsX, slit2Y, radius, -Math.PI / 2.5, Math.PI / 2.5);
      ctx.stroke();
    }
    ctx.restore();

    // Helper to get screen pixel Y for a given interference order k
    const getScreenYForK = (k: number) => {
      const yMm = (k * lambda1 * D) / (a * 1000);
      const maxScreenRangeMm = 8.0;
      return centerY + (yMm / (maxScreenRangeMm / 2)) * (height / 2 - 11);
    };

    // 2.5. Draw Interference rays (paths of Constructive and Destructive interference)
    // These guide lines help students understand how waves overlap to form bright/dark spots on the screen
    ctx.save();
    
    // Constructive paths (Bright fringes) - Solid colored glowing paths
    const kBrightValues = [0, 1, -1, 2, -2];
    kBrightValues.forEach((k) => {
      const endY = getScreenYForK(k);
      if (endY >= 11 && endY <= height - 11) {
        ctx.strokeStyle = colorStrAlpha(0.22);
        ctx.lineWidth = k === 0 ? 2 : 1.2;
        ctx.beginPath();
        ctx.moveTo(slitsX, centerY);
        ctx.lineTo(screenX, endY);
        ctx.stroke();

        // Subtle labels near the screen to indicate fringe orders
        ctx.fillStyle = colorStrAlpha(0.6);
        ctx.font = "8px sans-serif";
        ctx.fillText(`k=${k}`, screenX - 22, endY < centerY ? endY - 4 : endY + 8);
      }
    });

    // Destructive paths (Dark fringes) - Thin dashed grey lines
    const kDarkValues = [0.5, -0.5, 1.5, -1.5];
    kDarkValues.forEach((k) => {
      const endY = getScreenYForK(k);
      if (endY >= 11 && endY <= height - 11) {
        ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(slitsX, centerY);
        ctx.lineTo(screenX, endY);
        ctx.stroke();
      }
    });
    ctx.restore();

    // 3. Draw Double Slits Block (Young's Slits barrier)
    ctx.fillStyle = "#334155";
    ctx.fillRect(slitsX - 4, 15, 8, slit1Y - 17); // Top block
    ctx.fillRect(slitsX - 4, slit1Y + 3, 8, (slit2Y - slit1Y) - 6); // Middle block
    ctx.fillRect(slitsX - 4, slit2Y + 3, 8, height - slit2Y - 18); // Bottom block

    ctx.strokeStyle = "#475569";
    ctx.strokeRect(slitsX - 4, 15, 8, slit1Y - 17);
    ctx.strokeRect(slitsX - 4, slit1Y + 3, 8, (slit2Y - slit1Y) - 6);
    ctx.strokeRect(slitsX - 4, slit2Y + 3, 8, height - slit2Y - 18);

    // Glowing slit openings
    ctx.fillStyle = colorStr;
    ctx.fillRect(slitsX - 4, slit1Y - 1, 8, 3);
    ctx.fillRect(slitsX - 4, slit2Y - 1, 8, 3);

    // Label slits
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 12px monospace";
    ctx.fillText("S1", slitsX - 24, slit1Y + 4);
    ctx.fillText("S2", slitsX - 24, slit2Y + 4);
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(`a = ${a.toFixed(1)}mm`, slitsX - 28, centerY - 38);

    // 4. Draw Screen Projector Line
    ctx.fillStyle = "#000000"; // Deep black background for the projection screen
    ctx.fillRect(screenX, 10, 15, height - 20);
    ctx.strokeStyle = "#475569";
    ctx.strokeRect(screenX, 10, 15, height - 20);

    // Draw the actual vertical projection of fringes on the schematic screen
    const maxScreenRangeMm = 8.0; // standard vertical screen range in mm
    for (let y = 11; y < height - 11; y++) {
      // yMm is the physical position relative to center
      const yMm = ((y - centerY) / (height / 2)) * (maxScreenRangeMm / 2);
      
      // Single-slit envelope modulation (physical correction)
      const env1 = getSincSquared(yMm, a, lambda1, D);
      const val1 = Math.pow(Math.cos((Math.PI * yMm * a * 1000) / (lambda1 * D)), 2) * env1;

      const rMix = Math.min((c1.r * val1) * 255, 255);
      const gMix = Math.min((c1.g * val1) * 255, 255);
      const bMix = Math.min((c1.b * val1) * 255, 255);

      ctx.fillStyle = `rgb(${Math.round(rMix)}, ${Math.round(gMix)}, ${Math.round(bMix)})`;
      ctx.fillRect(screenX + 1, y, 13, 1);
    }

    // Label Screen
    ctx.save();
    ctx.translate(screenX + 24, centerY);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 12px sans-serif";
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
    
    ctx.font = "bold 12px sans-serif";
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

    // Screen slice rendering height: let top 70 pixels be the projection of fringes
    // and bottom 130 pixels be the Intensity Line Plot
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
    const r1 = Math.round(c1.r * 255);
    const g1 = Math.round(c1.g * 255);
    const b1 = Math.round(c1.b * 255);
    const colorStrAlpha = (alpha: number) => `rgba(${r1}, ${g1}, ${b1}, ${alpha})`;

    // Draw Fringe pattern & collect plot points
    const points1: number[] = [];

    for (let pixelX = 0; pixelX < width; pixelX++) {
      // Coordinate x on screen in mm relative to center (0)
      const xMm = ((pixelX - halfWidth) / halfWidth) * (screenRangeMm / 2);

      // Light Intensity at position x with single-slit diffraction envelope
      const env1 = getSincSquared(xMm, a, lambda1, D);
      const val1 = Math.pow(Math.cos((Math.PI * xMm * a * 1000) / (lambda1 * D)), 2) * env1;

      points1.push(val1);

      // Additive color mixing
      const rMix = Math.min((c1.r * val1) * 255, 255);
      const gMix = Math.min((c1.g * val1) * 255, 255);
      const bMix = Math.min((c1.b * val1) * 255, 255);

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
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${mm > 0 ? "+" : ""}${mm}`, pX, height - 8);
    }

    // Plot horizontal intensity levels
    ctx.setLineDash([3, 3]);
    const intensityLevels = [
      { val: 1.0, label: "I = 1.0 (Cực đại)" },
      { val: 0.5, label: "I = 0.5" }
    ];
    for (const item of intensityLevels) {
      const pY = plotCenterY - item.val * plotMaxHeight;
      ctx.beginPath();
      ctx.moveTo(0, pY);
      ctx.lineTo(width, pY);
      ctx.stroke();

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(item.label, 6, pY - 3);
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

    // 1. Draw Intensity Curve & filled area
    ctx.save();
    
    // Draw glowing line
    ctx.strokeStyle = `rgb(${r1}, ${g1}, ${b1})`;
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 4;
    ctx.shadowColor = colorStrAlpha(0.5);
    ctx.beginPath();
    for (let px = 0; px < width; px++) {
      const py = plotCenterY - points1[px] * plotMaxHeight;
      if (px === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    
    // Fill the area under the curve with a gradient
    const areaGrd = ctx.createLinearGradient(0, plotCenterY - plotMaxHeight, 0, plotCenterY);
    areaGrd.addColorStop(0, colorStrAlpha(0.25));
    areaGrd.addColorStop(1, colorStrAlpha(0.0));
    ctx.fillStyle = areaGrd;
    ctx.lineTo(width - 1, plotCenterY);
    ctx.lineTo(0, plotCenterY);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();

    // Screen Center Mark
    ctx.strokeStyle = "rgba(220, 38, 38, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(halfWidth, 0);
    ctx.lineTo(halfWidth, height - 18);
    ctx.stroke();

    // Small center text
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("Vân trung tâm (x = 0)", halfWidth + 8, screenProjHeight - 12);

  }, [params]);

  // Handle simulation observation logging
  const handleSave = () => {
    onSaveObservation({
      fringeWidth1: fringeWidth1,
      fringeWidth2: 0,
      overlapType: "Giao thoa đơn sắc (Khe Young)",
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Simulation Viewport Panels */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col">
        {/* Visual Lab Space Header */}
        <div className="bg-slate-950 p-3.5 border-b border-slate-850 flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1.5 font-bold">
            <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
            Mô phỏng Thí nghiệm Khe Young (Young's Double-Slit Experiment)
          </span>
          <span className="text-[10px] bg-slate-900 px-2.5 py-1 rounded text-teal-400 font-mono">
            Vùng quan sát: -6mm đến +6mm
          </span>
        </div>

        <div className="flex flex-col lg:flex-row bg-slate-950 border-b border-slate-850">
          {/* Real-time Parameters Dashboard - Structured Sidebar layout, NO OVERLAP */}
          <div className="w-full lg:w-[240px] bg-slate-900/40 p-5 border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col justify-center shrink-0 select-none">
            <span className="text-xs uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-3">
              <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
              Bảng số liệu quang học
            </span>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400 font-medium">Khoảng vân i:</span>
                <span className="font-mono text-base font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {fringeWidth1.toFixed(3)} mm
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400 font-medium">Bước sóng λ:</span>
                <span className="font-mono text-base font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {lambda1} nm
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-slate-800/60 pt-2.5">
                <span className="text-slate-400 font-medium">Khoảng cách a:</span>
                <span className="font-mono text-base font-black text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  {a.toFixed(2)} mm
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400 font-medium">Khoảng cách D:</span>
                <span className="font-mono text-base font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {D.toFixed(1)} m
                </span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 leading-normal border-t border-slate-800/40 pt-2.5 mt-3 font-sans">
              * Thay đổi các thanh trượt phía dưới để cập nhật
            </div>
          </div>

          {/* Lab Schematic */}
          <div className="flex-1 flex justify-center bg-slate-950 p-4 items-center">
            <canvas
              ref={canvasRef}
              width={520}
              height={200}
              className="w-full max-w-[520px] h-[200px] block"
            />
          </div>
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
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `rgb(${Math.round(wavelengthToRGBComponents(lambda1).r * 255)}, ${Math.round(wavelengthToRGBComponents(lambda1).g * 255)}, ${Math.round(wavelengthToRGBComponents(lambda1).b * 255)})` }} />
                Đường phân bố cường độ sáng I(x) của nguồn đơn sắc
              </span>
              <span className="flex items-center gap-1.5 text-slate-400 font-mono">
                | Khoảng vân i = {((lambda1 * D) / (a * 1000)).toFixed(2)} mm
              </span>
            </div>
            <span>Các vạch hiển thị ở trục dưới biểu diễn tọa độ x trên màn (milimét).</span>
          </div>
        </div>
      </div>

      {/* Sliders and Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2.5">
            <Sliders className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">Thông Số Giao Thoa Khe Young</h3>
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
                <span className="font-mono text-base text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-lg font-black border border-blue-250 shadow-sm">
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
                <span className="font-mono text-base text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-lg font-black border border-blue-250 shadow-sm">
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
              Tùy chỉnh bước sóng (Ánh sáng Đơn sắc)
            </h4>

            {/* Laser 1 setup */}
            <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-850 text-base">
                  Chùm sáng Laser (Đơn sắc)
                </span>
                <span className="font-mono text-sm text-white px-3.5 py-1.5 rounded-xl font-black shadow-md border border-slate-700/10" style={{ backgroundColor: `rgb(${Math.round(wavelengthToRGBComponents(lambda1).r * 200)}, ${Math.round(wavelengthToRGBComponents(lambda1).g * 200)}, ${Math.round(wavelengthToRGBComponents(lambda1).b * 200)})` }}>
                  {lambda1} nm
                </span>
              </div>
              
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
            </div>

            {/* Note box to keep layout proportional */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-900 leading-relaxed space-y-2">
              <span className="font-bold block text-indigo-950 text-xs sm:text-sm">Công thức vị trí vân sáng & vân tối:</span>
              <div className="bg-white/80 p-3 rounded-lg border border-indigo-100 space-y-2.5">
                <div className="text-center font-bold text-indigo-900 text-xs sm:text-sm py-0.5 overflow-x-auto">
                  <span className="text-indigo-600 font-semibold text-[11px] block mb-1">Vị trí vân sáng (bậc k):</span>
                  <Latex math="x_{\text{sáng}} = k \cdot i = k \frac{\lambda D}{a} \quad (k \in \mathbb{Z})" block />
                </div>
                <div className="text-center font-bold text-indigo-900 text-xs sm:text-sm py-0.5 border-t border-indigo-100/70 pt-2 overflow-x-auto">
                  <span className="text-indigo-600 font-semibold text-[11px] block mb-1">Vị trí vân tối:</span>
                  <Latex math="x_{\text{tối}} = \left(k + \frac{1}{2}\right) i = \left(k + \frac{1}{2}\right) \frac{\lambda D}{a} \quad (k \in \mathbb{Z})" block />
                </div>
              </div>
              <p className="text-slate-500 pt-0.5">
                Thay đổi bước sóng <strong className="text-indigo-850"><Latex math="\lambda" /></strong>, khoảng cách khe <strong className="text-indigo-850"><Latex math="a" /></strong> hoặc khoảng cách màn <strong className="text-indigo-850"><Latex math="D" /></strong> để quan sát sự thay đổi tức thời của khoảng vân <strong className="text-indigo-850"><Latex math="i = \frac{\lambda D}{a}" /></strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Physical Correctness & Explanations Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3.5 shadow-sm text-sm text-blue-900">
        <h4 className="font-bold flex items-center gap-2 text-blue-950 text-base">
          <Info className="h-5 w-5 text-blue-600" />
          Đảm bảo Tính Chính xác Vật lý (Physical Realism Assurance)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700 leading-relaxed">
          <div className="space-y-1.5">
            <span className="font-bold text-blue-900 block">1. Hệ bao nhiễu xạ đơn khe (Single-slit Sinc Envelope):</span>
            <p className="text-xs">
              Mô phỏng áp dụng hàm điều biến <strong>Sinc²</strong> cho mỗi vân sáng. Trong thực tế, do khe hẹp có độ rộng hữu hạn <em>b</em>, cường độ sáng sẽ không đều vô hạn mà giảm dần khi đi xa tâm, tạo nên dải vân tối nhiễu xạ tự nhiên rất chính xác.
            </p>
          </div>
          <div className="space-y-1.5">
            <span className="font-bold text-blue-900 block">2. Bản chất Giao thoa Ánh sáng (Young's Slit Principle):</span>
            <p className="text-xs">
              Mỗi khe hẹp <strong className="text-blue-950">S₁</strong> và <strong className="text-blue-950">S₂</strong> đóng vai trò như một nguồn phát sóng ánh sáng thứ cấp đồng pha. Khi hai sóng này gặp nhau trên màn quan sát, chúng chồng chập và tạo ra các cực đại (vân sáng, tại hiệu đường đi bằng số nguyên lần bước sóng) và cực tiểu (vân tối, tại hiệu đường đi bằng số bán nguyên lần bước sóng).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
