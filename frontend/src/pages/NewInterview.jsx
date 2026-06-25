import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2 } from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import ResumeUploader from "../components/new-interview/ResumeUploader";
import JobDescriptionInput from "../components/new-interview/JobDescriptionInput";
import MatchAnalysisCard from "../components/new-interview/MatchAnalysisCard";
import QuestionList from "../components/new-interview/QuestionList";
import InterviewReadinessCard from "../components/new-interview/InterviewReadinessCard";
import api from "../lib/api";

export default function NewInterview() {
  const navigate = useNavigate();
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const [resumeText, setResumeText] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingStart, setLoadingStart] = useState(false);

  // Clear previous session cache when setting up a new interview
  useEffect(() => {
    localStorage.removeItem("interview_session_id");
    localStorage.removeItem("interview_first_question");
  }, []);

  async function handleGenerateQuestions() {
    if (!resumeText || !jobDescription) return;

    try {
      setLoadingQuestions(true);
      const response = await api.post("/questions/generate", {
        resume_text: resumeText,
        jd_text: jobDescription,
      });

      setQuestions(response.data.questions || []);
      console.log(response.data);
    } catch (error) {
      console.error(error);
      alert("Question generation failed");
    } finally {
      setLoadingQuestions(false);
    }
  }

  async function handleStartInterview() {
    if (!analysis) {
      alert("Analyze your resume first.");
      return;
    }

    try {
      setLoadingStart(true);
      const response = await api.post("/interview/start", {
        resume_text: resumeText,
        jd_text: jobDescription,
      });

      const { session_id, question } = response.data;

      // Store the starting session state in localStorage
      localStorage.setItem("interview_session_id", session_id);
      localStorage.setItem("interview_first_question", question);

      // Navigate directly to the live interview screen
      navigate("/live-interview");
    } catch (error) {
      console.error(error);
      alert("Failed to start interview");
    } finally {
      setLoadingStart(false);
    }
  }

  function handleRegenerate() {
    handleGenerateQuestions();
  }

  async function handleAnalyze() {
    if (!resumeText || !jobDescription) {
      alert("Upload resume and enter JD first");
      return;
    }
    try {
      setLoadingAnalysis(true);
      const response = await api.post("/match/analyze", {
        resume_text: resumeText,
        jd_text: jobDescription,
      });

      setAnalysis({
        score: response.data.match_score,
        matchingSkills: response.data.matching_skills || [],
        missingSkills: response.data.missing_skills || [],
        verdict: response.data.verdict || "",
        recommendations: response.data.recommendations || [],
      });

      await handleGenerateQuestions();
    } catch (error) {
      console.error(error);
      alert("Analysis failed");
    } finally {
      setLoadingAnalysis(false);
    }
  }

  return (
    <PageContainer>
      <header className="mb-8">
        <div className="flex items-center gap-2 text-xs font-medium text-(--color-accent)">
          <Sparkles size={14} />
          New Interview
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground text-balance">
          Set up your interview session
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted text-pretty">
          Upload your resume and target job description. We&apos;ll analyze the
          match and generate tailored questions before you begin.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <ResumeUploader onResumeParsed={setResumeText} />

        <JobDescriptionInput
          value={jobDescription}
          onChange={setJobDescription}
        />
      </div>

      <div className="mt-6">
        <button
          onClick={handleAnalyze}
          disabled={
            loadingAnalysis ||
            loadingQuestions ||
            loadingStart ||
            !resumeText ||
            !jobDescription
          }
          className="rounded-lg bg-purple-600 px-4 py-2 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-purple-500 transition-colors"
        >
          {loadingAnalysis ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Analyzing Match...
            </>
          ) : (
            "Analyze Match"
          )}
        </button>
      </div>

      <div className="mt-6">
        <div className="mt-6">
          {loadingAnalysis && <p>Analyzing resume match...</p>}
          {analysis && <MatchAnalysisCard analysis={analysis} />}
        </div>
      </div>

      <div className="mt-6">
        <QuestionList questions={questions} loading={loadingQuestions} />
      </div>

      <div className="mt-6">
        <InterviewReadinessCard
          score={analysis?.score || 0}
          questionCount={questions.length}
          resumeReady={!!resumeText}
          onRegenerate={handleRegenerate}
          onStart={handleStartInterview}
          loadingStart={loadingStart}
          loadingRegenerate={loadingQuestions}
          analysisCompleted={!!analysis}
        />
      </div>
    </PageContainer>
  );
}
