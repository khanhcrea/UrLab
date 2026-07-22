import { useState, useEffect } from "react";
import Header from "./components/Header";
import HomeView from "./components/HomeView";
import PendulumCanvas from "./components/PendulumCanvas";
import SpringCanvas from "./components/SpringCanvas";
import WaveCanvas from "./components/WaveCanvas";
import LightInterferenceCanvas from "./components/LightInterferenceCanvas";
import FormulaBox, { Latex } from "./components/FormulaBox";
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
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Lý thuyết SGK Vật lí 11</h3>
                        <p className="text-xs text-slate-500">Bộ sách: Kết nối tri thức với cuộc sống</p>
                      </div>
                    </div>

                    {activeExperiment === "pendulum" ? (
                      <div className="text-sm text-slate-700 space-y-4.5 leading-relaxed">
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">1. Dao động cơ & Dao động điều hòa</h4>
                          <ul className="list-disc list-inside mt-1.5 space-y-1">
                            <li><strong>Dao động cơ:</strong> Vật chuyển động qua lại quanh vị trí cân bằng.</li>
                            <li><strong>Dao động tuần hoàn:</strong> Sau những khoảng thời gian bằng nhau, vật trở lại vị trí cũ theo hướng cũ.</li>
                            <li><strong>Dao động điều hòa:</strong> Dao động tuần hoàn đơn giản nhất, được mô tả bằng phương trình:
                              <span className="inline-block bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 ml-1">
                                <Latex math="x = A \cos(\omega t + \varphi)" />
                              </span> hoặc <span className="inline-block bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 ml-1">
                                <Latex math="s = s_0 \cos(\omega t + \varphi)" />
                              </span>.
                            </li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">2. Chu kì riêng & Tần số góc</h4>
                          <p className="mt-1.5">
                            Với góc lệch nhỏ (biên độ góc <Latex math="\alpha_0 \le 10^\circ" />), con lắc đơn dao động điều hòa với tần số góc riêng và chu kì:
                          </p>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 font-mono text-slate-850 mt-1.5 space-y-1">
                            <div className="flex items-center gap-1.5">Tần số góc: <Latex math="\omega = \sqrt{\frac{g}{\ell}}" /> (rad/s)</div>
                            <div className="flex items-center gap-1.5">Chu kì: <Latex math="T = 2\pi\sqrt{\frac{\ell}{g}}" /> (s)</div>
                          </div>
                          <p className="text-xs text-slate-500 mt-1.5 italic">
                            *Chu kì của con lắc đơn lúc này gần như không phụ thuộc vào biên độ dao động và khối lượng m của vật nặng.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">3. Động năng & Thế năng trọng trường</h4>
                          <p className="mt-1.5">Chọn mốc thế năng ở vị trí cân bằng, tại li độ góc <Latex math="\alpha" /> (hoặc li độ dài <Latex math="s" />):</p>
                          <ul className="list-disc list-inside mt-1.5 space-y-1">
                            <li><strong>Thế năng trọng trường:</strong>
                              <br />
                              <div className="bg-slate-100 px-2 py-1 rounded text-slate-850 inline-block mt-1">
                                <Latex math="W_{\text{t}} = mg\ell(1 - \cos \alpha) \approx \frac{1}{2} m \frac{g}{\ell} s^2 = \frac{1}{2} m \omega^2 s^2" />
                              </div>
                            </li>
                            <li><strong>Động năng:</strong>
                              <br />
                              <div className="bg-slate-100 px-2 py-1 rounded text-slate-850 inline-block mt-1">
                                <Latex math="W_{\text{đ}} = \frac{1}{2} m v^2 = \frac{1}{2} m \omega^2 s_0^2 \sin^2(\omega t + \varphi)" />
                              </div>
                            </li>
                            <li><strong>Cơ năng:</strong> Tổng động năng và thế năng được bảo toàn (nếu bỏ qua ma sát):
                              <br />
                              <div className="bg-slate-100 px-2 py-1 rounded text-slate-850 inline-block mt-1">
                                <Latex math="W = W_{\text{đ}} + W_{\text{t}} = \frac{1}{2} m \omega^2 s_0^2 = \text{hằng số}" />
                              </div>
                            </li>
                          </ul>
                          <p className="mt-2 text-xs text-slate-500">
                            Trong quá trình dao động, có sự chuyển hóa qua lại giữa động năng và thế năng của vật, khi động năng tăng thì thế năng giảm và ngược lại.
                          </p>
                        </div>
                      </div>
                    ) : activeExperiment === "spring" ? (
                      <div className="text-sm text-slate-700 space-y-4.5 leading-relaxed">
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">1. Cấu tạo con lắc lò xo</h4>
                          <p className="mt-1.5">
                            Gồm một vật nặng có khối lượng <Latex math="m" /> gắn vào đầu một lò xo có độ cứng <Latex math="k" /> và khối lượng không đáng kể. Chọn mốc thế năng ở vị trí cân bằng.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">2. Tần số góc và Chu kỳ riêng</h4>
                          <p className="mt-1.5">
                            Khi không có lực cản ma sát, con lắc dao động điều hòa quanh vị trí cân bằng với tần số góc và chu kỳ riêng:
                          </p>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 font-mono text-slate-850 mt-1.5 space-y-1">
                            <div className="flex items-center gap-1.5">Tần số góc: <Latex math="\omega = \sqrt{\frac{k}{m}}" /> (rad/s)</div>
                            <div className="flex items-center gap-1.5">Chu kỳ: <Latex math="T = 2\pi\sqrt{\frac{m}{k}}" /> (s)</div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">3. Động năng & Thế năng đàn hồi</h4>
                          <ul className="list-disc list-inside mt-1.5 space-y-2">
                            <li><strong>Thế năng đàn hồi:</strong> Thế năng của con lắc lò xo khi bị biến dạng (chọn mốc ở vị trí cân bằng):
                              <br />
                              <div className="bg-slate-100 px-2 py-1 rounded text-slate-850 inline-block mt-1">
                                <Latex math="W_{\text{t}} = \frac{1}{2} k x^2" />
                              </div>
                            </li>
                            <li><strong>Động năng:</strong> Động năng của vật nặng <Latex math="m" /> chuyển động:
                              <br />
                              <div className="bg-slate-100 px-2 py-1 rounded text-slate-850 inline-block mt-1">
                                <Latex math="W_{\text{đ}} = \frac{1}{2} m v^2 = \frac{1}{2} m \omega^2 (A^2 - x^2)" />
                              </div>
                            </li>
                            <li><strong>Bảo toàn cơ năng:</strong> Khi bỏ qua ma sát, cơ năng của con lắc lò xo được bảo toàn:
                              <br />
                              <div className="bg-slate-100 px-2 py-1 rounded text-slate-850 inline-block mt-1">
                                <Latex math="W = W_{\text{đ}} + W_{\text{t}} = \frac{1}{2} m v^2 + \frac{1}{2} k x^2 = \frac{1}{2} k A^2 = \text{hằng số}" />
                              </div>
                            </li>
                          </ul>
                          <p className="mt-2 text-xs text-slate-500">
                            Khi vật đi từ vị trí cân bằng ra biên, động năng từ cực đại giảm về 0, thế năng từ 0 tăng lên cực đại. Khi đi từ biên về vị trí cân bằng, thế năng giảm về 0 và động năng tăng lên cực đại.
                          </p>
                        </div>
                      </div>
                    ) : activeExperiment === "light" ? (
                      <div className="text-sm text-slate-700 space-y-4.5 leading-relaxed">
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">1. Thí nghiệm Young (Y-âng) về giao thoa ánh sáng</h4>
                          <p className="mt-1.5">
                            Trong vùng hai chùm sáng gặp nhau lại có những vạch tối và vạch sáng xen kẽ nhau đã khẳng định ánh sáng có tính chất sóng.
                          </p>
                          <ul className="list-disc list-inside mt-1.5 space-y-1">
                            <li><strong>Vạch sáng:</strong> Là chỗ hai sóng ánh sáng gặp nhau đồng pha, tăng cường lẫn nhau.</li>
                            <li><strong>Vạch tối:</strong> Là chỗ hai sóng ánh sáng gặp nhau ngược pha, triệt tiêu lẫn nhau.</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">2. Công thức xác định vị trí vân & bước sóng</h4>
                          <p className="mt-1.5">• <strong>Vị trí vân sáng:</strong> <Latex math="x_{\text{sáng}} = k \cdot i = k \frac{\lambda D}{a} \quad (k \in \mathbb{Z})" /></p>
                          <p className="mt-1">• <strong>Vị trí vân tối:</strong> <Latex math="x_{\text{tối}} = \left(k + \frac{1}{2}\right) i = \left(k + \frac{1}{2}\right) \frac{\lambda D}{a} \quad (k \in \mathbb{Z})" /></p>
                          <p className="mt-1.5">
                            Nếu đo được các đại lượng <Latex math="a" />, <Latex math="D" /> và khoảng vân <Latex math="i" />, ta xác định bước sóng <Latex math="\lambda" /> theo công thức:
                          </p>
                          <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-slate-850 my-2 text-center font-bold">
                            <Latex math="\lambda = \frac{i \cdot a}{D}" block />
                          </div>
                          <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                            Trong đó: <Latex math="a" /> là khoảng cách giữa hai khe (<Latex math="F_1 F_2" />); <Latex math="D" /> là khoảng cách từ hai khe đến màn quan sát; <Latex math="i" /> là khoảng vân (khoảng cách giữa hai vân sáng hoặc hai vân tối liên tiếp).
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">3. Điều kiện để xảy ra giao thoa</h4>
                          <p className="mt-1.5">
                            Hai nguồn sóng phải là hai nguồn kết hợp: dao động cùng phương, cùng tần số và có độ lệch pha không đổi theo thời gian. Hiện tượng giao thoa là hiện tượng đặc trưng của sóng.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-700 space-y-4.5 leading-relaxed">
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">1. Sóng cơ & Phân loại</h4>
                          <p className="mt-1.5"><strong>Sóng cơ:</strong> Là những biến dạng cơ lan truyền trong một môi trường đàn hồi. Sóng mang năng lượng đi xa mà không mang các phần tử vật chất đi cùng (các phần tử chỉ dao động tại chỗ quanh vị trí cân bằng).</p>
                          <ul className="list-disc list-inside mt-1.5 space-y-1">
                            <li><strong>Sóng ngang:</strong> Sóng trong đó các phần tử của môi trường dao động theo phương vuông góc với phương truyền sóng (ví dụ: sóng trên mặt nước, sóng trên dây đàn).</li>
                            <li><strong>Sóng dọc:</strong> Sóng trong đó các phần tử của môi trường dao động theo phương trùng với phương truyền sóng (ví dụ: sóng âm truyền trong không khí, sóng trên lò xo dọc).</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">2. Các đại lượng đặc trưng của sóng</h4>
                          <ul className="list-disc list-inside mt-1.5 space-y-1">
                            <li><strong>Biên độ sóng (<Latex math="A" />):</strong> Độ lệch lớn nhất của phần tử sóng khỏi vị trí cân bằng. Biên độ sóng bằng biên độ dao động của nguồn sóng.</li>
                            <li><strong>Chu kì sóng (<Latex math="T" />):</strong> Khoảng thời gian để hai ngọn sóng liên tiếp chạy qua một điểm đang xét. Chu kì của sóng bằng chu kì dao động của nguồn sóng.</li>
                            <li><strong>Tần số sóng (<Latex math="f = 1/T" />):</strong> Số các ngọn sóng đi qua một điểm đang xét trong một đơn vị thời gian. Tần số sóng bằng tần số dao động của nguồn sóng.</li>
                            <li><strong>Tốc độ truyền sóng (<Latex math="v" />):</strong> Tốc độ lan truyền biến dạng (chỉ phụ thuộc vào tính chất của môi trường truyền sóng).</li>
                            <li><strong>Bước sóng (<Latex math="\lambda" />):</strong> Khoảng cách giữa hai ngọn sóng liên tiếp. Bước sóng bằng quãng đường mà sóng truyền đi được trong một chu kì:
                              <br />
                              <div className="bg-slate-100 px-2 py-1 rounded text-slate-850 inline-block mt-1">
                                <Latex math="\lambda = v T = \frac{v}{f}" />
                              </div>
                            </li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">3. Giao thoa sóng & Sóng dừng</h4>
                          <p className="mt-1.5"><strong>Giao thoa sóng:</strong> Hiện tượng hai sóng kết hợp gặp nhau tạo nên các gợn sóng ổn định. Trong đó:</p>
                          <ul className="list-disc list-inside mt-1.5 space-y-1">
                            <li>Những điểm tại đó hai sóng gặp nhau đồng pha thì dao động mạnh (cực đại).</li>
                            <li>Những điểm tại đó hai sóng gặp nhau ngược pha thì đứng yên (cực tiểu).</li>
                          </ul>
                          <p className="mt-2.5"><strong>Sóng dừng:</strong> Sóng tổng hợp tạo thành khi hai sóng cùng biên độ, cùng tần số lan truyền theo hai hướng ngược nhau giao thoa với nhau. Gồm có:</p>
                          <ul className="list-disc list-inside mt-1.5 space-y-1">
                            <li><strong>Nút sóng:</strong> Những điểm luôn đứng yên.</li>
                            <li><strong>Bụng sóng:</strong> Những điểm luôn dao động với biên độ cực đại.</li>
                            <li>Hai nút liên tiếp cách nhau <div className="inline-block bg-slate-100 px-1 py-0.2 rounded font-mono text-slate-850"><Latex math="\lambda / 2" /></div>, xen giữa chúng là một bụng sóng.</li>
                          </ul>
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
