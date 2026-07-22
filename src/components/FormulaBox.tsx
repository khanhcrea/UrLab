import React, { useEffect, useRef } from "react";
import { BookOpen, HelpCircle, Sigma, Sparkles } from "lucide-react";
import { PendulumParams, WaveParams, SpringParams, LightInterferenceParams } from "../types";
import katex from "katex";
import "katex/dist/katex.min.css";

// Reusable high-fidelity LaTeX renderer component using KaTeX
export function Latex({ math, block = false }: { math: string; block?: boolean }) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(math, containerRef.current, {
          displayMode: block,
          throwOnError: false,
          trust: true,
        });
      } catch (err) {
        console.error("KaTeX rendering error:", err);
      }
    }
  }, [math, block]);

  return (
    <span
      ref={containerRef}
      className={block ? "block my-2 overflow-x-auto overflow-y-hidden py-1.5 text-center text-slate-800" : "inline px-0.5 align-baseline"}
    />
  );
}

interface FormulaBoxProps {
  experimentId: "pendulum" | "wave" | "spring" | "light";
  pendulumParams: PendulumParams;
  waveParams: WaveParams;
  springParams?: SpringParams;
  lightParams?: LightInterferenceParams;
}

export default function FormulaBox({
  experimentId,
  pendulumParams,
  waveParams,
  springParams,
  lightParams,
}: FormulaBoxProps) {
  // Calculations for Pendulum
  const pL = pendulumParams.length;
  const pg = pendulumParams.gravity;
  const pm = pendulumParams.mass;
  const pTheta0Deg = pendulumParams.initialAngle;
  const pThetaRad = (pTheta0Deg * Math.PI) / 180;

  const pendulumPeriod = pg > 0 ? 2 * Math.PI * Math.sqrt(pL / pg) : 0;
  const pendulumFrequency = pendulumPeriod > 0 ? 1 / pendulumPeriod : 0;
  const maxPotentialEnergy = pm * pg * pL * (1 - Math.cos(pThetaRad));
  const pendulumOmega = pendulumPeriod > 0 ? (2 * Math.PI / pendulumPeriod) : 0;
  const pendulumVmax = pg > 0 ? Math.sqrt(2 * pg * pL * (1 - Math.cos(pThetaRad))) : 0;
  const pendulumTmax = pm * pg * (3 - 2 * Math.cos(pThetaRad));
  const pendulumTmin = pm * pg * Math.cos(pThetaRad);
  const pendulumS0 = pL * Math.abs(pThetaRad);

  // Calculations for Wave
  const wA = waveParams.amplitude;
  const wf = waveParams.frequency;
  const wv = waveParams.speed;

  const wavelength = wf > 0 ? wv / wf : 0;
  const angularFreq = 2 * Math.PI * wf;
  const wavePeriod = wf > 0 ? 1 / wf : 0;
  const waveNumber = wavelength > 0 ? (2 * Math.PI / (wavelength / 100)) : 0; // wave number k in rad/m

  // Calculations for Spring-Mass
  const sK = springParams?.k ?? 40;
  const sM = springParams?.mass ?? 1.0;
  const sX0 = (springParams?.initialX ?? 6) / 100; // in meters
  const springPeriod = sK > 0 ? 2 * Math.PI * Math.sqrt(sM / sK) : 0;
  const springFreq = springPeriod > 0 ? 1 / springPeriod : 0;
  const springAngularFreq = sM > 0 ? Math.sqrt(sK / sM) : 0;
  const totalMechEnergy = 0.5 * sK * sX0 * sX0;
  const springDeltaL0 = sK > 0 ? (sM * 9.8) / sK : 0; // in meters
  const springVmax = springAngularFreq * sX0;
  const springAmax = springAngularFreq * springAngularFreq * sX0;
  const springFkvMax = sK * sX0;

  // Calculations for Light Interference
  const lMode = lightParams?.mode ?? "single";
  const lA = lightParams?.a ?? 1.0;
  const lD = lightParams?.D ?? 2.0;
  const lL1 = lightParams?.lambda1 ?? 650;
  const lL2 = lightParams?.lambda2 ?? 532;
  const lShow1 = lightParams?.showBeam1 ?? true;
  const lShow2 = lightParams?.showBeam2 ?? true;

  const iWidth1 = (lL1 * lD) / (lA * 1000);
  const iWidth2 = (lL2 * lD) / (lA * 1000);

  // Coincidence calculations
  let bestK1 = 1;
  let bestK2 = 1;
  let minDiff = Math.abs(lL1 - lL2);
  for (let k1 = 1; k1 <= 20; k1++) {
    for (let k2 = 1; k2 <= 20; k2++) {
      const diff = Math.abs(k1 * lL1 - k2 * lL2);
      if (diff < minDiff) {
        minDiff = diff;
        bestK1 = k1;
        bestK2 = k2;
      }
    }
  }
  const hasCoincidence = minDiff < 6 && lMode === "double" && lShow1 && lShow2;
  const iCoincidence = bestK1 * iWidth1; // in mm

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
        <Sigma className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-bold text-slate-900">Bảng Công Thức Vật Lý Chuẩn SGK</h3>
      </div>

      {experimentId === "pendulum" ? (
        <div className="space-y-5">
          {/* Main Formula display Card */}
          <div className="bg-gradient-to-br from-blue-50/40 to-slate-50 border border-slate-150 rounded-2xl p-5 text-center flex flex-col items-center shadow-inner">
            <span className="text-xs text-blue-650 uppercase tracking-widest font-extrabold block mb-2.5">
              Chu kỳ dao động của con lắc đơn (Bài 5 & Bài 7)
            </span>
            <div className="inline-flex items-center bg-white px-8 py-4 rounded-2xl border border-slate-150 shadow-sm select-none transition-all hover:shadow-md text-3xl sm:text-4xl md:text-5xl font-serif">
              <Latex math="T = 2\pi\sqrt{\frac{\ell}{g}}" />
            </div>
            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              Trong đó: <Latex math="\ell" /> là chiều dài dây treo (m),{" "}
              <Latex math="g" /> là gia tốc trọng trường (m/s²).
            </p>
          </div>

          {/* Dynamic computed parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50/70 border border-slate-200/60 p-3 rounded-xl">
              <span className="text-slate-500 font-semibold block mb-0.5">Chu kỳ (<Latex math="T" />)</span>
              <span id="formula-pendulum-period" className="text-base font-bold font-mono text-blue-700 block">
                {pendulumPeriod > 0 ? `${pendulumPeriod.toFixed(3)} s` : "Vô cực (g = 0)"}
              </span>
            </div>
            <div className="bg-slate-50/70 border border-slate-200/60 p-3 rounded-xl">
              <span className="text-slate-500 font-semibold block mb-0.5">Tần số (<Latex math="f" />)</span>
              <span id="formula-pendulum-freq" className="text-base font-bold font-mono text-teal-650 block">
                {pendulumFrequency > 0 ? `${pendulumFrequency.toFixed(3)} Hz` : "0 Hz"}
              </span>
            </div>
            <div className="bg-slate-50/70 border border-slate-200/60 p-3 rounded-xl">
              <span className="text-slate-500 font-semibold block mb-0.5">Tần số góc (<Latex math="\omega" />)</span>
              <span className="text-base font-bold font-mono text-purple-650 block">
                {pendulumOmega > 0 ? `${pendulumOmega.toFixed(3)} rad/s` : "0 rad/s"}
              </span>
            </div>
            <div className="bg-slate-50/70 border border-slate-200/60 p-3 rounded-xl">
              <span className="text-slate-500 font-semibold block mb-0.5">Biên độ cong (<Latex math="s_0" />)</span>
              <span className="text-base font-bold font-mono text-amber-650 block">
                {pendulumS0.toFixed(4)} m
              </span>
            </div>
            <div className="bg-slate-50/70 border border-slate-200/60 p-3 rounded-xl">
              <span className="text-slate-500 font-semibold block mb-0.5">Vận tốc cực đại (<Latex math="v_{\text{max}}" />)</span>
              <span className="text-base font-bold font-mono text-emerald-600 block">
                {pendulumVmax.toFixed(3)} m/s
              </span>
            </div>
            <div className="bg-slate-50/70 border border-slate-200/60 p-3 rounded-xl">
              <span className="text-slate-500 font-semibold block mb-0.5">Cơ năng (<Latex math="W" />)</span>
              <span className="text-base font-bold font-mono text-indigo-650 block">
                {maxPotentialEnergy.toFixed(4)} J
              </span>
            </div>
            <div className="bg-slate-50/70 border border-slate-200/60 p-3 rounded-xl col-span-2">
              <span className="text-slate-500 font-semibold block mb-0.5">
                Lực căng dây cực đại / cực tiểu (<Latex math="T_{\text{max}}" /> / <Latex math="T_{\text{min}}" />)
              </span>
              <span className="text-sm font-bold font-mono text-rose-600 block">
                {pendulumTmax.toFixed(3)} N / {pendulumTmin.toFixed(3)} N
              </span>
            </div>
          </div>

          {/* SGK Chapter Details Accordion Form */}
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-4">
            <span className="font-extrabold flex items-center gap-1.5 text-slate-850 text-xs sm:text-sm uppercase tracking-wider">
              <BookOpen className="h-4 w-4 text-blue-600" /> Hệ thống công thức SGK đầy đủ:
            </span>

            <div className="space-y-3.5">
              {/* Kinetic & Kinematic */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3">
                <span className="text-sm font-bold text-blue-850 block">1. Động học (Phương trình dao động lệch nhỏ <Latex math="\alpha_0 \le 10^\circ" />)</span>
                <div className="text-slate-700 text-sm leading-relaxed space-y-2">
                  <p>• <strong>Li độ cong:</strong> <Latex math="s = s_0 \cos(\omega t + \varphi)" /></p>
                  <p>• <strong>Li độ góc:</strong> <Latex math="\alpha = \alpha_0 \cos(\omega t + \varphi)" /></p>
                  <p>• <strong>Mối liên hệ li độ:</strong> <Latex math="s = \ell\alpha" /> và <Latex math="s_0 = \ell\alpha_0" /> (với <Latex math="\alpha" /> tính bằng <span className="italic font-serif">rad</span>)</p>
                  <p className="mt-2">• <strong>Hệ thức độc lập thời gian:</strong></p>
                  <div className="py-2.5 my-2 flex justify-center items-center bg-blue-50/30 border border-blue-100 rounded-xl text-lg sm:text-xl font-bold text-slate-900 shadow-sm px-4 overflow-x-auto">
                    <Latex math="s_0^2 = s^2 + \frac{v^2}{\omega^2} \quad \text{hoặc} \quad \alpha_0^2 = \alpha^2 + \frac{v^2}{g\ell}" block />
                  </div>
                </div>
              </div>

              {/* Forces and Dynamics */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3">
                <span className="text-sm font-bold text-purple-850 block">2. Động lực học (Lực kéo về & Lực căng dây)</span>
                <div className="text-slate-700 text-sm leading-relaxed space-y-2">
                  <p>• <strong>Lực kéo về (Lực hồi phục):</strong> Đưa vật về vị trí cân bằng:</p>
                  <div className="py-2.5 my-2 flex justify-center items-center bg-purple-50/30 border border-purple-100 rounded-xl text-lg sm:text-xl font-bold text-slate-900 shadow-sm px-4 overflow-x-auto">
                    <Latex math="\vec{F}_{\text{kv}} = -mg\sin\alpha \approx -mg\alpha = -\frac{mg}{\ell}s" block />
                  </div>
                </div>
                <div className="text-slate-700 text-sm leading-relaxed space-y-2">
                  <p>• <strong>Lực căng dây treo (<Latex math="T_{\text{c}}" />):</strong> Giữ vật trên quỹ đạo cong:</p>
                  <div className="py-2.5 my-2 flex justify-center items-center bg-purple-50/30 border border-purple-100 rounded-xl text-lg sm:text-xl font-bold text-slate-900 shadow-sm px-4 overflow-x-auto">
                    <Latex math="T_{\text{c}} = mg(3\cos\alpha - 2\cos\alpha_0)" block />
                  </div>
                </div>
              </div>

              {/* Energy */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3">
                <span className="text-sm font-bold text-emerald-850 block">3. Năng lượng & Bảo toàn cơ năng (Bài 7)</span>
                <p className="text-slate-700 text-sm leading-relaxed">
                  • Động năng <Latex math="W_{\text{đ}}" /> và thế năng <Latex math="W_{\text{t}}" /> biến đổi tuần hoàn với tần số <Latex math="2f" />.
                </p>
                <div className="text-slate-700 text-sm leading-relaxed space-y-2">
                  <p>• <strong>Công thức tổng quát cho mọi góc lệch:</strong></p>
                  <div className="py-3 my-2 bg-emerald-50/30 border border-emerald-100 rounded-xl text-lg sm:text-xl font-bold text-slate-900 shadow-sm px-4 overflow-x-auto space-y-3 flex flex-col items-center justify-center">
                    <Latex math="W_{\text{đ}} = \frac{1}{2}mv^2" block />
                    <Latex math="W_{\text{t}} = mg\ell(1 - \cos\alpha)" block />
                    <Latex math="W = W_{\text{đ}} + W_{\text{t}} = mg\ell(1 - \cos\alpha_0) = \text{hằng số}" block />
                  </div>
                </div>
                <div className="text-slate-700 text-sm leading-relaxed space-y-2">
                  <p className="mt-2">• <strong>Khi góc lệch nhỏ (<Latex math="\alpha_0 \le 10^\circ" />):</strong></p>
                  <div className="py-3 my-2 bg-emerald-50/30 border border-emerald-100 rounded-xl text-lg sm:text-xl font-bold text-slate-900 shadow-sm px-4 overflow-x-auto space-y-3 flex flex-col items-center justify-center">
                    <Latex math="W_{\text{t}} \approx \frac{1}{2}mg\ell\alpha^2" block />
                    <Latex math="W \approx \frac{1}{2}mg\ell\alpha_0^2 = \frac{1}{2}m\omega^2 s_0^2" block />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100/70 rounded-xl p-3 text-xs text-blue-800 space-y-2">
              <span className="font-bold flex items-center gap-1 text-blue-900">
                <HelpCircle className="h-3.5 w-3.5" /> Gợi ý thực hành quan sát:
              </span>
              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                <li>Hãy tăng thử <strong>Chiều dài dây treo (<Latex math="\ell" />)</strong> lên gấp 4 lần. Chu kỳ <Latex math="T" /> sẽ tăng lên đúng 2 lần (do tỷ lệ thuận với <Latex math="\sqrt{\ell}" />)!</li>
                <li>Giảm <strong>Trọng lực <Latex math="g" /></strong> làm lực hồi phục yếu đi, khiến chu kỳ <Latex math="T" /> kéo dài ra!</li>
              </ul>
            </div>
          </div>
        </div>
      ) : experimentId === "spring" ? (
        <div className="space-y-5">
          {/* Main Formula display Card for Spring */}
          <div className="bg-gradient-to-br from-indigo-50/40 to-slate-50 border border-slate-150 rounded-2xl p-5 text-center flex flex-col items-center shadow-inner">
            <span className="text-xs text-indigo-650 uppercase tracking-widest font-extrabold block mb-2.5">
              Chu kỳ riêng con lắc lò xo (Bài 5)
            </span>
            <div className="inline-flex items-center bg-white px-8 py-4 rounded-2xl border border-slate-150 shadow-sm select-none transition-all hover:shadow-md text-3xl sm:text-4xl md:text-5xl font-serif">
              <Latex math="T = 2\pi\sqrt{\frac{m}{k}}" />
            </div>
            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              Trong đó: <Latex math="m" /> là khối lượng vật nhỏ (kg),{" "}
              <Latex math="k" /> là độ cứng lò xo (N/m).
            </p>
          </div>

          {/* Dynamic computed parameters for Spring */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50/70 border border-slate-200/60 p-3 rounded-xl">
              <span className="text-slate-500 font-semibold block mb-0.5">Chu kỳ (<Latex math="T" />)</span>
              <span id="formula-spring-period" className="text-base font-bold font-mono text-blue-700 block">
                {springPeriod > 0 ? `${springPeriod.toFixed(3)} s` : "Vô cực"}
              </span>
            </div>
            <div className="bg-slate-50/70 border border-slate-200/60 p-3 rounded-xl">
              <span className="text-slate-500 font-semibold block mb-0.5">Tần số riêng (<Latex math="f" />)</span>
              <span id="formula-spring-freq" className="text-base font-bold font-mono text-teal-650 block">
                {springFreq > 0 ? `${springFreq.toFixed(3)} Hz` : "0 Hz"}
              </span>
            </div>
            <div className="bg-slate-50/70 border border-slate-200/60 p-3 rounded-xl">
              <span className="text-slate-500 font-semibold block mb-0.5">Tần số góc (<Latex math="\omega" />)</span>
              <span className="text-base font-bold font-mono text-purple-650 block">
                {springAngularFreq.toFixed(3)} rad/s
              </span>
            </div>
            <div className="bg-slate-50/70 border border-slate-200/60 p-3 rounded-xl">
              <span className="text-slate-500 font-semibold block mb-0.5">Độ dãn VTCB (<Latex math="\Delta\ell_0" />)</span>
              <span className="text-base font-bold font-mono text-amber-650 block">
                {(springDeltaL0 * 100).toFixed(2)} cm
              </span>
            </div>
            <div className="bg-slate-50/70 border border-slate-200/60 p-3 rounded-xl">
              <span className="text-slate-500 font-semibold block mb-0.5">Vận tốc cực đại (<Latex math="v_{\text{max}}" />)</span>
              <span className="text-base font-bold font-mono text-emerald-600 block">
                {springVmax.toFixed(3)} m/s
              </span>
            </div>
            <div className="bg-slate-50/70 border border-slate-200/60 p-3 rounded-xl">
              <span className="text-slate-500 font-semibold block mb-0.5">Cơ năng (<Latex math="W" />)</span>
              <span className="text-base font-bold font-mono text-indigo-650 block">
                {totalMechEnergy.toFixed(4)} J
              </span>
            </div>
            <div className="bg-slate-50/70 border border-slate-200/60 p-3 rounded-xl col-span-2">
              <span className="text-slate-500 font-semibold block mb-0.5">
                Lực kéo về max / Gia tốc cực đại (<Latex math="F_{\text{kv\_max}}" /> / <Latex math="a_{\text{max}}" />)
              </span>
              <span className="text-xs font-bold font-mono text-rose-600 block">
                {springFkvMax.toFixed(3)} N / {springAmax.toFixed(3)} m/s²
              </span>
            </div>
          </div>

          {/* Spring Theory details */}
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-4">
            <span className="font-extrabold flex items-center gap-1.5 text-slate-800 text-xs sm:text-sm uppercase tracking-wider">
              <BookOpen className="h-4 w-4 text-indigo-650" /> Hệ thống công thức lò xo đầy đủ:
            </span>

            <div className="space-y-3.5">
              {/* Kinematic of spring */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3">
                <span className="text-sm font-bold text-blue-850 block">1. Động học dao động (Ly độ, Vận tốc, Gia tốc)</span>
                <div className="text-slate-700 text-sm leading-relaxed space-y-2">
                  <p>• <strong>Phương trình ly độ:</strong> <Latex math="x = A\cos(\omega t + \varphi)" /></p>
                  <p>• <strong>Phương trình vận tốc:</strong> <Latex math="v = x' = -\omega A\sin(\omega t + \varphi)" /></p>
                  <p>• <strong>Phương trình gia tốc:</strong> <Latex math="a = v' = -\omega^2 x" /></p>
                  <p className="mt-2">• <strong>Hệ thức liên hệ độc lập thời gian:</strong></p>
                  <div className="py-2.5 my-2 flex justify-center items-center bg-blue-50/30 border border-blue-100 rounded-xl text-lg sm:text-xl font-bold text-slate-900 shadow-sm px-4 overflow-x-auto">
                    <Latex math="A^2 = x^2 + \frac{v^2}{\omega^2} = \frac{a^2}{\omega^4} + \frac{v^2}{\omega^2}" block />
                  </div>
                </div>
              </div>

              {/* Dynamics & Forces */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3">
                <span className="text-sm font-bold text-purple-850 block">2. Động lực học (Lực kéo về & Lực đàn hồi)</span>
                <div className="text-slate-700 text-sm leading-relaxed space-y-2">
                  <p>• <strong>Lực kéo về (Lực hồi phục):</strong> Luôn hướng về vị trí cân bằng:</p>
                  <div className="py-2.5 my-2 flex justify-center items-center bg-purple-50/30 border border-purple-100 rounded-xl text-lg sm:text-xl font-bold text-slate-900 shadow-sm px-4 overflow-x-auto">
                    <Latex math="F_{\text{kv}} = -kx" block />
                  </div>
                </div>
                <div className="text-slate-700 text-sm leading-relaxed space-y-2">
                  <p>• <strong>Độ dãn lò xo ở vị trí cân bằng (treo thẳng đứng):</strong></p>
                  <div className="py-2.5 my-2 flex justify-center items-center bg-purple-50/30 border border-purple-100 rounded-xl text-lg sm:text-xl font-bold text-slate-900 shadow-sm px-4 overflow-x-auto">
                    <Latex math="\Delta\ell_0 = \frac{mg}{k}" block />
                  </div>
                </div>
                <div className="text-slate-700 text-sm leading-relaxed space-y-2">
                  <p>• <strong>Lực đàn hồi lò xo thẳng đứng:</strong> <Latex math="F_{\text{đh}} = -k(\Delta\ell_0 + x)" /></p>
                  <div className="bg-slate-50 p-3 rounded-xl text-slate-700 space-y-2 text-sm border border-slate-150 shadow-inner">
                    <p className="flex items-center gap-1">• Lực đàn hồi cực đại: <Latex math="F_{\text{đh\_max}} = k(\Delta\ell_0 + A)" /></p>
                    <p>• Lực đàn hồi cực tiểu <Latex math="F_{\text{đh\_min}}" />:</p>
                    <div className="pl-4 space-y-1 font-serif">
                      <p>+ Nếu <Latex math="\Delta\ell_0 \ge A" />: <Latex math="F_{\text{đh\_min}} = k(\Delta\ell_0 - A)" /></p>
                      <p>+ Nếu <Latex math="\Delta\ell_0 < A" />: <Latex math="F_{\text{đh\_min}} = 0" /></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Energy */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3">
                <span className="text-sm font-bold text-emerald-850 block">3. Năng lượng con lắc lò xo (Bảo toàn cơ năng)</span>
                <div className="text-slate-700 text-sm leading-relaxed space-y-2">
                  <p>• <strong>Động năng:</strong> <Latex math="W_{\text{đ}} = \frac{1}{2}mv^2" /></p>
                  <p>• <strong>Thế năng đàn hồi:</strong> <Latex math="W_{\text{t}} = \frac{1}{2}kx^2" /></p>
                  <p className="mt-2">• <strong>Cơ năng bảo toàn khi bỏ qua ma sát:</strong></p>
                  <div className="py-2.5 my-2 flex justify-center items-center bg-emerald-50/30 border border-emerald-100 rounded-xl text-lg sm:text-xl font-bold text-slate-900 shadow-sm px-4 overflow-x-auto">
                    <Latex math="W = W_{\text{đ}} + W_{\text{t}} = \frac{1}{2}kA^2 = \frac{1}{2}m\omega^2 A^2 = \text{hằng số}" block />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100/70 rounded-xl p-3 text-xs text-indigo-800 space-y-2">
              <span className="font-bold flex items-center gap-1 text-indigo-950">
                <HelpCircle className="h-3.5 w-3.5" /> Gợi ý thực hành quan sát:
              </span>
              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                <li>Tăng <strong>độ cứng <Latex math="k" /></strong> làm cho lò xo khỏe hơn, kéo vật hồi phục nhanh hơn khiến chu kỳ <strong><Latex math="T" /> giảm</strong>.</li>
                <li>Nếu tăng <strong>khối lượng <Latex math="m" /></strong> lên gấp 4 lần, chu kỳ <strong><Latex math="T" /> sẽ tăng gấp 2 lần</strong> (do tỷ lệ thuận với <Latex math="\sqrt{m}" />)!</li>
              </ul>
            </div>
          </div>
        </div>
      ) : experimentId === "light" ? (
        <div className="space-y-5">
          {/* Main Formula Display for Light Interference */}
          <div className="bg-gradient-to-br from-blue-50/40 to-slate-50 border border-slate-150 rounded-2xl p-5 text-center flex flex-col items-center shadow-inner">
            <span className="text-xs text-blue-650 uppercase tracking-widest font-extrabold block mb-2.5">
              Khoảng vân giao thoa (Bài 14: Giao thoa ánh sáng)
            </span>
            <div className="inline-flex items-center bg-white px-8 py-4 rounded-2xl border border-slate-150 shadow-sm select-none transition-all hover:shadow-md text-3xl sm:text-4xl md:text-5xl font-serif">
              <Latex math="i = \frac{\lambda D}{a}" />
            </div>
            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              Trong đó: <Latex math="\lambda" /> là bước sóng ánh sáng (nm),{" "}
              <Latex math="D" /> là khoảng cách từ hai khe đến màn (m),{" "}
              <Latex math="a" /> là khoảng cách giữa hai khe hẹp (mm).
            </p>
          </div>

          {/* Dynamic computed parameters for Light */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50/70 border border-slate-200/60 p-3 rounded-xl text-center">
              <span className="text-slate-500 font-semibold block mb-0.5">Khoảng vân chùm 1 (<Latex math="i_1" />)</span>
              <span id="formula-light-i1" className="text-lg font-bold font-mono text-blue-700 block">
                {lShow1 ? `${iWidth1.toFixed(3)} mm` : "Đang tắt"}
              </span>
            </div>
            <div className="bg-slate-50/70 border border-slate-200/60 p-3 rounded-xl text-center">
              <span className="text-slate-500 font-semibold block mb-0.5">Khoảng vân chùm 2 (<Latex math="i_2" />)</span>
              <span className="text-lg font-bold font-mono text-teal-650 block">
                {lMode === "double" && lShow2 ? `${iWidth2.toFixed(3)} mm` : "Đang tắt / Đơn sắc"}
              </span>
            </div>

            {hasCoincidence && (
              <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-xl col-span-1 sm:col-span-2 space-y-1.5">
                <span className="text-emerald-800 font-bold flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" /> Hiện tượng trùng vân sáng (Giao thoa hai màu)
                </span>
                <div className="text-slate-700 text-xs">
                  Điều kiện trùng vân: <Latex math="k_1 \cdot \lambda_1 = k_2 \cdot \lambda_2" />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-xs text-slate-800 bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                  <div className="flex items-center gap-1">
                    Tỉ số bậc: <Latex math={`\\frac{k_1}{k_2} = \\frac{\\lambda_2}{\\lambda_1} = \\frac{${bestK2}}{${bestK1}}`} />
                  </div>
                  <div className="flex items-center gap-1 border-l border-emerald-200 pl-4">
                    Khoảng vân trùng: <Latex math={`i_{\\text{trùng}} \\approx ${iCoincidence.toFixed(3)}\\text{ mm}`} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SGK Light Interference Theory */}
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-4">
            <span className="font-extrabold flex items-center gap-1.5 text-slate-800 text-xs sm:text-sm uppercase tracking-wider">
              <BookOpen className="h-4 w-4 text-blue-600" /> Lý thuyết giao thoa ánh sáng đầy đủ:
            </span>

            <div className="space-y-3.5">
              {/* Basic equations */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3">
                <span className="text-sm font-bold text-blue-800 block">1. Công thức vân sáng & vân tối</span>
                <div className="text-slate-700 text-sm leading-relaxed space-y-2">
                  <p>• <strong>Khoảng vân (<Latex math="i" />):</strong> Khoảng cách giữa 2 vân sáng (hoặc vân tối) cạnh nhau:</p>
                  <div className="py-2.5 my-2 flex justify-center items-center bg-blue-50/30 border border-blue-100 rounded-xl text-lg sm:text-xl font-bold text-slate-900 shadow-sm px-4 overflow-x-auto">
                    <Latex math="i = \frac{\lambda D}{a}" block />
                  </div>
                  <p className="mt-2">• <strong>Vị trí vân sáng (<Latex math="x_{\text{sáng}}" />):</strong></p>
                  <div className="py-2.5 my-2 flex justify-center items-center bg-blue-50/30 border border-blue-100 rounded-xl text-lg sm:text-xl font-bold text-slate-900 shadow-sm px-4 overflow-x-auto">
                    <Latex math="x_{\text{sáng}} = k \cdot i = k \frac{\lambda D}{a} \quad (k \in \mathbb{Z})" block />
                  </div>
                  <p className="mt-2">• <strong>Vị trí vân tối (<Latex math="x_{\text{tối}}" />):</strong></p>
                  <div className="py-2.5 my-2 flex justify-center items-center bg-blue-50/30 border border-blue-100 rounded-xl text-lg sm:text-xl font-bold text-slate-900 shadow-sm px-4 overflow-x-auto">
                    <Latex math="x_{\text{tối}} = \left(k + \frac{1}{2}\right) i = \left(k + \frac{1}{2}\right) \frac{\lambda D}{a} \quad (k \in \mathbb{Z})" block />
                  </div>
                </div>
              </div>

              {/* Optical Path Difference */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3">
                <span className="text-sm font-bold text-purple-855 block">2. Hiệu quang trình (<Latex math="d_2 - d_1" />)</span>
                <div className="text-slate-700 text-sm leading-relaxed space-y-2">
                  <p>• Hiệu quang trình từ hai khe tới điểm M cách vân trung tâm một khoảng <Latex math="x" />:</p>
                  <div className="py-2.5 my-2 flex justify-center items-center bg-purple-50/30 border border-purple-100 rounded-xl text-lg sm:text-xl font-bold text-slate-900 shadow-sm px-4 overflow-x-auto">
                    <Latex math="d_2 - d_1 = \frac{a \cdot x}{D}" block />
                  </div>
                  <p className="mt-2">• <strong>Điều kiện vân sáng:</strong> <Latex math="d_2 - d_1 = k \cdot \lambda \quad (k \in \mathbb{Z})" /></p>
                  <p>• <strong>Điều kiện vân tối:</strong> <Latex math="d_2 - d_1 = \left(k + \frac{1}{2}\right) \lambda \quad (k \in \mathbb{Z})" /></p>
                </div>
              </div>

              {/* Coincidence (Dual-color) */}
              {lMode === "double" && (
                <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3">
                  <span className="text-sm font-bold text-emerald-850 block">3. Giao thoa nhiều màu (Sự trùng vân sáng)</span>
                  <div className="text-slate-700 text-sm leading-relaxed space-y-2">
                    <p>• Vị trí trùng nhau thỏa mãn: <Latex math="x_{\text{s1}} = x_{\text{s2}}" /></p>
                    <div className="py-3 my-2 bg-emerald-50/30 border border-emerald-100 rounded-xl text-lg sm:text-xl font-bold text-slate-900 shadow-sm px-4 overflow-x-auto flex flex-col items-center justify-center space-y-2">
                      <Latex math="k_1 \cdot i_1 = k_2 \cdot i_2 \implies k_1 \cdot \lambda_1 = k_2 \cdot \lambda_2" block />
                      <div className="mt-1">
                        <Latex math="\frac{k_1}{k_2} = \frac{\lambda_2}{\lambda_1} = \frac{p}{q} \quad \text{(tỉ số tối giản)}" block />
                      </div>
                    </div>
                    <p>• Khoảng cách nhỏ nhất giữa hai vân trùng: <Latex math="i_{\text{trùng}} = p \cdot i_1 = q \cdot i_2" /></p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50/50 border border-blue-100/70 rounded-xl p-3 text-xs text-blue-800 space-y-2">
              <span className="font-bold flex items-center gap-1 text-blue-950">
                <HelpCircle className="h-3.5 w-3.5" /> Gợi ý thực hành quan sát:
              </span>
              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                <li>Tăng bước sóng <strong><Latex math="\lambda" /></strong> (kéo thanh trượt từ Tím sang Đỏ) sẽ làm dãn rộng khoảng cách giữa các vạch sáng (khoảng vân <strong><Latex math="i" /> tăng</strong>).</li>
                <li>Tăng khoảng cách màn <strong><Latex math="D" /></strong> sẽ làm dãn rộng các vạch vân sáng.</li>
                <li>Tăng khoảng cách hai khe <strong><Latex math="a" /></strong> sẽ làm các vạch xếp khít lại gần nhau (khoảng vân <strong><Latex math="i" /> giảm tỉ lệ nghịch</strong>).</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Main Formula Wave Display */}
          <div className="bg-gradient-to-br from-teal-50/40 to-slate-50 border border-slate-150 rounded-2xl p-5 text-center flex flex-col items-center shadow-inner">
            <span className="text-xs text-teal-650 uppercase tracking-widest font-extrabold block mb-2.5">
              Bước sóng và Mối liên hệ sóng (Bài 8 & Bài 9)
            </span>
            <div className="inline-flex items-center bg-white px-8 py-4 rounded-2xl border border-slate-150 shadow-sm select-none transition-all hover:shadow-md text-3xl sm:text-4xl md:text-5xl font-serif">
              <Latex math="\lambda = \frac{v}{f}" />
            </div>
            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              Trong đó: <Latex math="\lambda" /> là bước sóng (m),{" "}
              <Latex math="v" /> là tốc độ truyền sóng (m/s),{" "}
              <Latex math="f" /> là tần số dao động nguồn (Hz).
            </p>
          </div>

          {/* Dynamic values */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50/70 border border-slate-200/60 p-3 rounded-xl">
              <span className="text-slate-500 font-semibold block mb-0.5">Bước sóng (<Latex math="\lambda" />)</span>
              <span id="formula-wave-lambda" className="text-base font-bold font-mono text-blue-700 block">
                {(wavelength / 100).toFixed(2)} m
              </span>
            </div>
            <div className="bg-slate-50/70 border border-slate-200/60 p-3 rounded-xl">
              <span className="text-slate-500 font-semibold block mb-0.5">Tần số góc (<Latex math="\omega" />)</span>
              <span className="text-base font-bold font-mono text-teal-650 block">
                {angularFreq.toFixed(2)} rad/s
              </span>
            </div>
            <div className="bg-slate-50/70 border border-slate-200/60 p-3 rounded-xl">
              <span className="text-slate-500 font-semibold block mb-0.5">Chu kỳ sóng (<Latex math="T" />)</span>
              <span className="text-base font-bold font-mono text-indigo-650 block">
                {wf > 0 ? `${(1 / wf).toFixed(2)} s` : "Vô cực"}
              </span>
            </div>
            <div className="bg-slate-50/70 border border-slate-200/60 p-3 rounded-xl">
              <span className="text-slate-500 font-semibold block mb-0.5">Số sóng (<Latex math="k" />)</span>
              <span className="text-base font-bold font-mono text-purple-650 block">
                {waveNumber.toFixed(3)} rad/m
              </span>
            </div>
            <div className="bg-slate-50/70 border border-slate-200/60 p-3 rounded-xl col-span-2">
              <span className="text-slate-500 font-semibold block mb-0.5">
                Phương trình sóng tại điểm M cách nguồn một khoảng x: <Latex math="u_M(x,t)" />
              </span>
              <span className="text-xs sm:text-sm font-bold font-mono text-purple-700 block mt-1 leading-normal bg-white p-1 rounded border border-slate-100">
                <Latex math={`u_M = ${wA} \\cos(${angularFreq.toFixed(1)}t - ${(2 * Math.PI / (wavelength || 1)).toFixed(3)}x)`} />
              </span>
            </div>
          </div>

          {/* SGK Waves details */}
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-4">
            <span className="font-extrabold flex items-center gap-1.5 text-slate-800 text-xs sm:text-sm uppercase tracking-wider">
              <BookOpen className="h-4 w-4 text-teal-900" /> Hệ thống công thức sóng cơ & giao thoa:
            </span>

            <div className="space-y-3.5">
              {/* Waves kinematics */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3">
                <span className="text-sm font-bold text-teal-850 block">1. Sự lan truyền sóng (Vận tốc, Chu kỳ, Độ lệch pha)</span>
                <div className="text-slate-700 text-sm leading-relaxed space-y-2">
                  <p>• <strong>Bước sóng (<Latex math="\lambda" />):</strong> Quãng đường sóng truyền đi được trong một chu kỳ <Latex math="T" />:</p>
                  <div className="py-3 my-2 flex justify-center items-center bg-teal-50/30 border border-teal-100 rounded-xl text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 shadow-sm px-4 overflow-x-auto">
                    <Latex math="\lambda = v \cdot T = \frac{v}{f}" block />
                  </div>
                  <p className="mt-2">• <strong>Phương trình sóng tại điểm M cách nguồn O một khoảng x (sóng truyền theo chiều Ox+):</strong></p>
                  <div className="py-3 my-2 flex justify-center items-center bg-teal-50/30 border border-teal-100 rounded-xl text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 shadow-sm px-4 overflow-x-auto">
                    <Latex math="u_M(t) = A \cos\left(\omega t - \frac{2\pi x}{\lambda}\right)" block />
                  </div>
                  <p className="mt-2">• <strong>Độ lệch pha giữa hai điểm cách nhau d:</strong></p>
                  <div className="py-3 my-2 flex justify-center items-center bg-teal-50/30 border border-teal-100 rounded-xl text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 shadow-sm px-4 overflow-x-auto">
                    <Latex math="\Delta\varphi = \frac{2\pi d}{\lambda}" block />
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl text-sm text-slate-700 space-y-2 border border-slate-150 my-2 shadow-inner font-medium">
                    <p className="flex items-center gap-1">• Cùng pha: <Latex math="d = k \cdot \lambda \quad (k \in \mathbb{Z})" /></p>
                    <p className="flex items-center gap-1">• Ngược pha: <Latex math="d = (k + 0.5) \cdot \lambda \quad (k \in \mathbb{Z})" /></p>
                    <p className="flex items-center gap-1">• Vuông pha: <Latex math="d = (2k + 1)\frac{\lambda}{4} \quad (k \in \mathbb{Z})" /></p>
                  </div>
                </div>
              </div>

              {/* Wave interference */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3">
                <span className="text-sm font-bold text-blue-850 block">2. Giao thoa sóng cơ (Bài 12: Hai nguồn kết hợp cùng pha)</span>
                <p className="text-slate-700 text-sm leading-relaxed">
                  Khi hai nguồn kết hợp đồng pha phát sóng, tại vùng gặp nhau:
                </p>
                <div className="text-slate-700 text-sm leading-relaxed space-y-2">
                  <p>• <strong>Điểm cực đại giao thoa (Biên độ dao động lớn nhất):</strong></p>
                  <div className="py-3 my-2 flex justify-center items-center bg-blue-50/30 border border-blue-100 rounded-xl text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 shadow-sm px-4 overflow-x-auto">
                    <Latex math="d_2 - d_1 = k \cdot \lambda \quad (k \in \mathbb{Z})" block />
                  </div>
                  <p className="mt-2">• <strong>Điểm cực tiểu giao thoa (Biên độ dao động triệt tiêu):</strong></p>
                  <div className="py-3 my-2 flex justify-center items-center bg-blue-50/30 border border-blue-100 rounded-xl text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 shadow-sm px-4 overflow-x-auto">
                    <Latex math="d_2 - d_1 = (k + 0.5) \cdot \lambda \quad (k \in \mathbb{Z})" block />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-teal-50/50 border border-teal-100/70 rounded-xl p-3 text-xs text-teal-850 space-y-2">
              <span className="font-bold flex items-center gap-1 text-teal-900 pt-1">
                <HelpCircle className="h-3.5 w-3.5" /> Gợi ý thực hành quan sát:
              </span>
              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                <li>Tăng <strong>Tốc độ truyền (<Latex math="v" />)</strong> kéo dãn các ngọn sóng ra xa nhau, tức là làm tăng bước sóng <strong><Latex math="\lambda" /></strong>.</li>
                <li>Tăng <strong>Tần số dao động (<Latex math="f" />)</strong> làm các ngọn sóng xếp gần nhau hơn (bước sóng <strong><Latex math="\lambda" /> giảm tỉ lệ nghịch</strong>).</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
