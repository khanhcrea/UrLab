import { Activity, Beaker, BrainCircuit, FileSpreadsheet, Waves, Compass, Sparkles } from "lucide-react";

interface HomeViewProps {
  onEnterLab: (experimentId: string) => void;
}

export default function HomeView({ onEnterLab }: HomeViewProps) {
  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white py-16 sm:py-24 border-b border-slate-150">
        <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-slate-50 ring-1 ring-slate-100" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left text column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/50 px-3 py-1 text-sm font-semibold text-blue-700">
                <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
                Vật Lý 11: Học qua Trải nghiệm Trực quan
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]">
                Khám phá thế giới vật lý với{" "}
                <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                  UrLab
                </span>
              </h1>
              <p className="text-lg text-slate-650 leading-relaxed max-w-2xl">
                Bạn thấy các chương Dao động và Sóng quá trừu tượng và khó hiểu? 
                Hãy tự tay điều chỉnh biến số, quan sát quỹ đạo trực quan trong thời gian thực, 
                và trò chuyện cùng Gia sư AI thông minh để hiểu cặn kẽ mọi công thức!
              </p>
              
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 pt-4">
                <button
                  id="hero-enter-pendulum"
                  onClick={() => onEnterLab("pendulum")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-base font-bold text-white shadow-lg hover:bg-blue-700 shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Beaker className="h-5 w-5" />
                  Vào Lab: Con Lắc Đơn
                </button>
                <button
                  id="hero-enter-spring"
                  onClick={() => onEnterLab("spring")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-4 text-base font-bold text-white shadow-lg hover:bg-teal-700 shadow-teal-500/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Activity className="h-5 w-5" />
                  Vào Lab: Con Lắc Lò Xo
                </button>
                <button
                  id="hero-enter-wave"
                  onClick={() => onEnterLab("wave")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-6 py-4 text-base font-bold text-slate-700 hover:bg-slate-200 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Waves className="h-5 w-5 text-blue-500" />
                  Mô phỏng Giao Thoa Sóng
                </button>
                <button
                  id="hero-enter-light"
                  onClick={() => onEnterLab("light")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-50 border border-indigo-250 px-6 py-4 text-base font-bold text-indigo-700 hover:bg-indigo-100 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Sparkles className="h-5 w-5 text-indigo-550" />
                  Giao Thoa Ánh Sáng
                </button>
              </div>
            </div>

            {/* Right illustration / interactive simulator snippet preview card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-850 rounded-2xl p-6 shadow-2xl border border-slate-800 text-white overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl" />
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-xs font-mono text-slate-500">Mô phỏng Dao Động v1.0</span>
                </div>

                {/* Simulated Pendulum Loop Sketch */}
                <div className="relative h-48 flex items-center justify-center bg-slate-950 rounded-xl border border-slate-800/80">
                  <div className="absolute top-4 h-1.5 w-12 bg-slate-750 rounded" />
                  <div className="absolute top-4 flex flex-col items-center origin-top rotate-[25deg] animate-pulse">
                    <div className="h-28 w-0.5 bg-slate-400" />
                    <div className="h-6 w-6 rounded-full bg-teal-400 shadow-lg shadow-teal-400/50 -mt-1" />
                  </div>
                  {/* Faded trail */}
                  <div className="absolute top-4 flex flex-col items-center origin-top rotate-[-25deg] opacity-20">
                    <div className="h-28 w-0.5 bg-slate-400" />
                    <div className="h-6 w-6 rounded-full bg-teal-400 -mt-1" />
                  </div>
                  <div className="absolute bottom-2 flex gap-4 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-full">
                    <span>L = 1.5m</span>
                    <span>g = 9.8m/s²</span>
                    <span>T = 2.46s</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-450">
                    <span>Động năng (E_k)</span>
                    <span className="text-teal-450 font-mono">65%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-400 rounded-full" style={{ width: "65%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Phương pháp học tập 4 trong 1
            </h2>
            <p className="text-slate-600">
              UrLab tích hợp toàn bộ công cụ cần thiết để học sinh tự làm chủ kiến thức, 
              giúp biến lý thuyết khó hiểu thành trực giác vật lý sâu sắc.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition duration-200 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Compass className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Mô phỏng Tương tác</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tự do thay đổi độ dài dây, khối lượng, trọng lực g để trực tiếp kiểm chứng sự thay đổi của chu kỳ T và năng lượng động/thế năng.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition duration-200 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Đồ thị & Vector Động</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Hiển thị thời gian thực các vector vận tốc, gia tốc, lực căng dây và biểu đồ tròn biểu thị bảo toàn cơ năng của con lắc.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition duration-200 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Sổ tay Ghi chép Số</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Ghi chép các kết quả đo lường, rút ra nhận xét riêng và lưu trữ lâu dài vào trình duyệt của bạn (LocalStorage) để nộp bài hoặc ôn tập.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition duration-200 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Gia sư Vật lý AI</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Hỏi đáp trực tiếp với Tutor AI thông minh 24/7. Nhận lời giải thích dễ hiểu nhất bằng tiếng Việt kèm các hình vẽ minh họa cụ thể.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Select Experiment Segment */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-10 text-center sm:text-left">
            Chọn Bài Thí Nghiệm
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
            {/* Experiment Card 1 */}
            <div className="flex flex-col justify-between bg-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-10 hover:border-blue-400 hover:shadow-xl transition-all group">
              <div className="space-y-5">
                <span className="inline-flex rounded-full bg-blue-100 px-4 py-1.5 text-sm font-bold text-blue-800">
                  Chương 1: Dao Động Cơ
                </span>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                  Bài 1: Con Lắc Đơn (Simple Pendulum)
                </h3>
                <p className="text-base text-slate-700 leading-relaxed">
                  Trải nghiệm đo chu kỳ dao động tự do của con lắc đơn. Khảo sát sự phụ thuộc của chu kỳ T vào chiều dài dây l và gia tốc trọng trường g. Kiểm chứng định luật bảo toàn cơ năng qua biểu đồ động.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-200/60">
                <button
                  id="card-enter-pendulum"
                  onClick={() => onEnterLab("pendulum")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-bold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Bắt đầu Thí nghiệm Pendulum
                </button>
              </div>
            </div>

            {/* Experiment Card 2 */}
            <div className="flex flex-col justify-between bg-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-10 hover:border-indigo-400 hover:shadow-xl transition-all group">
              <div className="space-y-5">
                <span className="inline-flex rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-bold text-indigo-850">
                  Chương 1: Dao Động Điều Hòa
                </span>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Bài 2: Con Lắc Lò Xo (Spring-Mass)
                </h3>
                <p className="text-base text-slate-700 leading-relaxed">
                  Khảo sát dao động điều hòa tiêu biểu của con lắc lò xo treo thẳng đứng. Nghiên cứu ảnh hưởng của độ cứng lò xo k, khối lượng m và lực cản môi trường lên chu kỳ T và tần số dao động.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-200/60">
                <button
                  id="card-enter-spring"
                  onClick={() => onEnterLab("spring")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-bold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Bắt đầu Thí nghiệm Spring
                </button>
              </div>
            </div>

            {/* Experiment Card 3 */}
            <div className="flex flex-col justify-between bg-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-10 hover:border-teal-400 hover:shadow-xl transition-all group">
              <div className="space-y-5">
                <span className="inline-flex rounded-full bg-teal-100 px-4 py-1.5 text-sm font-bold text-teal-850">
                  Chương 2: Sóng Cơ & Sóng Ánh Sáng
                </span>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-teal-600 transition-colors">
                  Bài 3: Giao Thoa Sóng & Sóng Truyền (Wave Simulator)
                </h3>
                <p className="text-base text-slate-700 leading-relaxed">
                  Khảo sát tính chất sóng cơ học hoặc sóng ánh sáng truyền đi trong không gian. Tùy chỉnh tần số, bước sóng và quan sát hiện tượng giao thoa giữa 2 nguồn sóng kết hợp. Giúp hiểu rõ bước sóng và độ lệch pha.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-200/60">
                <button
                  id="card-enter-wave"
                  onClick={() => onEnterLab("wave")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3.5 text-base font-bold text-white hover:bg-teal-700 transition-colors cursor-pointer"
                >
                  Bắt đầu Thí nghiệm Waves
                </button>
              </div>
            </div>

            {/* Experiment Card 4 */}
            <div className="flex flex-col justify-between bg-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-10 hover:border-violet-400 hover:shadow-xl transition-all group">
              <div className="space-y-5">
                <span className="inline-flex rounded-full bg-violet-100 px-4 py-1.5 text-sm font-bold text-violet-850">
                  Chương 2: Sóng Cơ & Sóng Ánh Sáng
                </span>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-violet-600 transition-colors">
                  Bài 4: Giao Thoa Ánh Sáng (Double-Slit Interference)
                </h3>
                <p className="text-base text-slate-700 leading-relaxed">
                  Khảo sát hiện tượng giao thoa ánh sáng qua khe hẹp Young. Tùy chỉnh hai chùm bức xạ với các bước sóng λ₁ và λ₂ khác nhau, thay đổi khoảng cách khe a, khoảng cách màn D để quan sát hệ vân xen kẽ và sự trùng nhau của các vân sáng.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-200/60">
                <button
                  id="card-enter-light"
                  onClick={() => onEnterLab("light")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-base font-bold text-white hover:bg-violet-700 transition-colors cursor-pointer"
                >
                  Bắt đầu Thí nghiệm Ánh Sáng
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-350 py-10 border-t border-slate-850 text-center text-sm space-y-2">
        <p>© 2026 UrLab. Được thiết kế dành cho học sinh THPT học môn Vật Lý lớp 11.</p>
        <p className="text-slate-400">Môi trường thử nghiệm tương tác an toàn & trực quan.</p>
      </footer>
    </div>
  );
}
