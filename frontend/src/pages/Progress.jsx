import { useState, useEffect } from "react";
import { TrendingUp, Calendar, Clock, Award, ShieldAlert, CheckCircle2, ArrowUpRight, ArrowDownRight, Award as TrophyIcon, Sparkles, Loader2, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../components/layout/PageContainer";
import { interviewHistoryService } from "../services/interviewHistory";

export default function Progress() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = interviewHistoryService.subscribe((data) => {
      if (data !== null) {
        setInterviews(data);
        setLoading(false);
      }
    });

    interviewHistoryService.getHistory().catch((err) => {
      console.error("Error fetching progress logs:", err);
      setError("Failed to load your progress history. Please try again later.");
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      await interviewHistoryService.getHistory(true);
    } catch (err) {
      console.error("Error fetching progress logs:", err);
      setError("Failed to load your progress history. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center gap-3 py-32">
          <Loader2 size={32} className="animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-muted">Calculating your progress and trends…</p>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <ShieldAlert size={36} className="text-red-400" />
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

  if (interviews.length === 0) {
    return (
      <PageContainer>
        <header className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider">
            <TrendingUp size={13} />
            Progress
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Performance Progress
          </h1>
        </header>

        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center rounded-xl border border-border bg-surface p-8 max-w-2xl mx-auto my-10">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-elevated">
            <TrendingUp size={26} className="text-[var(--color-accent)] animate-pulse" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            No Progress Data Available Yet
          </h2>
          <p className="mt-2.5 max-w-sm text-xs leading-relaxed text-muted">
            Complete mock interviews to track your skill score improvement trends, duration statistics, response times, and strengths over time!
          </p>
          <button
            onClick={() => navigate("/new-interview")}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all"
          >
            <Play size={14} className="fill-white" />
            Start Mock Interview
          </button>
        </div>
      </PageContainer>
    );
  }

  // --- Compute Real Statistics ---
  const totalInterviews = interviews.length;
  const totalScoreSum = interviews.reduce((sum, item) => sum + (item.overall_score || 0), 0);
  const averageScore = totalScoreSum / totalInterviews;

  const totalDurationSeconds = interviews.reduce((sum, item) => sum + (item.practice_time || 0), 0);
  const averageDurationMinutes = totalDurationSeconds / totalInterviews / 60;

  // Average response time
  const responseTimeItems = interviews.filter(item => item.avg_response_time !== undefined && item.avg_response_time > 0);
  const averageResponseTime = responseTimeItems.length > 0
    ? (responseTimeItems.reduce((sum, item) => sum + item.avg_response_time, 0) / responseTimeItems.length)
    : (totalDurationSeconds / (totalInterviews * 8)); // Fallback approximation: total time divided by average questions

  // Improvement Rate calculation: comparison of first interview score to latest interview score
  const chronologicalInterviews = [...interviews].reverse();
  const firstScore = chronologicalInterviews[0]?.overall_score || 0;
  const latestScore = chronologicalInterviews[totalInterviews - 1]?.overall_score || 0;
  const scoreDiff = latestScore - firstScore;
  const isImprovement = scoreDiff >= 0;

  // Aggregate strengths and weaknesses
  const allStrengths = interviews.flatMap(item => item.strengths || []);
  const allWeaknesses = interviews.flatMap(item => item.weaknesses || []);

  // Get distinct items (up to 5 for cleanliness)
  const uniqueStrengths = Array.from(new Set(allStrengths)).slice(0, 5);
  const uniqueWeaknesses = Array.from(new Set(allWeaknesses)).slice(0, 5);

  return (
    <PageContainer>
      <header className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider">
          <TrendingUp size={13} />
          Progress
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          Performance Progress
        </h1>
        <p className="mt-1 text-xs text-muted">
          Visualize your improvement metrics, response speeds, and overall preparation trends.
        </p>
      </header>

      {/* Summary Stats Panel */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-8">
        <div className="rounded-xl border border-border bg-surface p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Completed</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-foreground">{totalInterviews}</span>
            <span className="text-xs text-faint">sessions</span>
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
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Avg Duration</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-foreground">
              {Math.round(averageDurationMinutes)}m
            </span>
            <span className="text-xs text-faint">per session</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Response Speed</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-foreground">
              {Math.round(averageResponseTime)}s
            </span>
            <span className="text-xs text-faint">per Q</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 col-span-2 lg:col-span-1 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Overall Trend</span>
          <div className="mt-2 flex items-center gap-1.5">
            <span className={`text-2xl font-black ${isImprovement ? "text-green-400" : "text-amber-400"}`}>
              {isImprovement ? "+" : ""}{(scoreDiff * 10).toFixed(0)}%
            </span>
            {isImprovement ? (
              <ArrowUpRight size={18} className="text-green-400" />
            ) : (
              <ArrowDownRight size={18} className="text-amber-400" />
            )}
          </div>
        </div>
      </section>

      {/* SVG Performance Charts */}
      <section className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Score Trend Over Time */}
        <div className="rounded-xl border border-border bg-surface p-5 flex flex-col h-[300px]">
          <div className="flex items-center gap-1.5 mb-4 justify-between">
            <div className="flex items-center gap-1.5">
              <TrophyIcon size={14} className="text-indigo-400" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Overall Score Progress</h3>
            </div>
            <span className="text-[9px] font-semibold text-faint">Chronological Order</span>
          </div>
          <div className="flex-1 w-full relative">
            <ProgressScoreChart data={chronologicalInterviews} />
          </div>
        </div>

        {/* Metric Categories Breakdown */}
        <div className="rounded-xl border border-border bg-surface p-5 flex flex-col h-[300px]">
          <div className="flex items-center gap-1.5 mb-4 justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-purple-400" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Detailed Skills Progress</h3>
            </div>
            <span className="text-[9px] font-semibold text-faint">Tech vs Comm vs Problem Solving</span>
          </div>
          <div className="flex-1 w-full relative">
            <ProgressMetricsChart data={chronologicalInterviews} />
          </div>
        </div>
      </section>

      {/* Aggregate Strengths and Weaknesses */}
      <section className="grid gap-6 md:grid-cols-2">
        {/* Strengths Trend */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-faint">
            <CheckCircle2 size={14} className="text-emerald-400" />
            Consistently Highlighted Strengths
          </h3>
          {uniqueStrengths.length > 0 ? (
            <ul className="space-y-3">
              {uniqueStrengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2.5 text-xs leading-relaxed text-muted">
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[9px]">
                    {index + 1}
                  </span>
                  <span className="text-balance">{strength}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-faint italic">Complete interviews with high scores to display strengths.</p>
          )}
        </div>

        {/* Weaknesses Trend */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-faint">
            <ShieldAlert size={14} className="text-amber-400" />
            Recruiter Focus Areas (Weaknesses)
          </h3>
          {uniqueWeaknesses.length > 0 ? (
            <ul className="space-y-3">
              {uniqueWeaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-2.5 text-xs leading-relaxed text-muted">
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 font-bold text-[9px]">
                    {index + 1}
                  </span>
                  <span className="text-balance">{weakness}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-faint italic">No significant gaps reported in completed sessions.</p>
          )}
        </div>
      </section>
    </PageContainer>
  );
}

// ── SVG Chart Helpers ────────────────────────────────────────────────────────

function ProgressScoreChart({ data }) {
  const width = 500;
  const height = 200;
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
    const y = paddingTop + (chartHeight - (score / 10) * chartHeight);
    return { x, y, score, label: `Session ${i + 1}` };
  });

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

  const gridScores = [2, 4, 6, 8, 10];
  const gridLines = gridScores.map(score => ({
    y: paddingTop + (chartHeight - (score / 10) * chartHeight),
    label: score
  }));

  return (
    <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="prog-line-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="prog-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00" />
        </linearGradient>
      </defs>

      {gridLines.map((line, idx) => (
        <g key={idx} className="opacity-20">
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
            y={line.y + 3}
            textAnchor="end"
            fontSize="9"
            fill="var(--color-muted)"
            fontWeight="bold"
          >
            {line.label}
          </text>
        </g>
      ))}

      {points.length > 1 && <path d={areaD} fill="url(#prog-area-grad)" />}
      {points.length > 1 && (
        <path
          d={pathD}
          fill="none"
          stroke="url(#prog-line-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {points.map((pt, idx) => (
        <g key={idx} className="group/dot cursor-pointer">
          <circle
            cx={pt.x}
            cy={pt.y}
            r="4.5"
            fill="var(--color-background)"
            stroke="#6366f1"
            strokeWidth="2.5"
            className="transition-all duration-200 hover:r-6 hover:stroke-purple-400"
          />
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
    </svg>
  );
}

function ProgressMetricsChart({ data }) {
  const width = 500;
  const height = 200;
  const paddingLeft = 30;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const n = data.length;

  const getPoints = (metricKey) => {
    return data.map((item, i) => {
      const x = n > 1
        ? paddingLeft + i * (chartWidth / (n - 1))
        : paddingLeft + chartWidth / 2;
      const score = item.metrics?.[metricKey]?.score ?? 0;
      const y = paddingTop + (chartHeight - (score / 10) * chartHeight);
      return { x, y, score };
    });
  };

  const techPoints = getPoints("technical_knowledge");
  const commPoints = getPoints("communication");
  const probPoints = getPoints("problem_solving");

  const buildPath = (pts) => {
    if (pts.length === 0) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x} ${pts[i].y}`;
    }
    return d;
  };

  const gridScores = [2, 4, 6, 8, 10];

  return (
    <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {gridScores.map((score, idx) => {
        const y = paddingTop + (chartHeight - (score / 10) * chartHeight);
        return (
          <g key={idx} className="opacity-20">
            <line
              x1={paddingLeft}
              y1={y}
              x2={width - paddingRight}
              y2={y}
              stroke="var(--color-border)"
              strokeWidth="0.75"
              strokeDasharray="3 3"
            />
          </g>
        );
      })}

      {/* Ground Line */}
      <line
        x1={paddingLeft}
        y1={paddingTop + chartHeight}
        x2={width - paddingRight}
        y2={paddingTop + chartHeight}
        stroke="var(--color-border)"
        strokeWidth="1.5"
      />

      {/* Tech Line (Indigo) */}
      {techPoints.length > 1 && (
        <path
          d={buildPath(techPoints)}
          fill="none"
          stroke="#818cf8"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}

      {/* Comm Line (Purple) */}
      {commPoints.length > 1 && (
        <path
          d={buildPath(commPoints)}
          fill="none"
          stroke="#c084fc"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}

      {/* Problem Solving Line (Emerald) */}
      {probPoints.length > 1 && (
        <path
          d={buildPath(probPoints)}
          fill="none"
          stroke="#34d399"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}

      {/* Dots and labels for last session */}
      {n > 0 && (
        <>
          <circle cx={techPoints[n - 1].x} cy={techPoints[n - 1].y} r="3.5" fill="#818cf8" />
          <circle cx={commPoints[n - 1].x} cy={commPoints[n - 1].y} r="3.5" fill="#c084fc" />
          <circle cx={probPoints[n - 1].x} cy={probPoints[n - 1].y} r="3.5" fill="#34d399" />
        </>
      )}

      {/* Simple Legend */}
      <g transform={`translate(${paddingLeft + 10}, 10)`}>
        <rect width="6" height="6" fill="#818cf8" rx="1.5" />
        <text x="10" y="6" fontSize="8" fill="var(--color-muted)" fontWeight="bold">Technical</text>
        <rect x="70" width="6" height="6" fill="#c084fc" rx="1.5" />
        <text x="80" y="6" fontSize="8" fill="var(--color-muted)" fontWeight="bold">Communication</text>
        <rect x="160" width="6" height="6" fill="#34d399" rx="1.5" />
        <text x="170" y="6" fontSize="8" fill="var(--color-muted)" fontWeight="bold">Problem Solving</text>
      </g>
    </svg>
  );
}
