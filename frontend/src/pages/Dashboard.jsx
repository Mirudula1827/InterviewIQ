import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle,
  Calendar,
  Clock,
  Trophy,
  Award,
  TrendingUp,
  Sparkles,
  ChevronRight,
  AlertCircle,
  ArrowRight,
  Loader2,
  FileText
} from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import ReportDetailModal from "../components/layout/ReportDetailModal";
import { interviewHistoryService } from "../services/interviewHistory";

export default function Dashboard() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = interviewHistoryService.subscribe((data) => {
      if (data !== null) {
        setInterviews(data);
        setLoading(false);
      }
    });

    interviewHistoryService.getHistory().catch((err) => {
      console.error("Error fetching completed interviews:", err);
      setError("Failed to load dashboard data. Please try again later.");
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      await interviewHistoryService.getHistory(true);
    } catch (err) {
      console.error("Error fetching completed interviews:", err);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReport = (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleCloseReport = () => {
    setSelectedReport(null);
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center gap-3 py-32">
          <Loader2 size={32} className="animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-muted">Loading your performance dashboard…</p>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <AlertCircle size={36} className="text-red-400" />
          <p className="text-sm text-foreground font-medium">{error}</p>
          <button
            onClick={fetchInterviews}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-500 transition-colors font-medium"
          >
            Retry Loading
          </button>
        </div>
      </PageContainer>
    );
  }

  // --- No Interviews: Render Empty State ---
  if (interviews.length === 0) {
    return (
      <PageContainer>
        <header className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider">
            <Sparkles size={13} />
            Overview
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Interview Dashboard
          </h1>
        </header>

        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center rounded-xl border border-border bg-surface p-8 max-w-2xl mx-auto my-10">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-elevated">
            <Award size={26} className="text-[var(--color-accent)] animate-pulse" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground text-balance">
            Start Your Interview Prep Journey
          </h2>
          <p className="mt-2.5 max-w-sm text-xs leading-relaxed text-muted text-pretty">
            You haven't completed any mock interviews yet. Upload your resume and target job description to get tailored questions and detailed AI evaluation!
          </p>
          <button
            onClick={() => navigate("/new-interview")}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/10 transition-all hover:scale-[1.02]"
          >
            <PlusCircle size={15} />
            Start First Interview
          </button>
        </div>
      </PageContainer>
    );
  }

  // --- Compute Summary Stats ---
  const totalInterviews = interviews.length;
  
  const totalScoreSum = interviews.reduce((sum, item) => sum + (item.overall_score || 0), 0);
  const averageScore = totalInterviews > 0 ? (totalScoreSum / totalInterviews) : 0;
  
  const bestScore = interviews.reduce((max, item) => Math.max(max, item.overall_score || 0), 0);
  
  const totalPracticeTimeSeconds = interviews.reduce((sum, item) => sum + (item.practice_time || 0), 0);
  
  const lastInterviewDate = interviews[0]?.date ? new Date(interviews[0].date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }) : "N/A";

  // Format total practice time
  const formatPracticeTime = (secs) => {
    const mins = Math.round(secs / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
  };

  // --- Prepare Chart Data ---
  // 1. Average Score Trend (Chronological order)
  const chronologicalInterviews = [...interviews].reverse();
  
  // 2. Count by Date
  const countsByDate = {};
  chronologicalInterviews.forEach(item => {
    if (item.date) {
      const dateStr = new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
    }
  });
  const dateCountsList = Object.entries(countsByDate).map(([date, count]) => ({ date, count }));

  // 3. Technical vs Communication Score for last 5 interviews
  const last5Interviews = chronologicalInterviews.slice(-5);

  return (
    <PageContainer>
      {/* Header section with CTA */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider">
            <Sparkles size={13} />
            Analytics
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Interview Dashboard
          </h1>
          <p className="mt-1 text-xs text-muted">
            Track your performance, analyze metric trends, and review detailed recruiter feedback.
          </p>
        </div>
        <button
          onClick={() => navigate("/new-interview")}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/10 transition-all hover:scale-[1.01] shrink-0"
        >
          <PlusCircle size={15} />
          Start New Interview
        </button>
      </header>

      {/* Summary Cards */}
      <section className="grid gap-4 grid-cols-2 md:grid-cols-6 mb-8">
        <div className="rounded-xl border border-border bg-surface p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Interviews</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-foreground">{totalInterviews}</span>
            <span className="text-xs text-faint">completed</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Average Score</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-indigo-400">
              {Math.round(averageScore * 10)}%
            </span>
            <span className="text-xs text-faint">({averageScore.toFixed(1)}/10)</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Best Score</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-green-400">
              {Math.round(bestScore * 10)}%
            </span>
            <span className="text-xs text-faint">({bestScore.toFixed(1)}/10)</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Practice Time</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-foreground">
              {formatPracticeTime(totalPracticeTimeSeconds)}
            </span>
            <span className="text-xs text-faint">total duration</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Last Interview</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-[13px] font-bold text-foreground truncate max-w-full">
              {lastInterviewDate}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 col-span-2 md:col-span-1 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Latest Recommendation</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`text-[12px] font-black truncate max-w-full ${
              interviews[0]?.hiring_recommendation?.toLowerCase().includes("no hire")
                ? "text-red-400"
                : interviews[0]?.hiring_recommendation?.toLowerCase().includes("lean no")
                  ? "text-red-400"
                  : interviews[0]?.hiring_recommendation?.toLowerCase().includes("borderline")
                    ? "text-yellow-400"
                    : interviews[0]?.hiring_recommendation?.toLowerCase().includes("hire")
                      ? "text-green-400"
                      : "text-foreground"
            }`}>
              {interviews[0]?.hiring_recommendation ? interviews[0].hiring_recommendation.split("—")[0].trim() : "N/A"}
            </span>
          </div>
        </div>
      </section>

      {/* Analytics Charts */}
      <section className="grid gap-6 md:grid-cols-3 mb-8">
        {/* Average Score Trend */}
        <div className="rounded-xl border border-border bg-surface p-5 flex flex-col h-[280px]">
          <div className="flex items-center gap-1.5 mb-4">
            <TrendingUp size={14} className="text-indigo-400" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Average Score Trend</h3>
          </div>
          <div className="flex-1 w-full relative">
            {chronologicalInterviews.length > 0 ? (
              <ScoreTrendChart data={chronologicalInterviews} />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-faint">No trend data available</div>
            )}
          </div>
        </div>

        {/* Interviews Count By Date */}
        <div className="rounded-xl border border-border bg-surface p-5 flex flex-col h-[280px]">
          <div className="flex items-center gap-1.5 mb-4">
            <Calendar size={14} className="text-purple-400" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Practice Count by Date</h3>
          </div>
          <div className="flex-1 w-full relative">
            {dateCountsList.length > 0 ? (
              <CountByDateChart data={dateCountsList} />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-faint">No data available</div>
            )}
          </div>
        </div>

        {/* Tech vs Comm Score Comparison */}
        <div className="rounded-xl border border-border bg-surface p-5 flex flex-col h-[280px]">
          <div className="flex items-center gap-1.5 mb-4">
            <Trophy size={14} className="text-yellow-400" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Technical vs Comm Score</h3>
          </div>
          <div className="flex-1 w-full relative">
            {last5Interviews.length > 0 ? (
              <TechVsCommChart data={last5Interviews} />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-faint">No evaluation metrics available</div>
            )}
          </div>
        </div>
      </section>

      {/* Recent Interviews */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-[var(--color-accent)]" />
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wide">Recent Interviews</h2>
          </div>
          <button 
            onClick={() => navigate("/reports")}
            className="text-xs font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors flex items-center gap-0.5"
          >
            View All Reports
            <ChevronRight size={13} />
          </button>
        </div>

        <div className="overflow-x-auto -mx-5 sm:mx-0">
          <div className="inline-block min-w-full align-middle px-5 sm:px-0">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="py-3 text-left text-[10px] font-bold text-muted uppercase tracking-wider">Job Role / Description</th>
                  <th className="py-3 text-left text-[10px] font-bold text-muted uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="py-3 text-left text-[10px] font-bold text-muted uppercase tracking-wider">Score</th>
                  <th className="py-3 text-left text-[10px] font-bold text-muted uppercase tracking-wider hidden md:table-cell">Recommendation</th>
                  <th className="py-3 text-right text-[10px] font-bold text-muted uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {interviews.slice(0, 5).map((item) => {
                  const scorePct = Math.round((item.overall_score || 0) * 10);
                  const scoreColor =
                    item.overall_score >= 8
                      ? "text-green-400 bg-green-500/5 border-green-500/10"
                      : item.overall_score >= 5
                        ? "text-yellow-400 bg-yellow-500/5 border-yellow-500/10"
                        : "text-red-400 bg-red-500/5 border-red-500/10";
                  
                  return (
                    <tr 
                      key={item.session_id} 
                      className="group hover:bg-surface-hover/40 transition-colors cursor-pointer"
                      onClick={() => handleOpenReport(item)}
                    >
                      <td className="py-3.5 pr-4 text-xs font-semibold text-foreground truncate max-w-[12rem] sm:max-w-xs">
                        {item.role || "AI Mock Interview"}
                      </td>
                      <td className="py-3.5 text-xs text-muted hidden sm:table-cell">
                        {item.date ? new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A"}
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${scoreColor}`}>
                          {scorePct}%
                        </span>
                      </td>
                      <td className="py-3.5 text-xs text-muted hidden md:table-cell truncate max-w-xs">
                        {item.hiring_recommendation ? item.hiring_recommendation.split("—")[0].trim() : "N/A"}
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenReport(item);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-all group-hover:translate-x-0.5 duration-200"
                        >
                          View Report
                          <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Detailed Report Modal */}
      <ReportDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseReport}
        report={selectedReport}
      />
    </PageContainer>
  );
}

// ── SVG Chart Helpers ────────────────────────────────────────────────────────

// 1. Line Chart for Score Trend
function ScoreTrendChart({ data }) {
  const width = 500;
  const height = 180;
  const paddingLeft = 30;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const n = data.length;

  // Calculate coordinates
  const points = data.map((item, i) => {
    const x = n > 1 
      ? paddingLeft + i * (chartWidth / (n - 1)) 
      : paddingLeft + chartWidth / 2;
    const score = item.overall_score || 0;
    // Map score (0 - 10) to Y space (0 - chartHeight)
    const y = paddingTop + (chartHeight - (score / 10) * chartHeight);
    return { x, y, score, label: new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) };
  });

  // Create path strings
  let pathD = "";
  let areaD = "";
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    areaD = `M ${points[0].x} ${paddingTop + chartHeight} L ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
      areaD += ` L ${points[i].x} ${points[i].y}`;
    }
    
    areaD += ` L ${points[points.length - 1].x} ${paddingTop + chartHeight} Z`;
  }

  // Grid levels (Score 2, 4, 6, 8, 10)
  const gridScores = [2, 4, 6, 8, 10];
  const gridLines = gridScores.map(score => {
    const y = paddingTop + (chartHeight - (score / 10) * chartHeight);
    return { y, label: score };
  });

  return (
    <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="score-line-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <linearGradient id="score-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.00" />
        </linearGradient>
      </defs>

      {/* Grid Lines & Y Axis Labels */}
      {gridLines.map((line, idx) => (
        <g key={idx} className="opacity-30">
          <line
            x1={paddingLeft}
            y1={line.y}
            x2={width - paddingRight}
            y2={line.y}
            stroke="var(--color-border)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text
            x={paddingLeft - 8}
            y={line.y + 4}
            textAnchor="end"
            fontSize="9"
            fill="var(--color-muted)"
            fontWeight="bold"
          >
            {line.label}
          </text>
        </g>
      ))}

      {/* Area Under Path */}
      {points.length > 1 && <path d={areaD} fill="url(#score-area-grad)" />}

      {/* Line Path */}
      {points.length > 1 && (
        <path
          d={pathD}
          fill="none"
          stroke="url(#score-line-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Points and Tooltips */}
      {points.map((pt, idx) => (
        <g key={idx} className="group/dot cursor-pointer">
          <circle
            cx={pt.x}
            cy={pt.y}
            r="4.5"
            fill="var(--color-background)"
            stroke="#818cf8"
            strokeWidth="2.5"
            className="transition-all duration-250 hover:r-6 hover:stroke-purple-400"
          />
          {/* Label under point (only if space permits or for key points) */}
          {(points.length < 8 || idx % 2 === 0 || idx === points.length - 1) && (
            <text
              x={pt.x}
              y={height - 5}
              textAnchor="middle"
              fontSize="8.5"
              fill="var(--color-faint)"
              fontWeight="medium"
            >
              {pt.label}
            </text>
          )}
          {/* Hover Score Label */}
          <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200">
            <rect
              x={pt.x - 18}
              y={pt.y - 25}
              width="36"
              height="16"
              rx="4"
              fill="var(--color-elevated)"
              stroke="var(--color-border)"
              strokeWidth="1"
            />
            <text
              x={pt.x}
              y={pt.y - 14}
              textAnchor="middle"
              fontSize="9"
              fill="var(--color-foreground)"
              fontWeight="bold"
            >
              {pt.score.toFixed(1)}
            </text>
          </g>
        </g>
      ))}

      {/* Fallback Single Dot */}
      {points.length === 1 && (
        <g>
          <circle
            cx={points[0].x}
            cy={points[0].y}
            r="6"
            fill="#818cf8"
            stroke="var(--color-background)"
            strokeWidth="2"
          />
          <text
            x={points[0].x}
            y={points[0].y - 12}
            textAnchor="middle"
            fontSize="10"
            fill="var(--color-foreground)"
            fontWeight="bold"
          >
            {points[0].score.toFixed(1)}
          </text>
          <text
            x={points[0].x}
            y={height - 5}
            textAnchor="middle"
            fontSize="9"
            fill="var(--color-faint)"
          >
            {points[0].label}
          </text>
        </g>
      )}
    </svg>
  );
}

// 2. Bar Chart for count by date
function CountByDateChart({ data }) {
  const width = 500;
  const height = 180;
  const paddingLeft = 20;
  const paddingRight = 10;
  const paddingTop = 20;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const n = data.length;

  const barSpacing = chartWidth / n;
  const barWidth = Math.max(12, barSpacing * 0.45);

  return (
    <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>

      {/* Ground Line */}
      <line
        x1={paddingLeft}
        y1={paddingTop + chartHeight}
        x2={width - paddingRight}
        y2={paddingTop + chartHeight}
        stroke="var(--color-border)"
        strokeWidth="1.5"
      />

      {data.map((item, i) => {
        const x = paddingLeft + i * barSpacing + (barSpacing - barWidth) / 2;
        const barHeight = (item.count / maxCount) * (chartHeight * 0.85); // scaling
        const y = paddingTop + chartHeight - barHeight;

        return (
          <g key={i} className="group/bar">
            {/* Bar */}
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx="3"
              fill="url(#bar-grad)"
              className="transition-all duration-200 hover:opacity-90"
            />
            {/* Count text on top */}
            <text
              x={x + barWidth / 2}
              y={y - 6}
              textAnchor="middle"
              fontSize="9.5"
              fill="var(--color-foreground)"
              fontWeight="bold"
            >
              {item.count}
            </text>
            {/* Date label under bar */}
            <text
              x={x + barWidth / 2}
              y={height - 5}
              textAnchor="middle"
              fontSize="8.5"
              fill="var(--color-faint)"
              fontWeight="medium"
            >
              {item.date}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// 3. Dual Bar Chart for Technical vs Communication Scores
function TechVsCommChart({ data }) {
  const width = 500;
  const height = 180;
  const paddingLeft = 30;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const n = data.length;
  const groupSpacing = chartWidth / n;
  const singleBarWidth = Math.max(8, groupSpacing * 0.22);

  // Grid levels (Score 2, 4, 6, 8, 10)
  const gridScores = [2, 4, 6, 8, 10];
  const gridLines = gridScores.map(score => {
    const y = paddingTop + (chartHeight - (score / 10) * chartHeight);
    return { y, label: score };
  });

  return (
    <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="tech-bar-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
        <linearGradient id="comm-bar-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>

      {/* Grid Lines */}
      {gridLines.map((line, idx) => (
        <line
          key={idx}
          x1={paddingLeft}
          y1={line.y}
          x2={width - paddingRight}
          y2={line.y}
          stroke="var(--color-border)"
          strokeWidth="0.75"
          strokeDasharray="3 3"
          className="opacity-20"
        />
      ))}

      {/* Ground Line */}
      <line
        x1={paddingLeft}
        y1={paddingTop + chartHeight}
        x2={width - paddingRight}
        y2={paddingTop + chartHeight}
        stroke="var(--color-border)"
        strokeWidth="1.5"
      />

      {data.map((item, i) => {
        const metrics = item.metrics || {};
        const techScore = metrics.technical_knowledge?.score ?? 0;
        const commScore = metrics.communication?.score ?? 0;

        const groupCenter = paddingLeft + i * groupSpacing + groupSpacing / 2;

        const techX = groupCenter - singleBarWidth - 1.5;
        const techHeight = (techScore / 10) * chartHeight;
        const techY = paddingTop + chartHeight - techHeight;

        const commX = groupCenter + 1.5;
        const commHeight = (commScore / 10) * chartHeight;
        const commY = paddingTop + chartHeight - commHeight;

        const dateLabel = new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" });

        return (
          <g key={i}>
            {/* Tech Bar */}
            <rect
              x={techX}
              y={techY}
              width={singleBarWidth}
              height={techHeight}
              rx="2.5"
              fill="url(#tech-bar-grad)"
              className="hover:opacity-90 transition-opacity"
            />
            {/* Comm Bar */}
            <rect
              x={commX}
              y={commY}
              width={singleBarWidth}
              height={commHeight}
              rx="2.5"
              fill="url(#comm-bar-grad)"
              className="hover:opacity-90 transition-opacity"
            />

            {/* Values on top (hover effect or static if small dataset) */}
            {n <= 5 && (
              <>
                <text
                  x={techX + singleBarWidth / 2}
                  y={techY - 4}
                  textAnchor="middle"
                  fontSize="7.5"
                  fill="#818cf8"
                  fontWeight="bold"
                >
                  {techScore.toFixed(0)}
                </text>
                <text
                  x={commX + singleBarWidth / 2}
                  y={commY - 4}
                  textAnchor="middle"
                  fontSize="7.5"
                  fill="#c084fc"
                  fontWeight="bold"
                >
                  {commScore.toFixed(0)}
                </text>
              </>
            )}

            {/* Date label */}
            <text
              x={groupCenter}
              y={height - 5}
              textAnchor="middle"
              fontSize="8.5"
              fill="var(--color-faint)"
              fontWeight="medium"
            >
              {dateLabel}
            </text>
          </g>
        );
      })}

      {/* Simple Legend */}
      <g transform={`translate(${paddingLeft + 10}, 10)`}>
        <rect width="6" height="6" fill="#818cf8" rx="1.5" />
        <text x="10" y="6" fontSize="8" fill="var(--color-muted)" fontWeight="bold">Tech</text>
        <rect x="40" width="6" height="6" fill="#c084fc" rx="1.5" />
        <text x="50" y="6" fontSize="8" fill="var(--color-muted)" fontWeight="bold">Comm</text>
      </g>
    </svg>
  );
}
