import React, { useState, useEffect } from "react";
import { 
  Briefcase, 
  Paperclip, 
  FileText, 
  Bookmark, 
  HelpCircle, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Globe, 
  User, 
  Award, 
  Plus, 
  History, 
  Printer, 
  Star, 
  ThumbsUp, 
  Lightbulb, 
  AlertTriangle, 
  UserPlus, 
  Loader2, 
  Trash2,
  Calendar,
  Layers,
  Heart,
  Linkedin
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ResponseData, CandidateScorecard, SkillIdentified, InterviewQuestion } from "./types";

// PRESETS FOR RAPID ONBOARDING
const PRESETS = [
  {
    title: "Senior React Engineer",
    icon: "💻",
    notes: "We need someone with strong skills in React 19, TypeScript, and modern styling tools (like Tailwind CSS). They should love component design, understand page load performance, and know how to collaborate with UX design peers. It is a remote role, so they need to be a stellar communicator. Also need them to mentor 2 junior engineers on our squad and occasionally lead standard sprint planning rituals. Compensation around $140,000, healthcare and free hardware setup included."
  },
  {
    title: "Product Marketing Manager",
    icon: "📈",
    notes: "Hiring a marketing person who can write epic copy for our dashboard and landing pages. They have to do deep competitive analysis and write continuous newsletters. Must have high empathy for users, excellent storytelling vibe, and know how to coordinate calendar releases with our product managers. Nice-to-haves: experience with basic SEO tools, Google Analytics, and running minor A/B tests. Budget is $95k, flexible hours, based in Chicago or hybrid."
  },
  {
    title: "Technical Support Lead",
    icon: "🛠️",
    notes: "Need a leader for our tier-2 support team. They will manage customer escalations via Zendesk, keep eye on SLA completion rates, and train new support agents. Needs high patience and extremely polite professional communication. Essential to have basic SQL knowledge to debug databases when customers have issues. Experience with API testing tools like Postman is a massive plus. Hybrid role, 4 weeks paid time off, quarterly team retreats."
  },
  {
    title: "AI Research Specialist",
    icon: "🧠",
    notes: "Looking for an applied scientist to fine-tune open-source LLMs and design sophisticated RAG architectures. Must be super comfortable with PyTorch, huggingface transformers, and prompt optimization pipeline engineering. They should be self-directed, read deep tech academic papers frequently, and design evaluations metrics. Excellent problem-solving speed is a must. High competitive salary + equity packages."
  }
];

export default function App() {
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [errorString, setErrorString] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"linkedin" | "interview" | "scorecard">("linkedin");
  const [previewMode, setPreviewMode] = useState<"raw" | "linkedin-mock">("raw");
  
  // Current Generation Results
  const [result, setResult] = useState<ResponseData | null>(null);
  
  // Scoring / Live Mock Interview states
  const [scorecard, setScorecard] = useState<CandidateScorecard>({
    candidateName: "",
    interviewerName: "",
    interviewDate: new Date().toISOString().split("T")[0],
    evaluations: [],
    overallSummary: ""
  });

  // Saved Session History
  const [draftHistory, setDraftHistory] = useState<ResponseData[]>([]);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null);

  // Copy-state feedbacks
  const [copiedJd, setCopiedJd] = useState<boolean>(false);
  const [copiedQuestionId, setCopiedQuestionId] = useState<number | null>(null);

  // Accordion state for 10 structural questions
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(1);

  // Status logs during mock generation steps
  const steps = [
    "Analyzing your raw job specs...",
    "Extracting key hard & soft competencies...",
    "Drafting search-engine optimized role title...",
    "Formatting polished LinkedIn JD Markdown with emoji accents...",
    "Designing behavioral interview questions based on STAR model...",
    "Injecting detailed evaluation checklists...",
    "Structuring the comprehensive Sandbox blueprint..."
  ];

  // Load baseline on mount
  useEffect(() => {
    // Try to restore drafts from localStorage if any
    try {
      const stored = localStorage.getItem("recruitment_sandbox_history");
      if (stored) {
        const parsed = JSON.parse(stored) as ResponseData[];
        if (parsed && parsed.length > 0) {
          setDraftHistory(parsed);
          setResult(parsed[0]);
          setSelectedHistoryIndex(0);
        }
      }
    } catch (e) {
      console.error("Failed to load initial history", e);
    }
  }, []);

  // Update Scorecard when result changes
  useEffect(() => {
    if (result) {
      const initialEvaluations = result.interviewGuide.map(q => ({
        questionId: q.id,
        rating: 0,
        notes: ""
      }));
      setScorecard({
        candidateName: "",
        interviewerName: "",
        interviewDate: new Date().toISOString().split("T")[0],
        evaluations: initialEvaluations,
        overallSummary: ""
      });
      // Expand the first question by default
      setExpandedQuestionId(result.interviewGuide[0]?.id || 1);
    }
  }, [result]);

  // Handle Preset loading
  const loadPreset = (presetNotes: string, presetTitle: string) => {
    setNotes(presetNotes);
    setErrorString("");
  };

  // Perform Gemini AI Generator API call
  const triggerGeneration = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!notes.trim()) {
      setErrorString("Please list some specifications or raw notes first to design the role.");
      return;
    }

    setLoading(true);
    setErrorString("");
    
    // Cycle progress messages to look beautiful and professional
    let currentStepIdx = 0;
    setLoadingStep(steps[currentStepIdx]);
    const stepInterval = setInterval(() => {
      if (currentStepIdx < steps.length - 1) {
        currentStepIdx++;
        setLoadingStep(steps[currentStepIdx]);
      }
    }, 1800);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const errMsg = await response.json().catch(() => ({}));
        throw new Error(errMsg.error || `Server responded with ${response.status}`);
      }

      const generatedData = (await response.json()) as ResponseData;
      
      // Save results
      setResult(generatedData);
      
      // Apppend into draft history & update localStorage
      const updatedHistory = [generatedData, ...draftHistory.slice(0, 9)]; // keep latest 10
      setDraftHistory(updatedHistory);
      setSelectedHistoryIndex(0);
      localStorage.setItem("recruitment_sandbox_history", JSON.stringify(updatedHistory));
      
      setActiveTab("linkedin");
    } catch (err: any) {
      console.error(err);
      setErrorString(err.message || "An unexpected issue occurred during generation. Please verify your internet connection or Gemini SDK setup.");
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  // Switch between drafts in the loaded history list
  const loadHistoryItem = (index: number) => {
    const item = draftHistory[index];
    if (item) {
      setResult(item);
      setSelectedHistoryIndex(index);
    }
  };

  // Delete an item from session history
  const deleteHistoryItem = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const updated = draftHistory.filter((_, i) => i !== index);
    setDraftHistory(updated);
    
    if (selectedHistoryIndex === index) {
      if (updated.length > 0) {
        setResult(updated[0]);
        setSelectedHistoryIndex(0);
      } else {
        setResult(null);
        setSelectedHistoryIndex(null);
      }
    } else if (selectedHistoryIndex !== null && selectedHistoryIndex > index) {
      setSelectedHistoryIndex(selectedHistoryIndex - 1);
    }
    
    localStorage.setItem("recruitment_sandbox_history", JSON.stringify(updated));
  };

  // Clipboard Copier
  const handleCopyToClipboard = (text: string, type: "jd" | "q", qId?: number) => {
    navigator.clipboard.writeText(text);
    if (type === "jd") {
      setCopiedJd(true);
      setTimeout(() => setCopiedJd(false), 2000);
    } else if (type === "q" && qId !== undefined) {
      setCopiedQuestionId(qId);
      setTimeout(() => setCopiedQuestionId(null), 2000);
    }
  };

  // Handle Scorecard ratings change
  const handleScorecardRating = (qId: number, rating: number) => {
    setScorecard(prev => {
      const updatedEvals = prev.evaluations.map(ev => 
        ev.questionId === qId ? { ...ev, rating } : ev
      );
      return { ...prev, evaluations: updatedEvals };
    });
  };

  // Handle Scorecard evaluation note input
  const handleScorecardNotes = (qId: number, notesText: string) => {
    setScorecard(prev => {
      const updatedEvals = prev.evaluations.map(ev => 
        ev.questionId === qId ? { ...ev, notes: notesText } : ev
      );
      return { ...prev, evaluations: updatedEvals };
    });
  };

  // Clear current active evaluation scorecard
  const resetScorecard = () => {
    if (!result) return;
    const initialEvaluations = result.interviewGuide.map(q => ({
      questionId: q.id,
      rating: 0,
      notes: ""
    }));
    setScorecard({
      candidateName: "",
      interviewerName: "",
      interviewDate: new Date().toISOString().split("T")[0],
      evaluations: initialEvaluations,
      overallSummary: ""
    });
  };

  // Trigger browser print dialog tailored beautifully for PDF output
  const handlePrint = () => {
    window.print();
  };

  // Calculate compatibility analytics
  const getCompetencyScores = () => {
    if (!result || scorecard.evaluations.length === 0) return { hardAvg: 0, softAvg: 0, totalAvg: 0 };
    
    let hardSums = 0;
    let hardCounts = 0;
    let softSums = 0;
    let softCounts = 0;

    scorecard.evaluations.forEach(ev => {
      const question = result.interviewGuide.find(q => q.id === ev.questionId);
      if (question && ev.rating > 0) {
        if (question.skillType === "hard") {
          hardSums += ev.rating;
          hardCounts++;
        } else {
          softSums += ev.rating;
          softCounts++;
        }
      }
    });

    const evaluatedList = scorecard.evaluations.filter(ev => ev.rating > 0);
    const totalAvg = evaluatedList.length > 0 
      ? evaluatedList.reduce((acc, current) => acc + current.rating, 0) / evaluatedList.length 
      : 0;

    return {
      hardAvg: hardCounts > 0 ? hardSums / hardCounts : 0,
      softAvg: softCounts > 0 ? softSums / softCounts : 0,
      totalAvg
    };
  };

  const { hardAvg, softAvg, totalAvg } = getCompetencyScores();
  const evaluationProgress = result 
    ? (scorecard.evaluations.filter(ev => ev.rating > 0).length / result.interviewGuide.length) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-950">
      
      {/* PROFESSIONAL DASHBOARD HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-200">
                <Briefcase className="w-5 h-5" id="logo-icon-briefcase" />
              </div>
              <div>
                <h1 className="text-xl font-semibold font-display tracking-tight text-slate-950 flex items-center gap-1.5">
                  Recruitment Sandbox
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-xxs font-semibold bg-indigo-50 text-indigo-700 tracking-wider uppercase border border-indigo-100">AI PRO</span>
                </h1>
                <p className="text-xs text-slate-500">Transform raw drafts into verified LinkedIn JDs &amp; structural STAR interview guides</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-xs text-slate-400 hidden sm:inline-block">Gemini engine connected</span>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="System online"></div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER LAYOUT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">
          
          {/* LEFT PANEL: CONTEXT CREATION & INPUT (4/12 columns on large screens) */}
          <section className="lg:col-span-5 space-y-6 print:hidden">
            
            {/* RAW INPUT COMPONET CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold font-display text-slate-900 mb-2 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-indigo-600" />
                Desured Role Blueprint
              </h2>
              <p className="text-xs text-slate-500 mb-5">
                Type what kind of teammate you seek. Include details like primary stack tools, cultural attributes, key missions, and benefits.
              </p>

              {/* DYNAMIC TEMPLATE PRESETS */}
              <div className="mb-5">
                <span className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2.5">
                  Quick-load presets to test sandbox:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.title}
                      id={`preset-btn-${preset.title.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => loadPreset(preset.notes, preset.title)}
                      className="text-left px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 transition-all flex items-start space-x-2.5"
                    >
                      <span className="text-base leading-none">{preset.icon}</span>
                      <span className="line-clamp-1">{preset.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* NOTES WRITER */}
              <form onSubmit={triggerGeneration} className="space-y-4">
                <div className="relative">
                  <textarea
                    id="raw-role-notes-textarea"
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      setErrorString("");
                    }}
                    placeholder="Example: We need a lead data analyst to optimize consumer churn. Must speak Python & SQL plus be comfortable storytelling in front of executives. Help train junior analysts. Remote-friendly..."
                    rows={8}
                    className="w-full text-sm rounded-xl border border-slate-200 p-4 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400 bg-slate-50/50"
                  />
                  <div className="absolute bottom-3 right-3 text-xxs text-slate-400 font-mono">
                    {notes.trim().length} chars
                  </div>
                </div>

                {errorString && (
                  <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-lg flex items-start space-x-2 animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span>{errorString}</span>
                  </div>
                )}

                <button
                  id="generate-blueprint-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-slate-900 border border-transparent text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 active:scale-98 disabled:bg-slate-200 disabled:text-slate-400 disabled:pointer-events-none shadow-sm transition-all flex items-center justify-center space-x-2 text-center clickable"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-100" />
                      <span>Generating Blueprint...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-indigo-300 fill-indigo-300 animate-pulse" />
                      <span>Formulate Ideal Blueprint</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* INTERACTIVE LOAD LOADING INDICATOR */}
            {loading && (
              <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-sm space-y-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-700 tracking-wider uppercase">Active Engine Refinement</span>
                  <span className="text-xs font-mono text-indigo-600">Step {steps.indexOf(loadingStep) + 1} of 7</span>
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000" 
                      style={{ width: `${((steps.indexOf(loadingStep) + 1) / steps.length) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-600 italic font-medium">"{loadingStep}"</p>
                </div>
                <div className="text-xxs text-slate-400 leading-relaxed border-t border-slate-100 pt-3">
                  Our intelligence is analyzing hard stack requirements, evaluating soft culture alignments, crafting customized behavioral behavioral prompts following the STAR response system, and formatting clean markdown.
                </div>
              </div>
            )}

            {/* DRAFT HISTORY PANEL */}
            {draftHistory.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold font-display text-slate-800 mb-4 flex items-center space-x-2">
                  <History className="w-4 h-4 text-slate-500" />
                  <span>Brainstorm Sessions ({draftHistory.length})</span>
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {draftHistory.map((draft, index) => (
                    <div
                      key={index}
                      onClick={() => loadHistoryItem(index)}
                      id={`history-item-${index}`}
                      className={`group w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedHistoryIndex === index
                          ? "bg-indigo-50 border-indigo-200 text-indigo-900"
                          : "border-slate-100 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <Briefcase className={`w-4 h-4 flex-shrink-0 ${selectedHistoryIndex === index ? "text-indigo-600" : "text-slate-400"}`} />
                        <div className="truncate">
                          <p className="text-xs font-semibold truncate text-slate-900">
                            {draft.roleTitle}
                          </p>
                          <p className="text-xxs text-slate-500 font-mono">
                            {draft.skillsIdentified.length} verified attributes
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteHistoryItem(e, index)}
                        id={`delete-history-${index}`}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all flex-shrink-0"
                        title="Delete this draft"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-indigo-950 text-indigo-200 rounded-2xl p-5 shadow-sm space-y-3.5 text-xs">
              <h4 className="font-semibold text-white flex items-center space-x-2">
                <Lightbulb className="w-4 h-4 text-amber-300" />
                <span>Hiring Blueprint Advice</span>
              </h4>
              <p className="leading-relaxed opacity-90">
                A stellar interview doesn't just check tools. It matches performance constraints. These AI outputs include exact STAR target checkmarks to probe candidate adaptability.
              </p>
              <div className="border-t border-indigo-800/60 pt-3 flex items-center justify-between text-xxs text-indigo-300 text-slate-400">
                <span>Tailored for LinkedIn Post Formats</span>
                <span>Requires exactly 10 standards</span>
              </div>
            </div>

          </section>

          {/* RIGHT PANEL: GENERATE OUTPUTS WORKSPACE (7/12 columns) */}
          <section className="lg:col-span-7 print:w-full">
            
            {result ? (
              <div className="space-y-6">
                
                {/* ROLE HIGHLIGHT HEADER */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden print:border-none print:shadow-none print:p-0">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-full pointer-events-none print:hidden"></div>
                  
                  <div className="flex flex-col space-y-3 relative z-10">
                    <span className="inline-flex items-center self-start px-2.5 py-0.5 rounded-full text-xxs font-semibold bg-emerald-50 text-emerald-800 tracking-wide border border-emerald-100">
                      Ideal Role Created
                    </span>
                    <h2 className="text-2xl font-bold font-display text-slate-950 inline-flex items-center gap-2">
                      {result.roleTitle}
                    </h2>
                    
                    {/* COMPETENCIES IDENTIFIED BADGES */}
                    <div className="border-t border-slate-100 pt-4 mt-2">
                      <span className="block text-xxs font-semibold text-slate-400 uppercase tracking-widest mb-2 font-mono">
                        Identified Core Attributes
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {result.skillsIdentified.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
                              skill.type === "hard"
                                ? "bg-blue-50 text-blue-700 border-blue-100"
                                : "bg-purple-50 text-purple-700 border-purple-100"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${skill.type === "hard" ? "bg-blue-500" : "bg-purple-500"}`}></span>
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* VISUAL TABS CONTROL */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-px print:hidden">
                  <div className="flex space-x-1 sm:space-x-2">
                    <button
                      id="tab-btn-linkedin"
                      onClick={() => setActiveTab("linkedin")}
                      className={`pb-2.5 px-3 sm:px-4 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 uppercase tracking-wide tracking-wider ${
                        activeTab === "linkedin"
                          ? "border-indigo-600 text-indigo-600 font-bold"
                          : "border-transparent text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <Linkedin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>LinkedIn JD</span>
                    </button>
                    
                    <button
                      id="tab-btn-interview"
                      onClick={() => setActiveTab("interview")}
                      className={`pb-2.5 px-3 sm:px-4 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 uppercase tracking-wide tracking-wider ${
                        activeTab === "interview"
                          ? "border-indigo-600 text-indigo-600 font-bold"
                          : "border-transparent text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Interview Guide (10)</span>
                    </button>

                    <button
                      id="tab-btn-scorecard"
                      onClick={() => setActiveTab("scorecard")}
                      className={`pb-2.5 px-3 sm:px-4 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 uppercase tracking-wide tracking-wider ${
                        activeTab === "scorecard"
                          ? "border-indigo-600 text-indigo-600 font-bold"
                          : "border-transparent text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <Award className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Mock Scorecard</span>
                    </button>
                  </div>

                  <div className="hidden sm:flex items-center space-x-2 pb-2.5">
                    {activeTab === "scorecard" && (
                      <button
                        onClick={resetScorecard}
                        id="reset-scorecard-action"
                        className="px-2.5 py-1 text-xxs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition-all transition-all flex items-center space-x-1"
                        title="Clear evaluation notes and ratings"
                      >
                        Reset Evaluator
                      </button>
                    )}
                    <button
                      onClick={handlePrint}
                      id="print-summary-action"
                      className="px-2.5 py-1 text-xxs font-semibold bg-white hover:bg-slate-50 text-indigo-600 rounded border border-indigo-200 transition-all transition-all flex items-center space-x-1"
                      title="Optimized for direct paper print and PDF saving"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Export / Print</span>
                    </button>
                  </div>
                </div>

                {/* OUTPUT TABS VIEW AREA */}
                <div className="bg-transparent">
                  
                  {/* TAB 1: POLISHED MARKDOWN LINKEDIN JD */}
                  {activeTab === "linkedin" && (
                    <div className="space-y-4 print:block">
                      
                      {/* VIEW SELECTOR */}
                      <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-xl border border-slate-200/50 print:hidden">
                        <span className="text-xs font-medium text-slate-700 pl-2">Display layouts:</span>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setPreviewMode("raw")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                              previewMode === "raw"
                                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Stylized Markdown
                          </button>
                          <button
                            onClick={() => setPreviewMode("linkedin-mock")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center space-x-1.5 ${
                              previewMode === "linkedin-mock"
                                ? "bg-slate-900 text-white shadow-xs"
                                : "text-slate-600 hover:text-slate-950"
                            }`}
                          >
                            <Linkedin className="w-3 h-3 text-blue-500 fill-blue-500" />
                            <span>LinkedIn mockup</span>
                          </button>
                        </div>
                      </div>

                      {previewMode === "raw" ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm relative prose prose-slate max-w-none print:border-none print:shadow-none print:p-0">
                          {/* FLOATING ACTION TOOLBAR */}
                          <div className="absolute top-4 right-4 print:hidden">
                            <button
                              onClick={() => handleCopyToClipboard(result.jobDescriptionMarkdown, "jd")}
                              id="copy-to-clipboard-jd"
                              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-indigo-600 text-xs font-semibold rounded-xl border border-slate-200 transition-all"
                            >
                              {copiedJd ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy clean markdown</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="markdown-target-area leading-relaxed text-sm pt-6 print:pt-0">
                            <ReactMarkdown>{result.jobDescriptionMarkdown}</ReactMarkdown>
                          </div>
                        </div>
                      ) : (
                        /* PREMIUM HIGH-FIDELITY LINKEDIN IN-FEED MOCKUP */
                        <div className="bg-[#f3f6f9] border border-[#e0e0e0] rounded-xl overflow-hidden shadow-xs print:hidden">
                          {/* LinkedIn Mock In-feed Header */}
                          <div className="bg-white p-4 border-b border-slate-200/60 pb-3">
                            <div className="flex items-start space-x-3">
                              <div className="w-12 h-12 bg-blue-100 text-blue-800 rounded-full font-bold flex items-center justify-center border border-blue-200 flex-shrink-0 text-sm">
                                HR
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-slate-900 leading-tight">Elite Talent Acquisition Specialist</h4>
                                <p className="text-xxs text-slate-500 truncate">Hiring in modern technical ecosystems · Promoted</p>
                                <p className="text-xxs text-slate-400 mt-0.5 flex items-center mb-1">
                                  <span>Just now</span>
                                  <span className="mx-1">•</span>
                                  <Globe className="w-2.5 h-2.5" />
                                </p>
                              </div>
                              <div className="text-[#0a66c2] text-sm font-bold flex items-center space-x-1 flex-shrink-0">
                                <Plus className="w-3.5 h-3.5" />
                                <span>Follow</span>
                              </div>
                            </div>
                            
                            <p className="text-xs text-slate-700 mt-3 font-medium">
                              🚀 Looking to hire a world-class candidate for our expanding squad! Check out this newly polished role we formulated in the Recruitment Sandbox:
                            </p>
                          </div>

                          {/* JD Card Mock (LinkedIn Job Post Layout) */}
                          <div className="bg-white m-3 border border-[#e0e0e0] rounded-lg overflow-hidden flex flex-col">
                            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Linkedin className="w-4 h-4 text-[#0a66c2]" />
                                <span className="text-xxs font-bold text-slate-500 tracking-wider uppercase">Active LinkedIn Job Offering</span>
                              </div>
                              <button
                                onClick={() => handleCopyToClipboard(result.jobDescriptionMarkdown, "jd")}
                                className="text-xxs font-semibold text-[#0a66c2] hover:underline"
                              >
                                {copiedJd ? "Copied!" : "Copy JD Code"}
                              </button>
                            </div>

                            {/* Job Post Hero Banner Representation */}
                            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white relative">
                              <div className="absolute top-3 right-3 text-xxs font-semibold bg-indigo-500 px-2 py-0.5 rounded uppercase tracking-wider">
                                Apply
                              </div>
                              <p className="text-xxs text-slate-400 font-mono tracking-widest uppercase">Verified Vacancy</p>
                              <h3 className="text-lg font-bold font-display leading-tight mt-1 truncate">{result.roleTitle}</h3>
                              <p className="text-xs text-indigo-200 mt-1">Remote / Worldwide Eligible · Full-Time</p>
                            </div>

                            {/* JD Content Scrolling in Fake LinkedIn container */}
                            <div className="p-6 bg-white prose prose-sm max-w-none text-xs text-slate-600 leading-relaxed border-t border-slate-100 max-h-96 overflow-y-auto">
                              <ReactMarkdown>{result.jobDescriptionMarkdown}</ReactMarkdown>
                            </div>
                          </div>

                          {/* LinkedIn Mock Post Action Buttons */}
                          <div className="bg-white border-t border-slate-100 px-4 py-2 flex items-center justify-between text-[#5e5e5e] text-xs font-semibold">
                            <button className="flex items-center space-x-2 hover:bg-slate-100 px-3 py-2 rounded-lg transition-all">
                              <ThumbsUp className="w-4 h-4" />
                              <span>Like</span>
                            </button>
                            <button className="flex items-center space-x-2 hover:bg-slate-100 px-3 py-2 rounded-lg transition-all">
                              <div className="w-4 h-4 rounded-xs border border-[#5e5e5e] flex items-center justify-center font-bold text-xxs leading-none">C</div>
                              <span>Comment</span>
                            </button>
                            <button className="flex items-center space-x-2 hover:bg-slate-100 px-3 py-2 rounded-lg transition-all">
                              <Sparkles className="w-4 h-4 text-indigo-500" />
                              <span>Share in Feed</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: INTERVIEW GUIDE ACCORDION (10 Structural STAR questions) */}
                  {activeTab === "interview" && (
                    <div className="space-y-4 print:block">
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 leading-relaxed flex items-start space-x-2.5 print:hidden">
                        <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>Methodology focus:</strong> Each question targets a distinct hard stack tool or cultural soft behavior extracted from your raw specifications. Interviewers should expect the candidate to structure answers with the **STAR** framework (Situation, Task, Action, Result).
                        </div>
                      </div>

                      {/* 10 QUESTIONS GRID ACCORDION */}
                      <div className="space-y-3.5 print:space-y-6">
                        {result.interviewGuide.map((q, idx) => {
                          const isExpanded = expandedQuestionId === q.id;
                          return (
                            <div
                              key={q.id}
                              id={`interview-q-card-${q.id}`}
                              className={`bg-white rounded-xl border border-slate-200 overflow-hidden transition-all print:border-none print:shadow-none`}
                            >
                              {/* Accordion Trigger Head */}
                              <div
                                onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                                className={`p-4 flex items-start justify-between cursor-pointer group hover:bg-slate-50 transition-all select-none print:pointer-events-none print:bg-transparent print:p-0`}
                              >
                                <div className="flex space-x-3.5 min-w-0 pr-2">
                                  <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-700 text-xs font-bold font-mono">
                                    {idx + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-all">
                                      {q.question}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-1.5 flex-wrap gap-y-1">
                                      <span className="text-xxs font-mono text-slate-400">Targeting:</span>
                                      <span className="inline-block text-xxxs font-semibold px-2 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200">
                                        {q.targetSkill}
                                      </span>
                                      <span className={`inline-block text-xxxs font-semibold px-2 py-0.2 rounded border ${
                                        q.skillType === "hard"
                                          ? "bg-blue-50 text-blue-700 border-blue-150"
                                          : "bg-purple-50 text-purple-700 border-purple-150"
                                      }`}>
                                        {q.skillType === "hard" ? "Hard Core competency" : "Soft Behavioral"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2 flex-shrink-0 print:hidden">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyToClipboard(q.question, "q", q.id);
                                    }}
                                    id={`copy-q-btn-${q.id}`}
                                    className="p-1 px-2 rounded-lg border border-slate-100 hover:border-slate-300 text-slate-500 hover:text-indigo-600 transition-all bg-white hover:bg-slate-50 text-xxs font-semibold"
                                    title="Copy this behavioral question"
                                  >
                                    {copiedQuestionId === q.id ? "Copied" : "Copy"}
                                  </button>
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-slate-400" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                  )}
                                </div>
                              </div>

                              {/* Accordion Content Details */}
                              {(isExpanded || window.matchMedia("print").matches) && (
                                <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50 pt-3 text-xs text-slate-600 space-y-2.5 leading-relaxed print:bg-transparent print:border-none print:px-0 print:pb-0">
                                  <div className="flex items-start space-x-2">
                                    <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5 print:hidden" />
                                    <div>
                                      <span className="font-semibold text-slate-800 block">Question Scope &amp; Target Strategy:</span>
                                      <span>Focuses on validating candidate's technical fluency or cultural adaptation relating to {q.targetSkill}. Evaluates if they have worked under similar operational constraints in their previous environments.</span>
                                    </div>
                                  </div>

                                  <div className="bg-white border border-slate-200/60 rounded-xl p-3.5 space-y-2 print:border-none print:p-0">
                                    <div className="flex items-center space-x-1 text-slate-800 font-semibold text-xxs uppercase tracking-wider font-mono">
                                      <Lightbulb className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                      <span>Interviewer Guidance Checklist:</span>
                                    </div>
                                    <p className="text-slate-600 whitespace-pre-line leading-relaxed font-sans">{q.whatToLookFor}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: LIVE EVALUATOR SCORECARD */}
                  {activeTab === "scorecard" && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
                      
                      {/* CANDIDATE SPEC AND METADATA */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 pb-5">
                        <div className="space-y-1">
                          <label className="block text-xxs font-semibold text-slate-500 uppercase tracking-widest font-mono">
                            Candidate full name
                          </label>
                          <input
                            id="candidate-name-input"
                            type="text"
                            value={scorecard.candidateName}
                            onChange={(e) => setScorecard(prev => ({ ...prev, candidateName: e.target.value }))}
                            placeholder="e.g. John Doe"
                            className="w-full text-xs rounded-lg border border-slate-200 p-2 focus:ring-1 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-800 font-semibold bg-slate-50/50"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xxs font-semibold text-slate-500 uppercase tracking-widest font-mono">
                            Leaded Interviewer
                          </label>
                          <input
                            id="interviewer-name-input"
                            type="text"
                            value={scorecard.interviewerName}
                            onChange={(e) => setScorecard(prev => ({ ...prev, interviewerName: e.target.value }))}
                            placeholder="e.g. Sarah Connor (HR)"
                            className="w-full text-xs rounded-lg border border-slate-200 p-2 focus:ring-1 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-800 bg-slate-50/50"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xxs font-semibold text-slate-500 uppercase tracking-widest font-mono">
                            Session Date
                          </label>
                          <input
                            type="date"
                            value={scorecard.interviewDate}
                            onChange={(e) => setScorecard(prev => ({ ...prev, interviewDate: e.target.value }))}
                            className="w-full text-xs rounded-lg border border-slate-200 p-2 focus:ring-1 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-800 bg-slate-50/50"
                          />
                        </div>
                      </div>

                      {/* LIVE EVAL STATS BAR */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-4 space-y-1">
                          <span className="block text-xxs font-semibold text-slate-500 uppercase tracking-widest font-mono">
                            Progress tracking ({scorecard.evaluations.filter(ev => ev.rating > 0).length}/10)
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${evaluationProgress}%` }}></div>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-700">{Math.round(evaluationProgress)}%</span>
                          </div>
                        </div>

                        <div className="md:col-span-8 flex space-x-4 justify-around border-t md:border-t-0 border-slate-200/60 pt-3 md:pt-0">
                          <div className="text-center">
                            <span className="block text-xxs font-semibold text-slate-500 uppercase tracking-widest font-mono">Hard rating</span>
                            <span className="text-lg font-bold font-mono text-blue-700">{hardAvg > 0 ? hardAvg.toFixed(1) : "—"} <span className="text-xs text-slate-400">/ 5</span></span>
                          </div>
                          <div className="text-center">
                            <span className="block text-xxs font-semibold text-slate-500 uppercase tracking-widest font-mono">Soft rating</span>
                            <span className="text-lg font-bold font-mono text-purple-700">{softAvg > 0 ? softAvg.toFixed(1) : "—"} <span className="text-xs text-slate-400">/ 5</span></span>
                          </div>
                          <div className="text-center">
                            <span className="block text-xxs font-semibold text-slate-500 uppercase tracking-widest font-mono">Overall score</span>
                            <span className="text-lg font-bold font-mono text-indigo-700 flex items-center justify-center">
                              {totalAvg > 0 ? totalAvg.toFixed(1) : "—"}
                              <Star className="w-4 h-4 ml-1 fill-indigo-400 text-indigo-500" />
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* QUESTIONS SCORING CHECKMARKS (10 structural loops) */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest font-mono border-b border-slate-100 pb-2">
                          Evaluations by Question Step
                        </h4>
                        
                        {result.interviewGuide.map((q, idx) => {
                          const ev = scorecard.evaluations.find(e => e.questionId === q.id) || { rating: 0, notes: "" };
                          return (
                            <div key={q.id} className="p-4 border border-slate-100 hover:border-slate-200 rounded-xl bg-slate-50/20 space-y-3 transition-all relative">
                              <div className="flex items-start justify-between space-x-3">
                                <div className="flex space-x-2.5 min-w-0">
                                  <span className="flex items-center justify-center w-5 h-5 rounded bg-slate-200 text-slate-800 text-xxs font-bold font-mono flex-shrink-0">
                                    Q{idx + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-900 leading-tight">
                                      {q.question}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <span className="text-xxxs text-slate-400"> competency:</span>
                                      <span className="text-xxxs font-semibold text-slate-600">{q.targetSkill}</span>
                                      <span className={`inline-block text-xxxs font-semibold px-2 py-0.2 rounded ${
                                        q.skillType === "hard" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                                      }`}>
                                        {q.skillType}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Interactive Star Picker Tool */}
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      id={`scorecard-star-${q.id}-${star}`}
                                      onClick={() => handleScorecardRating(q.id, star)}
                                      className="p-0.5 hover:scale-120 transition-all cursor-pointer"
                                    >
                                      <Star
                                        className={`w-4 h-4 ${
                                          star <= ev.rating
                                            ? "fill-indigo-500 text-indigo-500 bg-transparent"
                                            : "text-slate-200 hover:text-indigo-400"
                                        }`}
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Input context for interviewer annotation */}
                              <textarea
                                id={`scorecard-notes-${q.id}`}
                                rows={2}
                                value={ev.notes}
                                onChange={(e) => handleScorecardNotes(q.id, e.target.value)}
                                placeholder="Annotation about situation, star structure responses, or technical gaps noticed..."
                                className="w-full text-xs rounded-lg border border-slate-200/75 p-2 bg-white focus:ring-1 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 size-fit"
                              />

                              {/* Evaluator Helper inline snippet */}
                              <div className="text-xxxs text-slate-400 bg-slate-50 p-2 rounded-md leading-relaxed border border-slate-100 italic">
                                <strong>Evaluation criteria helper:</strong> {q.whatToLookFor.slice(0, 140)}...
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* SUMMARY NOTES */}
                      <div className="space-y-2 border-t border-slate-100 pt-5 pr-1">
                        <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">
                          Overall Assessment &amp; Hiring Recommendation
                        </label>
                        <p className="text-xxs text-slate-400 leading-normal">
                          Write down custom thoughts regarding cultural synergy, growth ceiling, timeline alignment, and next steps workflow.
                        </p>
                        <textarea
                          id="scorecard-summary-input"
                          rows={4}
                          value={scorecard.overallSummary}
                          onChange={(e) => setScorecard(prev => ({ ...prev, overallSummary: e.target.value }))}
                          placeholder="Candidate displayed strong capabilities on React components but lacks deep testing lifecycle experience. Culture integration index feels excellent. Recommend progressing to code pairing stage..."
                          className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:ring-1 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-800 bg-slate-50/20"
                        />
                      </div>

                      {/* PDF PRINT WRAPPER BUTTONS */}
                      <div className="flex justify-end space-x-3.5 pt-4 print:hidden">
                        <button
                          onClick={resetScorecard}
                          id="reset-scorecard-action-bottom"
                          className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-xl border border-slate-200 transition-all flex items-center space-x-1.5 cursor-pointer"
                        >
                          Clear evaluatons
                        </button>
                        <button
                          onClick={handlePrint}
                          id="generate-scorecard-report-action"
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-white" />
                          <span>Generate evaluation report</span>
                        </button>
                      </div>

                    </div>
                  )}

                </div>

              </div>
            ) : (
              /* EMPTY / SEED INSTRUCTION STATE */
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm space-y-6">
                <div className="flex items-center justify-center mx-auto w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse fill-indigo-200" />
                </div>
                
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-xl font-bold font-display text-slate-950">Hiring Sandbox is Ready</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Formulate raw ideas or utilize our industry presets on the left panel. Choose a desired stack and watch the simulator structure absolute blueprints.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto text-left pt-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <Linkedin className="w-5 h-5 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">LinkedIn ready JD</h4>
                    <p className="text-xxs text-slate-500 leading-normal">
                      Search-optimized formatted copy tailored for high click-through engagement, complete with emojified list sections.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">10 behavioral STAR questions</h4>
                    <p className="text-xxs text-slate-500 leading-normal">
                      Specially mapped hard tools testing checkmarks and deep cultural indicators to screen out candidate mismatches.
                    </p>
                  </div>
                </div>

                <div className="text-xxs text-slate-400 pt-2 font-mono">
                  Engine running: Gemini Flash-Latest · 2026 Sandbox Standard
                </div>
              </div>
            )}

          </section>

        </div>
      </main>

      {/* PRINT-ONLY VISUAL DOCUMENT LAYOUT FOR CANDIDATE EVALUATION EXPORTS */}
      {result && (
        <div className="hidden print:block p-12 bg-white text-slate-900 font-sans leading-relaxed max-w-4xl mx-auto">
          <div className="border-b-4 border-slate-900 pb-5 mb-8 flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase font-mono">Verified Candidate Assessment Report</span>
              <h1 className="text-3xl font-bold text-slate-950">{result.roleTitle}</h1>
              <p className="text-sm text-slate-500">Recruitment Sandbox formulated hiring metrics report</p>
            </div>
            <div className="text-right space-y-1.5">
              <div className="inline-flex px-3 py-1 bg-slate-900 text-white rounded text-xs font-bold font-mono">
                OVERALL COMPATIBILITY: {totalAvg > 0 ? `${totalAvg.toFixed(1)} / 5.0` : "PENDING EVAL"}
              </div>
              <p className="text-xxs text-slate-400 font-mono">Printed on: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8 bg-slate-50 p-5 rounded-lg border border-slate-200 text-xs">
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 font-mono uppercase tracking-wider text-xxs">Assessment Metadata</h3>
              <div className="grid grid-cols-2 gap-y-1">
                <span className="text-slate-500">Candidate:</span>
                <span className="text-slate-800 font-bold">{scorecard.candidateName || "Not evaluated"}</span>
                <span className="text-slate-500">Interviewer:</span>
                <span className="text-slate-800 font-semibold">{scorecard.interviewerName || "Not evaluated"}</span>
                <span className="text-slate-500">Scheduled Date:</span>
                <span className="text-slate-800">{scorecard.interviewDate}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 font-mono uppercase tracking-wider text-xxs">Competence score averages</h3>
              <div className="grid grid-cols-2 gap-y-1">
                <span className="text-slate-500">Core Hard skills rating:</span>
                <span className="text-blue-700 font-bold font-mono">{hardAvg > 0 ? `${hardAvg.toFixed(1)} / 5.0` : "No scores"}</span>
                <span className="text-slate-500">Behavioral Soft skills rating:</span>
                <span className="text-purple-700 font-bold font-mono">{softAvg > 0 ? `${softAvg.toFixed(1)} / 5.0` : "No scores"}</span>
                <span className="text-slate-500">Evaluated questions:</span>
                <span className="text-slate-800 font-semibold font-mono">{scorecard.evaluations.filter(ev => ev.rating > 0).length} of 10</span>
              </div>
            </div>
          </div>

          <div className="mb-8 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest font-mono border-b border-slate-200 pb-1.5">
              Overall Candidate assessment Summary
            </h2>
            <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed italic p-4 bg-slate-50 rounded-lg border-l-4 border-indigo-500">
              {scorecard.overallSummary || "No overall recommendations written yet. Add notes to the scorecard view prior to exporting."}
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest font-mono border-b border-slate-200 pb-1.5">
              Detailed Question Responses &amp; Evaluations
            </h2>

            {result.interviewGuide.map((q, qIndex) => {
              const ev = scorecard.evaluations.find(e => e.questionId === q.id) || { rating: 0, notes: "" };
              return (
                <div key={q.id} className="py-4 border-b border-slate-100 last:border-none text-xs space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">
                        Q{qIndex + 1}. {q.question}
                      </h4>
                      <p className="text-xxs text-slate-500 mt-1">
                        Competency: <span className="font-semibold">{q.targetSkill}</span> · Type: <span className="italic">{q.skillType}</span>
                      </p>
                    </div>
                    <div className="font-bold font-mono text-slate-900 px-2 py-1 bg-slate-100 rounded">
                      Rating: {ev.rating > 0 ? `${ev.rating} / 5` : "Unrated"}
                    </div>
                  </div>
                  
                  {ev.notes && (
                    <div className="p-3 bg-slate-50 rounded text-slate-700 leading-normal">
                      <strong>Interviewer Notes:</strong> {ev.notes}
                    </div>
                  )}

                  <div className="text-xxs text-slate-400 italic font-mono pl-3 leading-normal border-l-2 border-slate-200 mt-1">
                    Guidance tips: {q.whatToLookFor}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-16 border-t border-slate-200 pt-8 flex items-center justify-between text-xs text-slate-400">
            <span>Recruitment Sandbox Report · Authenticated layout</span>
            <span>Interviewer Signature: _______________________</span>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 mt-auto py-12 border-t border-slate-800 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed">
            <div className="space-y-3">
              <span className="font-semibold text-white tracking-wider uppercase font-mono">About Recruitment Sandbox</span>
              <p className="opacity-80">
                A highly aligned developer and candidate sourcing simulator engineered specifically for recruiters, fast-growth HR talent agents, and technical team managers.
              </p>
              <div className="text-xxs font-mono text-slate-500">
                Created with the high-speed server-side Google GenAI model standard.
              </div>
            </div>
            <div className="space-y-3">
              <span className="font-semibold text-white tracking-wider uppercase font-mono font-bold">Workspace Standard Guidelines</span>
              <p className="opacity-80">
                Guaranteed full compliance with LinkedIn post sizes, search engine metadata configurations, and STAR behavioral screening principles to avoid interview bias.
              </p>
              <div className="text-xxs font-mono text-slate-500">
                © {new Date().getFullYear()} Recruitment Sandbox Systems. Clean typography paired in Inter & Outfit.
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
