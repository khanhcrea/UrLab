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
  const [sourceDistance, setSourceDistance] = useState(90);
  const [showHyperbolas, setShowHyperbolas] = useState(true);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

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
        
        const axisX = 95; // origin of u-x graph with extra space on the left to prevent clipping
        
        ctx.strokeStyle = "rgba(100, 116, 139, 0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        // Elegant background grid lines for a professional lab feel
        ctx.strokeStyle = "rgba(148, 163, 184, 0.05)";
        ctx.lineWidth = 1;
        for (let gX = 50; gX < width; gX += 50) {
          ctx.beginPath();
          ctx.moveTo(gX, 0);
          ctx.lineTo(gX, height);
          ctx.stroke();
        }
        for (let gY = 30; gY < height; gY += 30) {
          ctx.beginPath();
          ctx.moveTo(0, gY);
          ctx.lineTo(width, gY);
          ctx.stroke();
        }

        // Draw Coordinate Axes if enabled
        if (showCoordinateAxis) {
          ctx.strokeStyle = "rgba(148, 163, 184, 0.65)"; // Slate-400
          ctx.lineWidth = 2;
          
          // 1. Vertical Axis Ou (pointing upwards)
          ctx.beginPath();
          ctx.moveTo(axisX, centerY + A + 25);
          ctx.lineTo(axisX, centerY - A - 25);
          ctx.stroke();

          // Arrow head for Ou
          ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
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
          ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
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
          ctx.fillStyle = "#cbd5e1";
          ctx.font = "bold 12px monospace";
          ctx.textAlign = "right";
          ctx.textBaseline = "middle";
          ctx.lineWidth = 1.5;

          // Origin (0)
          ctx.fillText("x=0", axisX - 10, centerY + 12);

          // Positive peak (+A)
          // Reference horizontal dashed line across the wave width
          ctx.save();
          ctx.strokeStyle = "rgba(74, 222, 128, 0.15)"; // soft emerald green
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(axisX, centerY - A);
          ctx.lineTo(width, centerY - A);
          ctx.stroke();
          ctx.restore();

          // Axis tick line
          ctx.strokeStyle = "rgba(148, 163, 184, 0.85)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(axisX - 7, centerY - A);
          ctx.lineTo(axisX + 7, centerY - A);
          ctx.stroke();
          
          // Render a beautiful pill/badge background for +A text
          ctx.save();
          const badgeW = 75;
          const badgeH = 18;
          const badgeX = axisX - 12 - badgeW;
          const badgeY = centerY - A - badgeH / 2;
          
          ctx.fillStyle = "rgba(15, 23, 42, 0.92)"; // slate-900 high opacity
          ctx.strokeStyle = "rgba(74, 222, 128, 0.4)"; // soft emerald green border
          ctx.lineWidth = 1.5;
          
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
          else ctx.rect(badgeX, badgeY, badgeW, badgeH);
          ctx.fill();
          ctx.stroke();
          
          ctx.fillStyle = "#4ade80"; // bright emerald
          ctx.font = "bold 11px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`+A: ${A}px`, badgeX + badgeW / 2, centerY - A);
          ctx.restore();

          // Negative peak (-A)
          // Reference horizontal dashed line
          ctx.save();
          ctx.strokeStyle = "rgba(248, 113, 113, 0.15)"; // soft red
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(axisX, centerY + A);
          ctx.lineTo(width, centerY + A);
          ctx.stroke();
          ctx.restore();

          // Axis tick line
          ctx.strokeStyle = "rgba(148, 163, 184, 0.85)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(axisX - 7, centerY + A);
          ctx.lineTo(axisX + 7, centerY + A);
          ctx.stroke();
          
          // Render a beautiful pill/badge background for -A text
          ctx.save();
          const badgeYNeg = centerY + A - badgeH / 2;
          
          ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
          ctx.strokeStyle = "rgba(248, 113, 113, 0.4)"; // soft red border
          ctx.lineWidth = 1.5;
          
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(badgeX, badgeYNeg, badgeW, badgeH, 4);
          else ctx.rect(badgeX, badgeYNeg, badgeW, badgeH);
          ctx.fill();
          ctx.stroke();
          
          ctx.fillStyle = "#f87171"; // bright red
          ctx.font = "bold 11px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`-A: -${A}px`, badgeX + badgeW / 2, centerY + A);
          ctx.restore();

          // --- Draw beautiful Amplitude Dimension Line (vẽ mũi tên kích thước biểu diễn biên độ A) ---
          ctx.save();
          const dimX = axisX + 25; // 25px to the right of the vertical axis
          
          // Draw dashed helper horizontal line from axisX to dimX at centerY - A and centerY
          ctx.strokeStyle = "rgba(244, 63, 94, 0.25)"; // soft rose-500
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(axisX, centerY - A);
          ctx.lineTo(dimX, centerY - A);
          ctx.moveTo(axisX, centerY);
          ctx.lineTo(dimX, centerY);
          ctx.stroke();
          ctx.restore();

          // Draw the vertical dimension line with double arrows
          ctx.save();
          ctx.strokeStyle = "#f43f5e"; // bright rose-500
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(dimX, centerY);
          ctx.lineTo(dimX, centerY - A);
          ctx.stroke();

          // Arrow head pointing UP at centerY - A
          ctx.fillStyle = "#f43f5e";
          ctx.beginPath();
          ctx.moveTo(dimX, centerY - A);
          ctx.lineTo(dimX - 4, centerY - A + 8);
          ctx.lineTo(dimX + 4, centerY - A + 8);
          ctx.closePath();
          ctx.fill();

          // Arrow head pointing DOWN at centerY
          ctx.beginPath();
          ctx.moveTo(dimX, centerY);
          ctx.lineTo(dimX - 4, centerY - 8);
          ctx.lineTo(dimX + 4, centerY - 8);
          ctx.closePath();
          ctx.fill();

          // Text label tag in the middle of the vertical dimension line
          const tagW = 56;
          const tagH = 15;
          const tagY = centerY - A / 2;
          
          ctx.fillStyle = "rgba(15, 23, 42, 0.95)"; // solid dark background
          ctx.strokeStyle = "rgba(244, 63, 94, 0.6)"; // rose border
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(dimX - tagW / 2, tagY - tagH / 2, tagW, tagH, 3);
          else ctx.rect(dimX - tagW / 2, tagY - tagH / 2, tagW, tagH);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#fecdd3"; // soft rose-200 text
          ctx.font = "bold 9px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`A = ${A}px`, dimX, tagY);

          ctx.restore();

          // 4. Wavelength ticks on Ox (horizontal)
          ctx.fillStyle = "#cbd5e1";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          
          // Decide step size based on lambda to avoid overlapping labels
          let tickStep = 0.5; // default step in units of lambda (λ/2)
          if (lambda < 55) {
            tickStep = 2.0; // tick every 2λ
          } else if (lambda < 110) {
            tickStep = 1.0; // tick every λ
          }

          for (let i = tickStep; i <= 8; i += tickStep) {
            const tickX = axisX + i * lambda;
            if (tickX < width - 30) {
              ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
              ctx.beginPath();
              ctx.moveTo(tickX, centerY - 4);
              ctx.lineTo(tickX, centerY + 4);
              ctx.stroke();

              let tickLabel = "";
              if (i === 0.5) tickLabel = "λ/2";
              else if (i === 1.0) tickLabel = "λ";
              else if (i === 1.5) tickLabel = "3λ/2";
              else if (i === 2.0) tickLabel = "2λ";
              else if (i === 2.5) tickLabel = "5λ/2";
              else if (i === 3.0) tickLabel = "3λ";
              else if (i === 3.5) tickLabel = "7λ/2";
              else if (i === 4.0) tickLabel = "4λ";
              else if (Math.floor(i) === i) tickLabel = `${i}λ`;
              else tickLabel = `${i.toFixed(1)}λ`;

              ctx.fillStyle = "#cbd5e1";
              ctx.font = "bold 11px sans-serif";
              ctx.fillText(tickLabel, tickX, centerY + 8);
              
              // print value under tick label
              ctx.fillStyle = "#94a3b8";
              ctx.font = "bold 10px monospace";
              const valMeters = ((i * LWaveLength) / 100).toFixed(2);
              ctx.fillText(`${valMeters}m`, tickX, centerY + 21);
            }
          }
        }
        ctx.restore();

        // Draw propagating wave path
        ctx.save();
        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)"; // Soft background glow for the wave line
        ctx.lineWidth = 5;
        ctx.beginPath();
        for (let x = 0; x < width; x += 2) {
          const dampingFactor = Math.exp(-x * (params.damping * 0.003));
          const y = centerY + A * dampingFactor * Math.sin(k * x - offset);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.strokeStyle = "#38bdf8"; // Inner bright celestial cyan core
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();

        // High-contrast, beautifully structured highlighted particles (Red, Orange, Emerald Green)
        // Calculated with dynamic spacing multipliers to NEVER overlap:
        const xRef = axisX + 60; // Reference particle at a fixed start position

        // Find a suitable opposite-phase particle index (0.5, 1.5, 2.5...) that is at least 90px away
        let multNguoc = 0.5;
        while (multNguoc * lambda < 90 && xRef + (multNguoc + 1.0) * lambda < width - 40) {
          multNguoc += 1.0;
        }
        const xNguocPha = xRef + multNguoc * lambda;
        
        // Find a suitable in-phase particle index (1.0, 2.0, 3.0...) that is at least 90px away from both
        let multDong = 1.0;
        while (
          (multDong * lambda < 90 || Math.abs(multDong - multNguoc) * lambda < 90) &&
          xRef + (multDong + 1.0) * lambda < width - 40
        ) {
          multDong += 1.0;
        }
        const xDongPha = xRef + multDong * lambda;

        // Label texts based on actual multipliers
        const getLabelText = (val: number, baseLabel: string) => {
          if (val === 0.5) return `${baseLabel} (λ/2)`;
          if (val === 1.0) return `${baseLabel} (λ)`;
          if (val === 1.5) return `${baseLabel} (3λ/2)`;
          if (val === 2.5) return `${baseLabel} (5λ/2)`;
          if (val === 3.5) return `${baseLabel} (7λ/2)`;
          return `${baseLabel} (${val.toFixed(1)}λ)`;
        };

        const positions = [
          { x: xRef, color: "#f87171", label: "Hạt 1 (Gốc)", size: 8, type: "ref" },
          { x: xNguocPha, color: "#fb923c", label: getLabelText(multNguoc, "Hạt 2 (Ngược pha)"), size: 8, type: "nguoc" },
          { x: xDongPha, color: "#34d399", label: getLabelText(multDong, "Hạt 3 (Đồng pha)"), size: 8, type: "dong" }
        ];

        // 1. Draw ALL normal background particles as a continuous dense beaded chain of the wave
        ctx.save();
        const numParticles = 38;
        for (let i = 0; i < numParticles; i++) {
          const px = axisX + (width - axisX - 30) / (numParticles - 1) * i;
          if (px > width - 15) continue;

          const dampingFactor = Math.exp(-px * (params.damping * 0.003));
          const py = centerY + A * dampingFactor * Math.sin(k * px - offset);
          
          ctx.fillStyle = "rgba(56, 189, 248, 0.55)"; // Translucent Celestial Cyan beads
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.strokeStyle = "rgba(15, 23, 42, 0.4)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();

        // 2. Draw vertical laboratory-style slider rails and VTCB indicators for the highlighted particles
        positions.forEach((pos) => {
          if (pos.x >= width - 15) return;

          const dampingFactor = Math.exp(-pos.x * (params.damping * 0.003));
          const py = centerY + A * dampingFactor * Math.sin(k * pos.x - offset);
          const limitA = A * dampingFactor; // damped amplitude at this X position

          ctx.save();
          
          // Draw the physical slider slot rail
          ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(pos.x, centerY - limitA - 12);
          ctx.lineTo(pos.x, centerY + limitA + 12);
          ctx.stroke();

          // Draw the top and bottom bounding ticks of the track limits
          ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(pos.x - 5, centerY - limitA);
          ctx.lineTo(pos.x + 5, centerY - limitA);
          ctx.moveTo(pos.x - 5, centerY + limitA);
          ctx.lineTo(pos.x + 5, centerY + limitA);
          ctx.stroke();

          // Draw Equilibrium Point (VTCB) indicator on the track
          ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
          ctx.beginPath();
          ctx.arc(pos.x, centerY, 3.5, 0, 2 * Math.PI);
          ctx.fill();

          // VTCB text label for the Reference Particle
          if (pos.type === "ref") {
            ctx.fillStyle = "#94a3b8";
            ctx.font = "bold 9px monospace";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(" VTCB", pos.x + 6, centerY);
          }

          ctx.restore();
        });

        // 3. Draw the highlighted particles on top, with white outline and drop shadow glow
        positions.forEach((pos) => {
          if (pos.x >= width - 15) return;

          const dampingFactor = Math.exp(-pos.x * (params.damping * 0.003));
          const py = centerY + A * dampingFactor * Math.sin(k * pos.x - offset);

          ctx.save();

          // Draw guide projections to the vertical displacement axis (Ou)
          if (showCoordinateAxis) {
            ctx.strokeStyle = pos.color + "3B"; // faint projection line
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(pos.x, py);
            ctx.lineTo(axisX, py);
            ctx.stroke();
          }

          // Draw glowing drop-shadow under the sphere
          ctx.shadowBlur = 8;
          ctx.shadowColor = pos.color;

          // Spherical particle
          ctx.fillStyle = pos.color;
          ctx.beginPath();
          ctx.arc(pos.x, py, pos.size, 0, 2 * Math.PI);
          ctx.fill();

          // Crisp white border
          ctx.shadowBlur = 0; // turn off shadow for border
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.stroke();

          // Text label hovering above
          ctx.fillStyle = pos.color;
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(pos.label, pos.x, py - pos.size - 6);

          ctx.restore();
        });

        ctx.restore();

      } else if (waveType === "longitudinal") {
        // Longitudinal sound/pressure wave represented by horizontal displacement dots
        ctx.save();
        
        // Background grid for longitudinal container
        ctx.strokeStyle = "rgba(148, 163, 184, 0.04)";
        ctx.lineWidth = 1;
        for (let gX = 50; gX < width; gX += 50) {
          ctx.beginPath();
          ctx.moveTo(gX, 30);
          ctx.lineTo(gX, height - 85);
          ctx.stroke();
        }

        // Generate dense longitudinal particles
        const numLines = 75;
        const startY = 30;
        const endY = height - 90;
        
        // Positions to highlight to show horizontal-only vibration
        const highlightedIndices = [22, 42]; // Highlight two specific particles
        const highlightColors = ["#ef4444", "#10b981"]; // Red and Green
        const highlightLabels = ["Hạt A (Chạy ngang)", "Hạt B (Chạy ngang)"];

        for (let i = 0; i < numLines; i++) {
          const originalX = 40 + ((width - 80) / numLines) * i;
          const dampingFactor = Math.exp(-originalX * (params.damping * 0.003));
          
          // horizontal displacement: dx
          const dx = A * 0.85 * dampingFactor * Math.sin(k * originalX - offset);
          const px = originalX + dx;
          
          const isHighlighted = highlightedIndices.indexOf(i);
          
          // Draw standard or highlighted particles in a column
          if (isHighlighted !== -1) {
            const color = highlightColors[isHighlighted];
            const label = highlightLabels[isHighlighted];
            
            // Draw a subtle vertical baseline guide showing equilibrium point
            ctx.save();
            ctx.strokeStyle = color + "44"; // 25% alpha
            ctx.setLineDash([3, 3]);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(originalX, startY - 5);
            ctx.lineTo(originalX, endY + 5);
            ctx.stroke();
            
            // Equilibrium label at the top
            ctx.fillStyle = color;
            ctx.font = "8px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillText("VTCB", originalX, startY - 7);
            ctx.restore();

            for (let y = startY; y < endY; y += 15) {
              ctx.beginPath();
              ctx.fillStyle = color;
              ctx.arc(px, y, 4.5, 0, 2 * Math.PI);
              ctx.fill();
              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 1;
              ctx.stroke();
            }

            // Hovering label for the moving particle
            ctx.fillStyle = color;
            ctx.font = "bold 9px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(label, px, endY + 5);

          } else {
            // Standard wave background particles
            for (let y = startY; y < endY; y += 15) {
              ctx.beginPath();
              ctx.fillStyle = "rgba(56, 189, 248, 0.75)";
              ctx.arc(px, y, 2.5, 0, 2 * Math.PI);
              ctx.fill();
            }
          }
        }
        ctx.restore();

        // Draw Real-time Particle Density & Pressure Strip below the longitudinal wave container
        ctx.save();
        const stripY = height - 55;
        const stripHeight = 32;
        
        // Background container box
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.fillRect(40, stripY, width - 80, stripHeight);
        
        // Density pixels heatmap
        const stepSize = 4;
        for (let x = 40; x < width - 40; x += stepSize) {
          const dampingFactor = Math.exp(-x * (params.damping * 0.003));
          // Relative density pressure is opposite of displacement derivative: -cos(k*x - offset)
          const p = -dampingFactor * Math.cos(k * x - offset);
          
          // Map pressure to beautiful colors
          // Compression (high pressure, p > 0): glowing green/cyan
          // Rarefaction (low pressure, p < 0): dark purple/indigo
          let r = 15, g = 23, b = 42;
          if (p > 0) {
            r = Math.floor(15 + p * (16 - 15));
            g = Math.floor(23 + p * (185 - 23));
            b = Math.floor(42 + p * (129 - 42)); // cyan/emerald hue
          } else {
            const absP = -p;
            r = Math.floor(15 + absP * (79 - 15));
            g = Math.floor(23 + absP * (70 - 23));
            b = Math.floor(42 + absP * (229 - 42)); // purple hue
          }
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(x, stripY, stepSize, stripHeight);
        }
        
        // Draw thin container outline
        ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(40, stripY, width - 80, stripHeight);
        
        // Draw overlaid Sine wave graph of Density Deviation
        ctx.strokeStyle = "#10b981"; // Emerald-500
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        let first = true;
        for (let x = 40; x < width - 40; x += 2) {
          const dampingFactor = Math.exp(-x * (params.damping * 0.003));
          const p = -dampingFactor * Math.cos(k * x - offset);
          const py = stripY + stripHeight / 2 - p * (stripHeight / 2.3);
          if (first) {
            ctx.moveTo(x, py);
            first = false;
          } else {
            ctx.lineTo(x, py);
          }
        }
        ctx.stroke();
        
        // Graph text headers
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText("Mật độ & Áp suất môi trường (p)", 40, stripY - 8);
        
        ctx.textAlign = "right";
        ctx.font = "9px monospace";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("Lục (Nén cực đại) | Tím (Giãn cực tiểu)", width - 40, stripY - 8);
        ctx.restore();

        // Horizontal coordinate ruler for reference
        if (showCoordinateAxis) {
          ctx.save();
          const axisY = stripY + stripHeight + 12;
          ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(40, axisY);
          ctx.lineTo(width - 40, axisY);
          ctx.stroke();

          // Ruler tick marks
          ctx.font = "bold 9px monospace";
          ctx.fillStyle = "#cbd5e1";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          for (let tickX = 40; tickX <= width - 40; tickX += 60) {
            ctx.beginPath();
            ctx.moveTo(tickX, axisY - 3);
            ctx.lineTo(tickX, axisY + 3);
            ctx.stroke();
            const valMeters = ((tickX - 40) / 100).toFixed(2);
            ctx.fillText(`${valMeters}m`, tickX, axisY + 5);
          }
          ctx.restore();
        }

      } else if (waveType === "interference") {
        // High-fidelity physical interference wave field (2D color-mapped ripples)
        if (!offscreenRef.current) {
          offscreenRef.current = document.createElement("canvas");
          offscreenRef.current.width = 160;
          offscreenRef.current.height = 90;
        }
        const offscreen = offscreenRef.current;
        const oCtx = offscreen.getContext("2d");
        
        const centerX = width / 2;
        const centerY = height / 2;
        const s1x = centerX;
        const s1y = centerY - sourceDistance / 2;
        const s2x = centerX;
        const s2y = centerY + sourceDistance / 2;

        if (oCtx) {
          const imgData = oCtx.createImageData(160, 90);
          const data = imgData.data;
          
          const scaleX = width / 160;
          const scaleY = height / 90;
          
          for (let Y = 0; Y < 90; Y++) {
            const cy = Y * scaleY;
            for (let X = 0; X < 160; X++) {
              const cx = X * scaleX;
              
              const d1 = Math.sqrt((cx - s1x) ** 2 + (cy - s1y) ** 2);
              const d2 = Math.sqrt((cx - s2x) ** 2 + (cy - s2y) ** 2);
              
              // Wave amplitudes with exponential damping
              const amp1 = A * Math.exp(-d1 * (params.damping * 0.0018));
              const amp2 = A * Math.exp(-d2 * (params.damping * 0.0018));
              
              // Coherent source waves: in-phase, same frequency
              const u1 = amp1 * Math.sin(k * d1 - offset);
              const u2 = amp2 * Math.sin(k * d2 - offset);
              const u = u1 + u2; // Ranges roughly in [-2*A, 2*A]
              
              // Normalize to [-1, 1]
              const val = A > 0 ? u / (2 * A) : 0;
              const pixelIdx = (Y * 160 + X) * 4;
              
              // Custom sci-fi high-contrast bipolar color palette
              let r = 15, g = 23, b = 42; // Slate-900 baseline
              if (val > 0) {
                // Wave crests: interpolate to glowing celestial cyan (14, 165, 233)
                const vScaled = Math.min(val * 1.6, 1.0);
                r = Math.floor(15 + vScaled * (14 - 15));
                g = Math.floor(23 + vScaled * (165 - 23));
                b = Math.floor(42 + vScaled * (233 - 42));
              } else {
                // Wave troughs: interpolate to deep royal violet-purple (99, 102, 241)
                const vScaled = Math.min(-val * 1.6, 1.0);
                r = Math.floor(15 + vScaled * (99 - 15));
                g = Math.floor(23 + vScaled * (102 - 23));
                b = Math.floor(42 + vScaled * (241 - 42));
              }
              
              data[pixelIdx] = r;
              data[pixelIdx + 1] = g;
              data[pixelIdx + 2] = b;
              data[pixelIdx + 3] = 255;
            }
          }
          oCtx.putImageData(imgData, 0, 0);
          
          ctx.save();
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(offscreen, 0, 0, width, height);
          ctx.restore();
        }

        // Draw exact hyperbola curves on top of the field
        const drawHyperbolaCurve = (pathDiff: number, isMaximum: boolean) => {
          const c = sourceDistance / 2;
          const a = Math.abs(pathDiff) / 2;
          if (a >= c) return; // branches do not exist if path differences exceeds source distance
          
          if (a === 0 || pathDiff === 0) {
            // Central maximum is a straight vertical line through the center
            ctx.beginPath();
            ctx.moveTo(0, centerY);
            ctx.lineTo(width, centerY);
            ctx.stroke();
            return;
          }
          
          const b = Math.sqrt(c * c - a * a);
          
          // Determine boundaries of drawing depending on the sign of pathDiff
          // pathDiff = d1 - d2
          // If pathDiff > 0: d1 > d2 => closer to S2 => lower half (y > centerY)
          // If pathDiff < 0: d1 < d2 => closer to S1 => upper half (y < centerY)
          const startY = pathDiff > 0 ? centerY + a : 0;
          const endY = pathDiff > 0 ? height : centerY - a;
          
          // Left wing
          ctx.beginPath();
          let first = true;
          for (let y = startY; y <= endY; y += 2) {
            const term = ((y - centerY) / a) ** 2 - 1;
            if (term < 0) continue;
            const x = centerX - b * Math.sqrt(term);
            if (x < 0 || x > width) continue;
            if (first) {
              ctx.moveTo(x, y);
              first = false;
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();

          // Right wing
          ctx.beginPath();
          first = true;
          for (let y = startY; y <= endY; y += 2) {
            const term = ((y - centerY) / a) ** 2 - 1;
            if (term < 0) continue;
            const x = centerX + b * Math.sqrt(term);
            if (x < 0 || x > width) continue;
            if (first) {
              ctx.moveTo(x, y);
              first = false;
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        };

        if (showHyperbolas) {
          ctx.save();
          // Draw constructive curves (cực đại - solid green)
          const maxN = Math.floor(sourceDistance / lambda);
          for (let n = -maxN; n <= maxN; n++) {
            const pathDiff = n * lambda;
            ctx.strokeStyle = n === 0 ? "rgba(34, 197, 94, 0.95)" : "rgba(34, 197, 94, 0.55)";
            ctx.lineWidth = n === 0 ? 3 : 1.5;
            ctx.setLineDash([]);
            drawHyperbolaCurve(pathDiff, true);
          }
          
          // Draw destructive curves (cực tiểu - dashed red)
          const maxMinN = Math.floor(sourceDistance / lambda - 0.5);
          for (let n = -maxMinN - 1; n <= maxMinN; n++) {
            const pathDiff = (n + 0.5) * lambda;
            ctx.strokeStyle = "rgba(244, 63, 94, 0.65)"; // Rose red
            ctx.lineWidth = 1.2;
            ctx.setLineDash([4, 4]);
            drawHyperbolaCurve(pathDiff, false);
          }
          ctx.restore();
        }

        // Draw sources as glowing circles with white borders
        ctx.save();
        ctx.shadowBlur = 10;
        
        ctx.shadowColor = "#38bdf8";
        ctx.fillStyle = "#0284c7";
        ctx.beginPath();
        ctx.arc(s1x, s1y, 7.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText("S₁ (Nguồn 1) ", s1x - 12, s1y);

        ctx.beginPath();
        ctx.arc(s2x, s2y, 7.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillText("S₂ (Nguồn 2) ", s2x - 12, s2y);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(drawWave);
    };

    animationFrameId = requestAnimationFrame(drawWave);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [params, waveType, isPlaying, showCoordinateAxis, sourceDistance, showHyperbolas]);

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
                <span className="text-slate-400 font-medium">Biên độ (A):</span>
                <span className="font-mono text-base font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  {params.amplitude} px ({(params.amplitude / 100).toFixed(2)}m)
                </span>
              </div>
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
              width={640}
              height={360}
              className="w-full max-w-[640px] h-[360px] block"
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

          {/* Interference Source Distance (d) */}
          {waveType === "interference" && (
            <div className="space-y-1.5 col-span-1 sm:col-span-2 bg-blue-50/40 p-4 rounded-xl border border-blue-100/70">
              <div className="flex justify-between items-center">
                <label htmlFor="slider-wave-src-dist" className="font-bold text-blue-900 text-base flex items-center gap-1.5">
                  Khoảng cách giữa hai nguồn d (S₁S₂)
                  <span className="text-blue-400 cursor-help" title="Điều chỉnh khoảng cách giữa 2 nguồn S1 và S2">
                    <Info className="h-4 w-4" />
                  </span>
                </label>
                <span className="font-mono text-base text-blue-700 bg-blue-100/80 px-3.5 py-1.5 rounded-lg font-black border border-blue-250 shadow-sm">
                  {sourceDistance} px
                </span>
              </div>
              <input
                id="slider-wave-src-dist"
                type="range"
                min="40"
                max="200"
                step="2"
                value={sourceDistance}
                onChange={(e) => setSourceDistance(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-blue-650 font-mono">
                <span>40px (Gần nhau)</span>
                <span>200px (Xa nhau)</span>
              </div>
            </div>
          )}

          {/* Visualization Toggles */}
          <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row sm:items-center gap-6 pt-4 text-sm border-t border-slate-100">
            {waveType !== "interference" && (
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
            )}

            {waveType === "interference" && (
              <label className="flex items-center gap-2.5 cursor-pointer text-slate-750 select-none">
                <input
                  id="wave-toggle-hyperbolas"
                  type="checkbox"
                  checked={showHyperbolas}
                  onChange={(e) => setShowHyperbolas(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-5 w-5"
                />
                <span className="font-bold text-slate-850 text-emerald-800">Hiện Vân Giao Thoa (Cực đại: liền lục, Cực tiểu: đứt hồng)</span>
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
