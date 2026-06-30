import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Volume2, Moon, Sun, Sliders, Shield } from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import { useTheme } from "../hooks/useTheme";

const SETTINGS_KEY = "interviewprep-settings";

const DEFAULT_SETTINGS = {
  voiceEnabled: true,
  speechRate: 1.0,
  questionCount: 8,
  difficulty: "Medium",
};

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [savedStatus, setSavedStatus] = useState(false);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setSavedStatus(true);
    const timer = setTimeout(() => setSavedStatus(false), 2000);
    return () => clearTimeout(timer);
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <PageContainer>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider">
            <SettingsIcon size={13} />
            Preferences
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Application Settings
          </h1>
          <p className="mt-1 text-xs text-muted">
            Configure your AI mock interview experience, voice characteristics, and system preferences.
          </p>
        </div>
        {savedStatus && (
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-400 animate-fade-in">
            Settings Saved
          </span>
        )}
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Voice and Speech Card */}
        <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Volume2 size={16} className="text-[var(--color-accent)]" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Voice & Speech</h2>
          </div>

          {/* Voice Readback Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-foreground block">Voice Readback</label>
              <span className="text-[10px] text-faint block mt-0.5">Let the AI interviewer read questions aloud.</span>
            </div>
            <button
              onClick={() => updateSetting("voiceEnabled", !settings.voiceEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.voiceEnabled ? "bg-[var(--color-accent)]" : "bg-border"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.voiceEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Speech Rate Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-foreground">Speech Rate</label>
              <span className="text-xs font-mono font-bold text-[var(--color-accent)]">{settings.speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.5"
              step="0.1"
              value={settings.speechRate}
              disabled={!settings.voiceEnabled}
              onChange={(e) => updateSetting("speechRate", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)] disabled:opacity-40"
            />
            <div className="flex justify-between text-[9px] text-faint font-semibold">
              <span>Slower (0.8x)</span>
              <span>Normal (1.0x)</span>
              <span>Faster (1.5x)</span>
            </div>
          </div>
        </div>

        {/* Interview Configuration Card */}
        <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Sliders size={16} className="text-purple-400" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Session Configuration</h2>
          </div>

          {/* Difficulty Option */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground block">Interview Difficulty</label>
            <span className="text-[10px] text-faint block -mt-1">Sets the complexity of AI questions and follow-ups.</span>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {["Easy", "Medium", "Hard"].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => updateSetting("difficulty", lvl)}
                  className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                    settings.difficulty === lvl
                      ? "bg-purple-600/10 border-purple-500 text-purple-400"
                      : "bg-elevated border-border text-muted hover:border-faint hover:text-foreground"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-foreground">Interview Questions</label>
              <span className="text-xs font-mono font-bold text-purple-400">{settings.questionCount} Questions</span>
            </div>
            <input
              type="range"
              min="3"
              max="15"
              step="1"
              value={settings.questionCount}
              onChange={(e) => updateSetting("questionCount", parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[9px] text-faint font-semibold">
              <span>Short (3 Qs)</span>
              <span>Standard (8 Qs)</span>
              <span>Long (15 Qs)</span>
            </div>
          </div>
        </div>

        {/* System & Theme Card */}
        <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 space-y-6 md:col-span-2">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Shield size={16} className="text-emerald-400" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">System & Theme</h2>
          </div>

          {/* Theme Toggler */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-foreground block">Visual Appearance</label>
              <span className="text-[10px] text-faint block mt-0.5">Switch between dark mode and light mode interfaces.</span>
            </div>
            <button
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-elevated px-4 py-2 text-xs font-bold text-foreground hover:bg-surface-hover hover:border-faint transition-all"
            >
              {theme === "dark" ? (
                <>
                  <Moon size={14} className="text-indigo-400" />
                  Dark Mode
                </>
              ) : (
                <>
                  <Sun size={14} className="text-amber-400" />
                  Light Mode
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
