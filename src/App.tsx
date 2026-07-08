import { useState, useEffect } from "react";
import Header from "./components/Header";
import HomeView from "./components/HomeView";
import PendulumCanvas from "./components/PendulumCanvas";
import SpringCanvas from "./components/SpringCanvas";
import WaveCanvas from "./components/WaveCanvas";
import LightInterferenceCanvas from "./components/LightInterferenceCanvas";
import FormulaBox from "./components/FormulaBox";
import NotePad from "./components/NotePad";
import QuizBox from "./components/QuizBox";
import ChatBot from "./components/ChatBot";
import { PendulumParams, WaveParams, SpringParams, LightInterferenceParams, SavedObservation } from "./types";
import { Compass, FileSpreadsheet, Beaker, Waves, BookOpen, Activity, Sparkles, BrainCircuit } from "lucide-react";

export default function App() {
  const [tab, setTab] = useState<"home" | "lab">("home");
  const [activeExperiment, setActiveExperiment] = useState<"pendulum" | "wave" | "spring" | "light">("pendulum");

  const [pendulumParams, setPendulumParams] = useState<PendulumParams>({
    length: 1.5,
    gravity: 9.8,
    initialAngle: 30,
    mass: 1.0,
    damping: 0.05,
  });

  const [springParams, setSpringParams] = useState<SpringParams>({
    k: 40,
    mass: 1.0,
    initialX: 6,
    damping: 0.05,
  });

  const [lightParams, setLightParams] = useState<LightInterferenceParams>({
    mode: "single",
    a: 1.0,
    D: 2.0,
    lambda1: 650, // Red
    lambda2: 532, // Green
    showBeam1: true,
    showBeam2: true,
  });

  const [waveParams, setWaveParams] = useState<WaveParams>({
    amplitude: 35,
    frequency: 1.5,
    speed: 100,
    damping: 1.0,
  });

  const [observations, setObservations] = useState<SavedObservation[]>([]);

  const [rightPanelTab, setRightPanelTab] = useState<"formulas" | "quiz" | "notebook" | "theory">("formulas");

  useEffect(() => {
    const saved = localStorage.getItem("urlab_observations");
    if (saved) {
      try {
        setObservations(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved observations:", e);
      }
    }
  }, []);

  const handleEnterLab = (experimentId: string) => {
    setActiveExperiment(
      experimentId === "wave"
        ? "wave"
        : experimentId === "spring"
        ? "spring"
        : experimentId === "light"
        ? "light"
        : "pendulum"
    );
    setTab("lab");
  };

  const handleSaveObservation = (results: any) => {
    const newObs: SavedObservation = {
      id: `obs-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      experimentId: activeExperiment,
      params: JSON.stringify(
        activeExperiment === "pendulum"
          ? pendulumParams
          : activeExperiment === "spring"
          ? springParams
          : activeExperiment === "light"
          ? lightParams
          : waveParams
      ),
      results: JSON.stringify(results),
      notes: ""
    };

    const updated = [newObs, ...observations];
    setObservations(updated);
    localStorage.setItem("urlab_observations", JSON.stringify(updated));
    setRightPanelTab("notebook");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <Header
        currentTab={tab}
        setTab={setTab}
        activeExperimentTitle={
          activeExperiment === "pendulum"
            ? "Bài 1: Con lắc đơn (Simple Pendulum)"
            : activeExperiment === "spring"
            ? "Bài 2: Con lắc lò xo (Spring-Mass)"
            : activeExperiment === "light"
            ? "Bài 4: Giao thoa ánh sáng (Light Interference)"
            : "Bài 3: Giao thoa sóng & Sóng truyền (Waves)"
        }
      />

      <main className="flex-1">
        {tab === "home" ? (
          <HomeView onEnterLab={handleEnterLab} />
        ) : (
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8 pb-5 border-b border-slate-200">
              <div className="flex bg-slate-200/60 p-1.5 rounded-xl border border-slate-300/40 flex-wrap gap-1">
                <button
                  id="tab-select-pendulum"
                  onClick={() => setActiveExperiment("pendulum")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                    activeExperiment === "pendulum"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Beaker className="h-4.5 w-4.5" />
                  Con Lắc Đơn (Dao động)
                </button>
                <button
                  id="tab-select-spring"
                  onClick={() => setActiveExperiment("spring")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                    activeExperiment === "spring"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Activity className="h-4.5 w-4.5 text-indigo-550" />
                  Con Lắc Lò Xo (Dao động)
                </button>
                <button
                  id="tab-select-wave"
                  onClick={() => setActiveExperiment("wave")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                    activeExperiment === "wave"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Waves className="h-4.5 w-4.5" />
                  Giao Thoa Sóng (Sóng)
                </button>
                <button
                  id="tab-select-light"
                  onClick={() => setActiveExperiment("light")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                    activeExperiment === "light"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Sparkles className="h-4.5 w-4.5 text-violet-555" />
                  Giao Thoa Ánh Sáng (Sóng)
                </button>
              </div>
              <div className="text-sm text-slate-600 font-semibold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                {activeExperiment === "pendulum" ? (
                  <span>Khảo sát: Dao động tuần hoàn của con lắc đơn chịu lực kéo về</span>
                ) : activeExperiment === "spring" ? (
                  <span>Khảo sát: Dao động điều hòa của con lắc lò xo treo thẳng đứng</span>
                ) : activeExperiment === "light" ? (
                  <span>Khảo sát: Giao thoa ánh sáng qua khe Young (Bước sóng đơn sắc λ)</span>
                ) : (
                  <span>Khảo sát: Hiện tượng truyền sóng cơ và giao thoa sóng 2 chiều</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7">
                {activeExperiment === "pendulum" ? (
                  <PendulumCanvas
                    params={pendulumParams}
                    setParams={setPendulumParams}
                    onSaveObservation={handleSaveObservation}
                  />
                ) : activeExperiment === "spring" ? (
                  <SpringCanvas
                    params={springParams}
                    setParams={setSpringParams}
                    onSaveObservation={handleSaveObservation}
                  />
                ) : activeExperiment === "light" ? (
                  <LightInterferenceCanvas
                    params={lightParams}
                    setParams={setLightParams}
                    onSaveObservation={handleSaveObservation}
                  />
                ) : (
                  <WaveCanvas
                    params={waveParams}
                    setParams={setWaveParams}
                    onSaveObservation={handleSaveObservation}
                  />
                )}
              </div>
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="flex bg-slate-200/60 p-1.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold flex-wrap gap-1 sm:gap-0">
                  <button
                    id="right-tab-formulas"
                    onClick={() => setRightPanelTab("formulas")}
                    className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-colors cursor-pointer ${
                      rightPanelTab === "formulas"
                        ? "bg-white text-slate-900 shadow-sm font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Compass className="h-4 w-4 text-blue-500" />
                    Công thức
                  </button>
                  <button
                    id="right-tab-quiz"
                    onClick={() => setRightPanelTab("quiz")}
                    className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-colors cursor-pointer ${
                      rightPanelTab === "quiz"
                        ? "bg-white text-purple-700 shadow-sm font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <BrainCircuit className="h-4 w-4 text-purple-500 shrink-0" />
                    Trắc nghiệm
                  </button>
                  <button
                    id="right-tab-notebook"
                    onClick={() => setRightPanelTab("notebook")}
                    className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-colors cursor-pointer ${
                      rightPanelTab === "notebook"
                        ? "bg-white text-slate-900 shadow-sm font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                    Số liệu
                    {observations.filter(o => o.experimentId === activeExperiment).length > 0 && (
                      <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-100 text-[10px] text-emerald-700 font-bold shrink-0">
                        {observations.filter(o => o.experimentId === activeExperiment).length}
                      </span>
                    )}
                  </button>
                  <button
                    id="right-tab-theory"
                    onClick={() => setRightPanelTab("theory")}
                    className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-colors cursor-pointer ${
                      rightPanelTab === "theory"
                        ? "bg-white text-slate-900 shadow-sm font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <BookOpen className="h-4 w-4 text-amber-500" />
                    Lý thuyết
                  </button>
                </div>
                {rightPanelTab === "formulas" && (
                  <FormulaBox
                    experimentId={activeExperiment}
                    pendulumParams={pendulumParams}
                    waveParams={waveParams}
                    springParams={springParams}
                    lightParams={lightParams}
                  />
                )}

                {rightPanelTab === "quiz" && (
                  <QuizBox experimentId={activeExperiment} />
                )}

                {rightPanelTab === "notebook" && (
                  <NotePad
                    experimentId={activeExperiment}
                    observations={observations}
                    setObservations={setObservations}
                  />
                )}

                {rightPanelTab === "theory" && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                      <BookOpen className="h-6 w-6 text-amber-500" />
                      <h3 className="text-lg font-bold text-slate-900">Kiến Thức Trọng Tâm Lớp 11</h3>
                    </div>

                    {activeExperiment === "pendulum" ? (
                      <div className="text-sm text-slate-700 space-y-4.5 leading-relaxed">
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">1. Chu kỳ dao động (Period)</h4>
                          <p className="mt-1.5">
                            Là khoảng thời gian để con lắc thực hiện hết một dao động toàn phần. 
                            Đối với góc lệch nhỏ (dưới 10°), dao động của con lắc đơn được coi là dao động điều hòa với chu kỳ độc lập với khối lượng m và góc ban đầu θ₀.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">2. Trọng lực & Lực hồi phục</h4>
                          <p className="mt-1.5">
                            Thành phần trọng lực theo phương tiếp tuyến với quỹ đạo đóng vai trò là <strong>lực phục hồi (lực kéo về)</strong> kéo quả nặng về vị trí cân bằng:
                            <br />
                            <code className="bg-slate-100 px-2 py-1 rounded font-mono text-slate-800 block mt-1">F_t = -m · g · sin(θ)</code>
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">3. Bảo toàn cơ năng</h4>
                          <p className="mt-1.5">
                            Khi không có lực cản, cơ năng được bảo toàn và liên tục chuyển hóa qua lại giữa Động năng (cực đại ở vị trí cân bằng thấp nhất) và Thế năng (cực đại ở 2 biên cao nhất).
                          </p>
                        </div>
                      </div>
                    ) : activeExperiment === "spring" ? (
                      <div className="text-sm text-slate-700 space-y-4.5 leading-relaxed">
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">1. Dao động điều hòa của con lắc lò xo</h4>
                          <p className="mt-1.5">
                            Con lắc lò xo gồm một vật nặng có khối lượng m gắn vào đầu một lò xo có độ cứng k. Khi không có lực cản ma sát, con lắc dao động điều hòa quanh vị trí cân bằng với tần số riêng độc lập với biên độ dao động.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">2. Tần số góc và Chu kỳ riêng</h4>
                          <p className="mt-1.5">
                            Tần số góc và chu kỳ riêng của con lắc lò xo được xác định qua khối lượng m và độ cứng k:
                            <br />
                            <code className="bg-slate-100 px-2 py-1 rounded font-mono text-slate-850 block mt-1.5">ω = √(k / m)  (rad/s)</code>
                            <code className="bg-slate-100 px-2 py-1 rounded font-mono text-slate-850 block mt-1.5">T = 2π · √(m / k)  (s)</code>
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">3. Chuyển hóa Năng lượng (Cơ năng)</h4>
                          <p className="mt-1.5">
                            Trong quá trình dao động điều hòa, Động năng và Thế năng biến thiên tuần hoàn ngược pha nhau, nhưng tổng Cơ năng luôn được bảo toàn:
                            <br />
                            <code className="bg-slate-100 px-2 py-1 rounded font-mono text-slate-850 block mt-1.5">W = W_đ + W_t = ½ · m · v² + ½ · k · x² = ½ · k · A² = hằng số</code>
                          </p>
                        </div>
                      </div>
                    ) : activeExperiment === "light" ? (
                      <div className="text-sm text-slate-700 space-y-4.5 leading-relaxed">
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">1. Hiện tượng giao thoa ánh sáng</h4>
                          <p className="mt-1.5">
                            Là hiện tượng hai chùm sáng kết hợp khi chồng chất lên nhau tạo ra hệ vân sáng, vân tối ổn định trong không gian. Hai khe hẹp S₁, S₂ hoạt động như hai nguồn kết hợp đồng pha.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">2. Khoảng vân (Fringe width)</h4>
                          <p className="mt-1.5">
                            Khoảng cách giữa hai vân sáng (hoặc hai vân tối) liên tiếp được gọi là khoảng vân i:
                            <br />
                            <code className="bg-slate-100 px-2 py-1 rounded font-mono text-slate-850 block mt-1.5">i = (λ · D) / a</code>
                            Trong đó λ là bước sóng ánh sáng, D là khoảng cách từ khe tới màn, a là khoảng cách giữa hai khe.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">3. Điều kiện để có giao thoa ánh sáng</h4>
                          <p className="mt-1.5">
                            Nguồn sáng phát ra phải là hai nguồn sáng kết hợp: có cùng tần số (cùng bước sóng) và có hiệu số pha không đổi theo thời gian. Trong thí nghiệm khe Young, ánh sáng từ một nguồn đơn sắc đi qua hai khe hẹp trở thành hai nguồn kết hợp lý tưởng.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-700 space-y-4.5 leading-relaxed">
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">1. Sóng Cơ & Phân Loại</h4>
                          <p className="mt-1.5">
                            Sóng là dao động lan truyền trong không gian theo thời gian. 
                            <br />- <strong>Sóng ngang (Transverse):</strong> Các hạt môi trường dao động vuông góc với phương truyền sóng (ví dụ: sóng trên mặt nước, sóng trên dây đàn).
                            <br />- <strong>Sóng dọc (Longitudinal):</strong> Các hạt dao động trùng với phương truyền sóng (ví dụ: sóng âm thanh truyền trong không khí, sóng lò xo dọc).
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">2. Bước Sóng & Chu Kỳ</h4>
                          <p className="mt-1.5">
                            <strong>Bước sóng (λ)</strong> là quãng đường sóng truyền đi được trong một chu kỳ dao động T. Hai phần tử cách nhau một số nguyên bước sóng thì dao động cùng pha.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">3. Giao Thoa Sóng</h4>
                          <p className="mt-1.5">
                            Khi hai sóng kết hợp (cùng tần số, cùng pha hoặc có độ lệch pha không đổi) gặp nhau, tại các điểm giao thoa sẽ xuất hiện các điểm cực đại (gặp nhau cùng pha, hỗ trợ lẫn nhau) và cực tiểu (ngược pha, triệt tiêu lẫn nhau) ổn định trong không gian.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <ChatBot
        activeExperiment={activeExperiment}
        params={
          activeExperiment === "pendulum"
            ? pendulumParams
            : activeExperiment === "spring"
            ? springParams
            : activeExperiment === "light"
            ? lightParams
            : waveParams
        }
      />
    </div>
  );
}

