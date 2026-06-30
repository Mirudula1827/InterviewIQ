import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  ArrowUpDown,
  ChevronRight,
  ArrowRight,
  AlertCircle,
  Loader2,
  Calendar,
  Award,
  Sparkles
} from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import ReportDetailModal from "../components/layout/ReportDetailModal";
import { interviewHistoryService } from "../services/interviewHistory";

export default function Reports() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc"); // date-desc, date-asc, score-desc, score-asc
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
      console.error("Error fetching reports:", err);
      setError("Failed to load reports. Please try again later.");
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      await interviewHistoryService.getHistory(true);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports. Please try again later.");
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

  // Search & Filter
  const filteredInterviews = interviews.filter((item) => {
    const roleMatch = (item.role || "").toLowerCase().includes(searchQuery.toLowerCase());
    const recMatch = (item.hiring_recommendation || "").toLowerCase().includes(searchQuery.toLowerCase());
    return roleMatch || recMatch;
  });

  // Sort
  const sortedInterviews = [...filteredInterviews].sort((a, b) => {
    if (sortBy === "date-desc") {
      return new Date(b.date || 0) - new Date(a.date || 0);
    }
    if (sortBy === "date-asc") {
      return new Date(a.date || 0) - new Date(b.date || 0);
    }
    if (sortBy === "score-desc") {
      return (b.overall_score || 0) - (a.overall_score || 0);
    }
    if (sortBy === "score-asc") {
      return (a.overall_score || 0) - (b.overall_score || 0);
    }
    return 0;
  });

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center gap-3 py-32">
          <Loader2 size={32} className="animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-muted">Loading your interview reports…</p>
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

  return (
    <PageContainer>
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider">
          <FileText size={13} />
          Reports
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          Evaluation Reports
        </h1>
        <p className="mt-1 text-xs text-muted">
          Access complete feedback, grading metrics, and transcript logs for all your sessions.
        </p>
      </header>

      {interviews.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center rounded-xl border border-border bg-surface p-8 max-w-2xl mx-auto my-6">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-elevated">
            <FileText size={22} className="text-purple-400" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            No Evaluation Reports
          </h2>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted">
            Complete a live interview simulation first to view comprehensive AI recruiter evaluations.
          </p>
          <button
            onClick={() => navigate("/new-interview")}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] px-4 py-2 text-xs font-bold text-white shadow-lg transition-all"
          >
            Start Setup
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filters Panel */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface border border-border p-4 rounded-xl">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-faint" />
              <input
                type="text"
                placeholder="Search by role or recommendation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-border bg-elevated text-foreground placeholder-faint focus:border-[var(--color-accent)] focus:outline-none transition-colors"
              />
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
              <ArrowUpDown size={14} className="text-muted" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-elevated border border-border text-foreground px-3 py-2 text-xs rounded-lg focus:border-[var(--color-accent)] focus:outline-none cursor-pointer"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="score-desc">Highest Score</option>
                <option value="score-asc">Lowest Score</option>
              </select>
            </div>
          </div>

          {/* Results List */}
          {sortedInterviews.length === 0 ? (
            <div className="text-center py-12 border border-border border-dashed rounded-xl bg-surface/50">
              <p className="text-xs text-muted">No reports match your search criteria.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {sortedInterviews.map((item) => {
                const scorePct = Math.round((item.overall_score || 0) * 10);
                const scoreColor =
                  item.overall_score >= 8
                    ? "text-green-400 bg-green-500/5 border-green-500/10"
                    : item.overall_score >= 5
                      ? "text-yellow-400 bg-yellow-500/5 border-yellow-500/10"
                      : "text-red-400 bg-red-500/5 border-red-500/10";

                const formattedDate = item.date
                  ? new Date(item.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "N/A";

                return (
                  <div
                    key={item.session_id}
                    onClick={() => handleOpenReport(item)}
                    className="group rounded-xl border border-border bg-surface p-5 hover:bg-surface-hover hover:border-[var(--color-accent)]/30 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-sm font-bold text-foreground truncate group-hover:text-[var(--color-accent)] transition-colors">
                          {item.role || "AI Mock Interview"}
                        </h3>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-extrabold shrink-0 ${scoreColor}`}>
                          {scorePct}%
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-faint">
                        <Calendar size={11} />
                        <span>{formattedDate}</span>
                        <span>•</span>
                        <span>{item.questions_answered} Qs</span>
                      </div>

                      <p className="mt-3 text-xs text-muted line-clamp-2 leading-relaxed">
                        {item.hiring_recommendation || "No detailed recommendation provided."}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-faint">
                        Duration: {Math.round((item.practice_time || 0) / 60)}m
                      </span>
                      <button className="text-[10px] font-bold text-[var(--color-accent)] group-hover:text-[var(--color-accent-hover)] transition-colors flex items-center gap-1">
                        Open Evaluation
                        <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Report Modal */}
      <ReportDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseReport}
        report={selectedReport}
      />
    </PageContainer>
  );
}
