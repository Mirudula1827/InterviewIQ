import { useState } from "react";
import { Sparkles } from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import ResumeUploader from "../components/new-interview/ResumeUploader";
import JobDescriptionInput from "../components/new-interview/JobDescriptionInput";
import MatchAnalysisCard from "../components/new-interview/MatchAnalysisCard";
import QuestionList from "../components/new-interview/QuestionList";
import InterviewReadinessCard from "../components/new-interview/InterviewReadinessCard";
import api from "../lib/api";
export default function NewInterview() {
  const [jobDescription, setJobDescription] = useState("");

  const [analysis, setAnalysis] = useState(null);

  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const [regenerating, setRegenerating] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const MOCK_QUESTIONS = [
    "Walk me through how you would approach cleaning and preparing a large, messy dataset before modeling.",
    "Describe a machine learning project where you used Scikit-learn. What model did you choose and why?",
    "How do you evaluate whether a predictive model is performing well beyond accuracy alone?",
    "You mentioned strong Python skills — how would you optimize a slow Pandas operation on a large DataFrame?",
    "This role involves Docker and AWS, which aren't on your resume. How would you ramp up on deploying models to the cloud?",
  ];
  const [questions] = useState(MOCK_QUESTIONS);
  function handleRegenerate() {
    // TODO: Connect to POST /api/questions/generate
    setRegenerating(true);
    setTimeout(() => setRegenerating(false), 1200);
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
      console.log(response.data);

      setAnalysis({
        score: response.data.match_score,
        matchingSkills: response.data.matching_skills || [],
        missingSkills: response.data.missing_skills || [],
        verdict: response.data.verdict || "",
        recommendations: response.data.recommendations || [],
      });
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
          className="rounded-lg bg-purple-600 px-4 py-2 text-white"
        >
          Analyze Match
        </button>
      </div>
      <div className="mt-6">
        <div className="mt-6">
          {loadingAnalysis && <p>Analyzing resume match...</p>}

          {analysis && <MatchAnalysisCard analysis={analysis} />}
        </div>
      </div>

      <div className="mt-6">
        <QuestionList questions={questions} loading={regenerating} />
      </div>

      <div className="mt-6">
        <InterviewReadinessCard
          score={analysis?.score || 0}
          questionCount={questions.length}
          resumeReady
          onRegenerate={handleRegenerate}
        />
      </div>
    </PageContainer>
  );
}
