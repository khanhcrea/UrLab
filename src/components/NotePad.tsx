import React, { useState, useEffect } from "react";
import { FileSpreadsheet, Trash2, Edit3, Clipboard, Save, HelpCircle, AlertCircle } from "lucide-react";
import { SavedObservation } from "../types";

interface NotePadProps {
  experimentId: "pendulum" | "wave" | "spring" | "light";
  observations: SavedObservation[];
  setObservations: (obs: SavedObservation[]) => void;
}

export default function NotePad({ experimentId, observations, setObservations }: NotePadProps) {
  const [generalNotes, setGeneralNotes] = useState<string>("");
  const [editingObservationId, setEditingObservationId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");

  // Load general notes from local storage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem(`urlab_general_notes_${experimentId}`);
    if (savedNotes) {
      setGeneralNotes(savedNotes);
    } else {
      setGeneralNotes("");
    }
  }, [experimentId]);

  // Handle auto-save of general notes to localStorage
  const handleGeneralNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setGeneralNotes(val);
    localStorage.setItem(`urlab_general_notes_${experimentId}`, val);
  };

  const deleteObservation = (id: string) => {
    const updated = observations.filter((o) => o.id !== id);
    setObservations(updated);
    localStorage.setItem("urlab_observations", JSON.stringify(updated));
  };

  const startEditNote = (id: string, currentNotes: string) => {
    setEditingObservationId(id);
    setEditingText(currentNotes);
  };

  const saveObservationNote = (id: string) => {
    const updated = observations.map((o) => {
      if (o.id === id) {
        return { ...o, notes: editingText };
      }
      return o;
    });
    setObservations(updated);
    localStorage.setItem("urlab_observations", JSON.stringify(updated));
    setEditingObservationId(null);
  };

  const activeObservations = observations.filter((o) => o.experimentId === experimentId);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <Edit3 className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-bold text-slate-900">Sổ Tay Học Tập (Notebook)</h3>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
          Tự động lưu
        </span>
      </div>

      {/* General Notes text area */}
      <div className="space-y-2.5">
        <label htmlFor="notepad-textarea" className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
          Ghi chú & Nhận xét Tổng quan
        </label>
        <textarea
          id="notepad-textarea"
          value={generalNotes}
          onChange={handleGeneralNotesChange}
          placeholder="Hãy viết các phát hiện, giải thích câu trả lời hoặc báo cáo thí nghiệm của bạn tại đây..."
          className="w-full h-44 p-4 text-base text-slate-800 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-y placeholder:text-slate-400"
        />
      </div>

      {/* Saved Numerical Logs section */}
      <div className="space-y-4.5">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Số Liệu Đã Ghi Nhận</h4>
        </div>

        {activeObservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-sm text-slate-500">
            <AlertCircle className="h-7 w-7 text-slate-400 mb-2 animate-pulse" />
            <p className="font-bold text-slate-700 text-base">Chưa có số liệu đo lường nào được lưu.</p>
            <p className="mt-1 text-slate-500">Ấn nút "Lưu Số liệu" trên bộ giả lập để ghi nhận tham số hiện tại!</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {activeObservations.map((obs) => {
              const p = JSON.parse(obs.params);
              const r = JSON.parse(obs.results);

              return (
                <div key={obs.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm space-y-3 hover:border-slate-300 transition-colors">
                  {/* Observation Header metadata */}
                  <div className="flex justify-between items-center text-xs text-slate-500 border-b border-slate-200/60 pb-2">
                    <span className="font-medium">Thời điểm: {obs.timestamp}</span>
                    <button
                      onClick={() => deleteObservation(obs.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                      title="Xóa số liệu này"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Physical values comparison table */}
                  <div className="grid grid-cols-2 gap-x-5 gap-y-2 font-mono bg-white p-3 rounded-lg border border-slate-150 text-sm">
                    <div>
                      <span className="text-slate-500 block text-xs uppercase font-bold tracking-wider mb-1">Thông Số</span>
                      {experimentId === "pendulum" ? (
                        <div className="space-y-1 text-slate-700">
                          <div>Chiều dài (L): <strong className="text-slate-900 font-bold">{p.length}m</strong></div>
                          <div>Trọng lực (g): <strong className="text-slate-900 font-bold">{p.gravity}m/s²</strong></div>
                          <div>Khối lượng (m): <strong className="text-slate-900 font-bold">{p.mass}kg</strong></div>
                        </div>
                      ) : experimentId === "spring" ? (
                        <div className="space-y-1 text-slate-700">
                          <div>Độ cứng (k): <strong className="text-slate-900 font-bold">{p.k} N/m</strong></div>
                          <div>Khối lượng (m): <strong className="text-slate-900 font-bold">{p.mass} kg</strong></div>
                          <div>Li độ x₀: <strong className="text-slate-900 font-bold">{p.initialX} cm</strong></div>
                        </div>
                      ) : experimentId === "light" ? (
                        <div className="space-y-1 text-slate-700">
                          <div>Khe hẹp (a): <strong className="text-slate-900 font-bold">{p.a} mm</strong></div>
                          <div>Khoảng màn (D): <strong className="text-slate-900 font-bold">{p.D} m</strong></div>
                          <div>Bức xạ λ₁ / λ₂: <strong className="text-slate-900 font-bold">{p.lambda1} / {p.lambda2} nm</strong></div>
                        </div>
                      ) : (
                        <div className="space-y-1 text-slate-700">
                          <div>Tần số (f): <strong className="text-slate-900 font-bold">{p.frequency}Hz</strong></div>
                          <div>Biên độ (A): <strong className="text-slate-900 font-bold">{p.amplitude}px</strong></div>
                          <div>Tốc độ (v): <strong className="text-slate-900 font-bold">{p.speed}px/s</strong></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="border-l border-slate-150 pl-4">
                      <span className="text-slate-500 block text-xs uppercase font-bold tracking-wider mb-1">Kết Quả</span>
                      {experimentId === "pendulum" ? (
                        <div className="space-y-1 text-teal-800">
                          <div>Chu kỳ lý thuyết T: <strong className="text-teal-900 font-bold">{r.period.toFixed(3)}s</strong></div>
                          <div>Cơ năng E: <strong className="text-teal-900 font-bold">{r.maxEnergy.toFixed(3)}J</strong></div>
                          <div>Góc lệch θ_max: <strong className="text-teal-900 font-bold">{r.thetaMaxDeg}°</strong></div>
                        </div>
                      ) : experimentId === "spring" ? (
                        <div className="space-y-1 text-teal-800">
                          <div>Chu kỳ riêng T: <strong className="text-teal-900 font-bold">{r.period.toFixed(3)} s</strong></div>
                          <div>Cơ năng W: <strong className="text-teal-900 font-bold">{r.maxEnergy.toFixed(4)} J</strong></div>
                          <div>Tần số riêng f: <strong className="text-teal-900 font-bold">{r.frequency.toFixed(3)} Hz</strong></div>
                        </div>
                      ) : experimentId === "light" ? (
                        <div className="space-y-1 text-teal-800">
                          <div>Khoảng vân i₁: <strong className="text-teal-900 font-bold">{r.fringeWidth1 ? `${r.fringeWidth1.toFixed(3)} mm` : "N/A"}</strong></div>
                          <div>Khoảng vân i₂: <strong className="text-teal-900 font-bold">{r.fringeWidth2 ? `${r.fringeWidth2.toFixed(3)} mm` : "N/A"}</strong></div>
                          <div className="truncate max-w-[180px] font-bold text-indigo-700">{r.overlapType}</div>
                        </div>
                      ) : (
                        <div className="space-y-1 text-teal-800">
                          <div>Tần số f: <strong className="text-teal-900 font-bold">{r.frequency}Hz</strong></div>
                          <div>Bước sóng λ: <strong className="text-teal-900 font-bold">{r.wavelength}</strong></div>
                          <div>Tốc độ v: <strong className="text-teal-900 font-bold">{r.speed}px/s</strong></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Individual Note edit/view for this record */}
                  <div className="space-y-2">
                    {editingObservationId === obs.id ? (
                      <div className="flex gap-2.5">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          placeholder="Viết nhận xét nhanh cho phép đo này..."
                          className="flex-1 px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                        <button
                          onClick={() => saveObservationNote(obs.id)}
                          className="px-3.5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-bold text-sm flex items-center gap-1"
                        >
                          <Save className="h-4 w-4" /> Lưu
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start gap-3 bg-white p-2.5 rounded-lg border border-slate-150">
                        <div className="flex-1 text-slate-600">
                          <span className="text-[10px] uppercase font-bold tracking-wide text-slate-450 block">Nhận xét riêng</span>
                          <p className="italic text-slate-800 text-sm mt-1">
                            {obs.notes || "Nhấp bút chì bên phải để ghi nhận xét cho dòng số liệu này..."}
                          </p>
                        </div>
                        <button
                          onClick={() => startEditNote(obs.id, obs.notes)}
                          className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                          title="Sửa nhận xét"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
