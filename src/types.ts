export interface SkillIdentified {
  name: string;
  type: "hard" | "soft";
}

export interface InterviewQuestion {
  id: number;
  question: string;
  targetSkill: string;
  skillType: "hard" | "soft";
  whatToLookFor: string;
}

export interface ResponseData {
  roleTitle: string;
  jobDescriptionMarkdown: string;
  skillsIdentified: SkillIdentified[];
  interviewGuide: InterviewQuestion[];
}

export interface CandidateEvaluation {
  questionId: number;
  rating: number; // 1 to 5, 0 if unevaluated
  notes: string;
}

export interface CandidateScorecard {
  candidateName: string;
  interviewerName: string;
  interviewDate: string;
  evaluations: CandidateEvaluation[];
  overallSummary: string;
}
