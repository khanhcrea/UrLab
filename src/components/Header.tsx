import { BookOpen, Activity, Beaker } from "lucide-react";

interface HeaderProps {
  currentTab: "home" | "lab";
  setTab: (tab: "home" | "lab") => void;
  activeExperimentTitle?: string;
}

export default function Header({ currentTab, setTab, activeExperimentTitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setTab("home")}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 shadow-md text-white shadow-blue-500/20">
            <Beaker className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900 bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
              UrLab
            </span>
            <span className="ml-1.5 hidden rounded-full bg-blue-50 px-2.5 py-1 text-sm font-semibold text-blue-600 sm:inline-block border border-blue-100">
              Interactive Lab
            </span>
          </div>
        </div>

        {/* Dynamic Context Breadcrumb if in Lab */}
        {currentTab === "lab" && activeExperimentTitle && (
          <div className="hidden md:flex items-center gap-2 text-base text-slate-500">
            <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="font-bold text-slate-800">{activeExperimentTitle}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2">
          <button
            id="nav-home-btn"
            onClick={() => setTab("home")}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-base font-bold transition-all duration-200 ${
              currentTab === "home"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <BookOpen className="h-5 w-5" />
            Trang chủ
          </button>
          
          <button
            id="nav-lab-btn"
            onClick={() => setTab("lab")}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-base font-bold transition-all duration-200 ${
              currentTab === "lab"
                ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Activity className="h-5 w-5" />
            Phòng thí nghiệm
          </button>
        </nav>
      </div>
    </header>
  );
}
