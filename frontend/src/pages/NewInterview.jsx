import { useState } from "react"
import { Sparkles } from "lucide-react"
import PageContainer from "../components/layout/PageContainer"
import ResumeUploader from "../components/new-interview/ResumeUploader"
import JobDescriptionInput from "../components/new-interview/JobDescriptionInput"
import MatchAnalysisCard from "../components/new-interview/MatchAnalysisCard"
import QuestionList from "../components/new-interview/QuestionList"
import InterviewReadinessCard from "../components/new-interview/InterviewReadinessCard"

const SAMPLE_JOB_DESCRIPTION = `We are hiring a Data Scientist to join our analytics team. You will build predictive models, clean and analyze large datasets, and translate findings into business impact.

Requirements:
- Strong Python skills (Pandas, NumPy, Scikit-learn)
- Solid foundation in statistics and data analysis
- Experience deploying models with Docker and AWS
- Familiarity with CI/CD pipelines is a plus`

// Mock analysis result — replace with the response from POST /api/match/analyze
const MOCK_ANALYSIS = {
  score: 82,
  matchingSkills: [
    "Python",
    "Pandas",
    "NumPy",
    "Scikit-learn",
    "Data Analysis",
  ],
  missingSkills: ["Docker", "AWS", "CI/CD"],
  verdict:
    "Strong match with a few infrastructure-related skill gaps. Your data science fundamentals align closely with the role; focus on cloud deployment and DevOps tooling to become a top-tier candidate.",
  recommendations: [
    "Highlight measurable outcomes from past modeling projects.",
    "Complete a hands-on Docker + AWS deployment to close the infrastructure gap.",
    "Add a CI/CD example (e.g. GitHub Actions) to your portfolio.",
  ],
}

// Mock questions — replace with the response from POST /api/questions/generate
const MOCK_QUESTIONS = [
  "Walk me through how you would approach cleaning and preparing a large, messy dataset before modeling.",
  "Describe a machine learning project where you used Scikit-learn. What model did you choose and why?",
  "How do you evaluate whether a predictive model is performing well beyond accuracy alone?",
  "You mentioned strong Python skills — how would you optimize a slow Pandas operation on a large DataFrame?",
  "This role involves Docker and AWS, which aren't on your resume. How would you ramp up on deploying models to the cloud?",
]

export default function NewInterview() {
  const [jobDescription, setJobDescription] = useState(SAMPLE_JOB_DESCRIPTION)
  const [questions] = useState(MOCK_QUESTIONS)
  const [regenerating, setRegenerating] = useState(false)

  function handleRegenerate() {
    // TODO: Connect to POST /api/questions/generate
    setRegenerating(true)
    setTimeout(() => setRegenerating(false), 1200)
  }

  return (
    <PageContainer>
      <header className="mb-8">
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-accent)]">
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
        <ResumeUploader />
        <JobDescriptionInput
          value={jobDescription}
          onChange={setJobDescription}
        />
      </div>

      <div className="mt-6">
        <MatchAnalysisCard analysis={MOCK_ANALYSIS} />
      </div>

      <div className="mt-6">
        <QuestionList questions={questions} loading={regenerating} />
      </div>

      <div className="mt-6">
        <InterviewReadinessCard
          score={MOCK_ANALYSIS.score}
          questionCount={questions.length}
          resumeReady
          onRegenerate={handleRegenerate}
        />
      </div>
    </PageContainer>
  )
}
