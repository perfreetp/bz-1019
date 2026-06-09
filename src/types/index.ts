export interface PastExamSummary {
  id: string;
  date: string;
  hospital: string;
  type: '胃镜' | '肠镜';
  diagnosis: string;
}

export interface LabResult {
  name: string;
  value: string;
  unit: string;
  reference: string;
  abnormal?: boolean;
}

export interface Patient {
  id: string;
  name: string;
  gender: '男' | '女';
  age: number;
  idCard: string;
  phone: string;
  chiefComplaint: string;
  allergyHistory: string[];
  pastHistory: PastExamSummary[];
  labResults: LabResult[];
  bmi?: number;
  appointmentDate?: string;
}

export interface Consumable {
  name: string;
  quantity: number;
  batchNo: string;
}

export interface Examination {
  id: string;
  patientId: string;
  type: '胃镜' | '肠镜' | '胃肠镜';
  examDate: string;
  examTime: string;
  room: string;
  anesthesiaType: string;
  preoperativeDiagnosis: string;
  bostonScore: number;
  asaGrade: string;
  endoscopeModel: string;
  insertionTime: string;
  deepestReached: string;
  withdrawalTime: string;
  operatorName: string;
  assistantName: string;
  consumables: Consumable[];
  contraindications: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'signed';
  preoperativeMedication: string;
  processNotes: string;
}

export type AnnotationType = 'rect' | 'circle' | 'freehand' | 'arrow' | 'text';

export interface Annotation {
  id: string;
  imageId: string;
  type: AnnotationType;
  geometry: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    points?: { x: number; y: number }[];
    text?: string;
  };
  color: string;
  note: string;
  lesionId?: string;
}

export interface ImageItem {
  id: string;
  examId: string;
  location: string;
  url: string;
  description: string;
  capturedAt: string;
  annotations: Annotation[];
}

export interface Biopsy {
  site: string;
  forcepsCount: number;
  specimenNos: string[];
}

export interface Lesion {
  id: string;
  examId: string;
  location: string;
  sizeMajor: number;
  sizeMinor: number;
  morphology: string;
  surfaceFeature: string;
  forrestGrade: string;
  activeBleeding: boolean;
  preliminaryDiagnosis: string[];
  notes: string;
  imageIds: string[];
  biopsy: Biopsy | null;
}

export interface Report {
  id: string;
  examId: string;
  structuredFindings: string;
  insertedTerms: string[];
  diagnosis: string;
  recommendations: string;
  conclusion: string;
  doctorSignature: string;
  signedAt: string;
  completenessScore: number;
  missingFields: string[];
  lastEditedAt: string;
  versions?: ReportVersion[];
}

export type ReportVersionType = 'before_sign' | 'after_sign' | 'auto_save' | 'manual' | 'restore_before' | 'restore_to';

export interface ReportVersion {
  id: string;
  versionType: ReportVersionType;
  note?: string;
  createdAt: string;
  operatorName?: string;
  snapshot: {
    structuredFindings: string;
    insertedTerms: string[];
    diagnosis: string;
    recommendations: string;
    conclusion: string;
    doctorSignature: string;
    signedAt: string;
    completenessScore: number;
    missingFields: string[];
  };
}

export interface Followup {
  id: string;
  patientId: string;
  patientName: string;
  reason: string;
  plannedDate: string;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'overdue';
  reminderType: string;
  reviewResult: string;
  createdAt: string;
}

export interface QualityMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
}

export type ToolType = 'select' | 'rect' | 'circle' | 'freehand' | 'arrow' | 'text' | 'eraser';
