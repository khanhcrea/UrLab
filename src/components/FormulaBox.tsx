import { BookOpen, HelpCircle, Sigma } from "lucide-react";
import { PendulumParams, WaveParams, SpringParams, LightInterferenceParams } from "../types";

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
  const pThetaRad = (pendulumParams.initialAngle * Math.PI) / 180;

  const pendulumPeriod = pg > 0 ? 2 * Math.PI * Math.sqrt(pL / pg) : 0;
  const pendulumFrequency = pendulumPeriod > 0 ? 1 / pendulumPeriod : 0;
  // Ep_max = m * g * L * (1 - cos(theta_0))
  const maxPotentialEnergy = pm * pg * pL * (1 - Math.cos(pThetaRad));

  // Calculations for Wave
  const wA = waveParams.amplitude;
  const wf = waveParams.frequency;
  const wv = waveParams.speed;

  // Wavelength lambda = v / f (let's assume unit conversion where speed is in cm/s for easier readability)
  const wavelength = wf > 0 ? wv / wf : 0;
  const angularFreq = 2 * Math.PI * wf;

  // Calculations for Spring-Mass
  const sK = springParams?.k ?? 40;
  const sM = springParams?.mass ?? 1.0;
  const sX0 = (springParams?.initialX ?? 6) / 100; // in meters
  const springPeriod = sK > 0 ? 2 * Math.PI * Math.sqrt(sM / sK) : 0;
  const springFreq = springPeriod > 0 ? 1 / springPeriod : 0;
  const springAngularFreq = sM > 0 ? Math.sqrt(sK / sM) : 0;
  const totalMechEnergy = 0.5 * sK * sX0 * sX0; // W = 1/2 * k * A^2 at max amplitude

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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
        <Sigma className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-bold text-slate-900">Hộp Công Thức Động (Formula Box)</h3>
      </div>

      {experimentId === "pendulum" ? (
        <div className="space-y-5">
          {/* Main Formula display Card */}
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-5 text-center flex flex-col items-center">
            <span className="text-sm text-slate-500 uppercase tracking-wider font-bold block mb-1.5">
              Công thức Chu kỳ Con lắc đơn
            </span>
            <div className="inline-flex items-center font-serif text-2xl text-slate-800 bg-white px-6 py-3 rounded-xl border border-slate-200/50 shadow-sm select-none">
              <span className="font-semibold italic">T</span>
              <span className="mx-2">=</span>
              <span>2π</span>
              <span className="mx-2 text-slate-400">·</span>
              <div className="inline-flex items-center">
                <span className="text-4xl font-serif leading-none -mr-[2px] text-slate-850">√</span>
                <div className="inline-flex flex-col items-center justify-center border-t-2 border-slate-800 pt-1 px-1 text-xs font-sans font-semibold">
                  <span className="italic font-serif border-b border-slate-700 pb-0.5 px-2 leading-none">L</span>
                  <span className="italic font-serif pt-1 leading-none font-medium">g</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-3">
              Trong đó: <strong className="text-slate-800">L</strong> là chiều dài dây treo (m),{" "}
              <strong className="text-slate-800">g</strong> là gia tốc trọng trường (m/s²).
            </p>
          </div>

          {/* Dynamic computed parameters */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl">
              <span className="text-slate-600 font-semibold block mb-0.5">Chu kỳ dao động (T)</span>
              <span id="formula-pendulum-period" className="text-lg font-bold font-mono text-blue-700 block">
                {pendulumPeriod > 0 ? `${pendulumPeriod.toFixed(3)} giây` : "Vô cực (g = 0)"}
              </span>
            </div>
            <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl">
              <span className="text-slate-600 font-semibold block mb-0.5">Tần số dao động (f)</span>
              <span id="formula-pendulum-freq" className="text-lg font-bold font-mono text-teal-600 block">
                {pendulumFrequency > 0 ? `${pendulumFrequency.toFixed(3)} Hz` : "0 Hz"}
              </span>
            </div>
            <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl">
              <span className="text-slate-600 font-semibold block mb-0.5">Cơ năng tối đa (E_max)</span>
              <span className="text-lg font-bold font-mono text-indigo-650 block">
                {maxPotentialEnergy.toFixed(4)} Joules
              </span>
            </div>
            <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl">
              <span className="text-slate-600 font-semibold block mb-0.5">Tần số góc (ω)</span>
              <span className="text-lg font-bold font-mono text-purple-600 block">
                {pendulumPeriod > 0 ? `${(2 * Math.PI / pendulumPeriod).toFixed(3)} rad/s` : "0 rad/s"}
              </span>
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100/70 rounded-xl p-4 text-sm text-blue-800 space-y-1.5 leading-relaxed">
            <span className="font-bold flex items-center gap-1.5 text-blue-900 text-sm">
              <HelpCircle className="h-4 w-4" /> Gợi ý quan sát:
            </span>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700 text-sm">
              <li>Hãy tăng thử <strong>Chiều dài dây treo (L)</strong> lên gấp 4 lần (ví dụ từ 0.5m lên 2.0m). Chu kỳ T sẽ tăng lên đúng 2 lần!</li>
              <li>Khi bạn giảm <strong>Trọng lực g</strong> về mức Mặt Trăng (1.62), lực phục hồi yếu đi khiến chu kỳ kéo dài hơn rất nhiều!</li>
            </ul>
          </div>
        </div>
      ) : experimentId === "spring" ? (
        <div className="space-y-5">
          {/* Main Formula display Card for Spring */}
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-5 text-center flex flex-col items-center">
            <span className="text-sm text-slate-500 uppercase tracking-wider font-bold block mb-1.5">
              Chu kỳ riêng con lắc lò xo
            </span>
            <div className="inline-flex items-center font-serif text-2xl text-slate-800 bg-white px-6 py-3 rounded-xl border border-slate-200/50 shadow-sm select-none">
              <span className="font-semibold italic">T</span>
              <span className="mx-2">=</span>
              <span>2π</span>
              <span className="mx-2 text-slate-400">·</span>
              <div className="inline-flex items-center">
                <span className="text-4xl font-serif leading-none -mr-[2px] text-slate-850">√</span>
                <div className="inline-flex flex-col items-center justify-center border-t-2 border-slate-800 pt-1 px-1 text-xs font-sans font-semibold">
                  <span className="italic font-serif border-b border-slate-700 pb-0.5 px-2 leading-none">m</span>
                  <span className="italic font-serif pt-1 leading-none font-medium">k</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-3">
              Trong đó: <strong className="text-slate-800">m</strong> là khối lượng (kg),{" "}
              <strong className="text-slate-800">k</strong> là độ cứng lò xo (N/m).
            </p>
          </div>

          {/* Dynamic computed parameters for Spring */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl">
              <span className="text-slate-600 font-semibold block mb-0.5">Chu kỳ dao động (T)</span>
              <span id="formula-spring-period" className="text-lg font-bold font-mono text-blue-700 block">
                {springPeriod > 0 ? `${springPeriod.toFixed(3)} giây` : "Vô cực"}
              </span>
            </div>
            <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl">
              <span className="text-slate-600 font-semibold block mb-0.5">Tần số riêng (f)</span>
              <span id="formula-spring-freq" className="text-lg font-bold font-mono text-teal-600 block">
                {springFreq > 0 ? `${springFreq.toFixed(3)} Hz` : "0 Hz"}
              </span>
            </div>
            <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl">
              <span className="text-slate-600 font-semibold block mb-0.5">Cơ năng ban đầu (W₀)</span>
              <span className="text-lg font-bold font-mono text-indigo-650 block">
                {totalMechEnergy.toFixed(4)} Joules
              </span>
            </div>
            <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl">
              <span className="text-slate-600 font-semibold block mb-0.5">Tần số góc (ω)</span>
              <span className="text-lg font-bold font-mono text-purple-650 block">
                {springAngularFreq.toFixed(3)} rad/s
              </span>
            </div>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100/70 rounded-xl p-4 text-sm text-indigo-800 space-y-1.5 leading-relaxed">
            <span className="font-bold flex items-center gap-1.5 text-indigo-950 text-sm">
              <HelpCircle className="h-4 w-4" /> Gợi ý quan sát:
            </span>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700 text-sm">
              <li>Tăng <strong>độ cứng k</strong> giúp lò xo khoẻ hơn, kéo vật hồi phục nhanh hơn khiến chu kỳ <strong>T giảm</strong>.</li>
              <li>Nếu tăng <strong>khối lượng m</strong> lên gấp 4 lần, quán tính vật tăng khiến chu kỳ dao động <strong>T tăng gấp đôi</strong>!</li>
            </ul>
          </div>
        </div>
      ) : experimentId === "light" ? (
        <div className="space-y-5">
          {/* Main Formula Display for Light Interference */}
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-5 text-center flex flex-col items-center">
            <span className="text-sm text-slate-500 uppercase tracking-wider font-bold block mb-1.5">
              Khoảng vân giao thoa (Fringe width)
            </span>
            <div className="inline-flex items-center font-serif text-2xl text-slate-800 bg-white px-6 py-3.5 rounded-xl border border-slate-200/50 shadow-sm select-none">
              <span className="italic font-semibold">i</span>
              <span className="mx-2">=</span>
              <div className="inline-flex flex-col items-center justify-center px-2 text-xs font-semibold">
                <span className="italic font-serif border-b border-slate-700 pb-0.5 px-2 leading-none">λ · D</span>
                <span className="italic font-serif pt-1 leading-none font-medium">a</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-3">
              Trong đó: <strong className="text-slate-800">λ</strong> là bước sóng (nm),{" "}
              <strong className="text-slate-800">D</strong> là khoảng cách màn (m),{" "}
              <strong className="text-slate-800">a</strong> là khoảng cách 2 khe (mm).
            </p>
          </div>

          {/* Dynamic computed parameters for Light */}
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl text-center">
              <span className="text-slate-600 font-semibold block mb-0.5">Khoảng vân giao thoa tính toán (i)</span>
              <span id="formula-light-i1" className="text-2xl font-bold font-mono text-blue-700 block">
                {iWidth1.toFixed(3)} mm
              </span>
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100/70 rounded-xl p-4 text-sm text-blue-850 space-y-1.5 leading-relaxed">
            <span className="font-bold flex items-center gap-1.5 text-blue-950 text-sm">
              <HelpCircle className="h-4 w-4" /> Gợi ý quan sát giao thoa đơn sắc:
            </span>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700 text-sm">
              <li>Tăng bước sóng <strong className="text-blue-900 font-bold">λ</strong> (Ví dụ: kéo slider từ Tím sang Đỏ) sẽ làm dãn khoảng cách giữa các vạch sáng (khoảng vân <strong className="text-blue-900 font-bold">i tăng</strong>).</li>
              <li>Tăng khoảng cách màn <strong className="text-blue-900 font-bold">D</strong> sẽ làm dãn khoảng cách vân (khoảng vân <strong className="text-blue-900 font-bold">i tăng tỷ lệ thuận</strong>).</li>
              <li>Tăng khoảng cách hai khe <strong className="text-blue-900 font-bold">a</strong> sẽ làm các vạch sáng xếp khít lại với nhau (khoảng vân <strong className="text-blue-900 font-bold">i giảm tỉ lệ nghịch</strong>).</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Main Formula Wave Display */}
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-5 text-center flex flex-col items-center">
            <span className="text-sm text-slate-500 uppercase tracking-wider font-bold block mb-1.5">
              Công thức mối liên hệ Sóng
            </span>
            <div className="inline-flex items-center font-serif text-2xl text-slate-800 bg-white px-6 py-3.5 rounded-xl border border-slate-200/50 shadow-sm select-none">
              <span className="italic font-semibold">λ</span>
              <span className="mx-2">=</span>
              <div className="inline-flex flex-col items-center justify-center px-2 text-xs font-semibold">
                <span className="italic font-serif border-b border-slate-700 pb-0.5 px-2 leading-none">v</span>
                <span className="italic font-serif pt-1 leading-none font-medium">f</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-3">
              Trong đó: <strong className="text-slate-800">λ</strong> là Bước sóng (m),{" "}
              <strong className="text-slate-800">v</strong> là Tốc độ truyền (m/s),{" "}
              <strong className="text-slate-800">f</strong> là Tần số (Hz).
            </p>
          </div>

          {/* Dynamic values */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl">
              <span className="text-slate-600 font-semibold block mb-0.5">Bước sóng (λ)</span>
              <span id="formula-wave-lambda" className="text-lg font-bold font-mono text-blue-700 block">
                {(wavelength / 100).toFixed(2)} m
              </span>
            </div>
            <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl">
              <span className="text-slate-600 font-semibold block mb-0.5">Tần số góc (ω)</span>
              <span className="text-lg font-bold font-mono text-teal-600 block">
                {angularFreq.toFixed(2)} rad/s
              </span>
            </div>
            <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl">
              <span className="text-slate-600 font-semibold block mb-0.5">Chu kỳ truyền sóng (T)</span>
              <span className="text-lg font-bold font-mono text-indigo-650 block">
                {wf > 0 ? `${(1 / wf).toFixed(2)} giây` : "Vô cực"}
              </span>
            </div>
            <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl">
              <span className="text-slate-600 font-semibold block mb-0.5">Phương trình u(x,t)</span>
              <span className="text-sm font-serif italic text-purple-750 block mt-1 leading-tight font-bold">
                u(x,t) = {wA}·cos({angularFreq.toFixed(1)}t - {(2 * Math.PI / (wavelength || 1)).toFixed(3)}x)
              </span>
            </div>
          </div>

          <div className="bg-teal-50/50 border border-teal-100/70 rounded-xl p-4 text-sm text-teal-850 space-y-1.5 leading-relaxed">
            <span className="font-bold flex items-center gap-1.5 text-teal-900 text-sm">
              <HelpCircle className="h-4 w-4" /> Gợi ý quan sát:
            </span>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700 text-sm">
              <li>Tăng <strong>Tốc độ truyền (v)</strong> làm kéo dãn các ngọn sóng ra xa nhau hơn, tức là làm tăng bước sóng <strong>λ</strong>.</li>
              <li>Tăng <strong>Tần số dao động (f)</strong> khiến nguồn rung nhanh hơn và bước sóng ngắn lại!</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
