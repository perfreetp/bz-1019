import { create } from 'zustand';
import type {
  Patient,
  Examination,
  ImageItem,
  Lesion,
  Report,
  ReportVersion,
  ReportVersionType,
  Followup,
  Annotation,
  Consumable,
} from '../types';
import {
  mockPatients,
  mockExaminations,
  mockImages,
  mockLesions,
  mockReports,
  mockFollowups,
} from '../utils/mockData';
import { generateStructuredFindings, checkReportCompleteness } from '../utils/reportGenerator';
import { saveToStorage, loadFromStorage } from '../utils/storage';

const PERSIST_KEY = 'app-state-v2';
const PERSIST_FIELDS = [
  'currentPatientId',
  'patients',
  'examinations',
  'images',
  'lesions',
  'reports',
  'followups',
  'selectedExamId',
  'selectedImageId',
  'selectedLesionId',
  'currentTool',
  'currentAnnotationColor',
] as const;

function emptyReportForExam(examId: string): Report {
  return {
    id: `R${examId}-${Date.now()}`,
    examId,
    structuredFindings: '',
    insertedTerms: [],
    diagnosis: '',
    recommendations: '',
    conclusion: '',
    doctorSignature: '',
    signedAt: '',
    completenessScore: 0,
    missingFields: [],
    lastEditedAt: '',
  };
}

function nowStamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface AppState {
  currentPatientId: string;
  patients: Patient[];
  examinations: Examination[];
  images: ImageItem[];
  lesions: Lesion[];
  reports: Report[];
  followups: Followup[];
  selectedExamId: string;
  selectedImageId: string;
  selectedLesionId: string;
  currentTool: string;
  currentAnnotationColor: string;

  importNotification: { type: 'success' | 'error' | 'info'; message: string } | null;
  setImportNotification: (n: AppState['importNotification']) => void;

  setCurrentPatient: (id: string) => void;
  addPatient: (patient: Patient) => void;
  importAppointments: (payload: { patients: Patient[]; examinations: Examination[] }) => { added: number; addedExams: number; skipped: number };

  setSelectedExam: (id: string) => void;
  updateExamField: <K extends keyof Examination>(examId: string, field: K, value: Examination[K]) => void;
  addConsumable: (examId: string, consumable: Consumable) => void;
  removeConsumable: (examId: string, index: number) => void;

  setSelectedImage: (id: string) => void;
  setCurrentTool: (tool: string) => void;
  setAnnotationColor: (color: string) => void;
  addAnnotation: (imageId: string, annotation: Annotation) => void;
  updateAnnotation: (imageId: string, annotationId: string, updates: Partial<Annotation>) => void;
  removeAnnotation: (imageId: string, annotationId: string) => void;

  setSelectedLesion: (id: string) => void;
  addLesion: (lesion: Lesion) => void;
  updateLesion: <K extends keyof Lesion>(lesionId: string, field: K, value: Lesion[K]) => void;
  removeLesion: (lesionId: string) => void;
  registerBiopsy: (lesionId: string, biopsy: Lesion['biopsy']) => void;

  getReportByExamId: (examId: string) => Report | undefined;
  getCurrentReport: () => Report | undefined;
  touchReport: (examId: string) => void;
  generateFindings: () => void;
  updateReportField: <K extends keyof Report>(field: K, value: Report[K]) => void;
  checkCompleteness: () => void;
  signReport: (doctorName: string) => void;
  snapshotReport: (examId: string, versionType: ReportVersionType, note?: string, operatorName?: string) => void;
  getReportVersions: (examId: string) => ReportVersion[];
  restoreReportVersion: (examId: string, versionId: string, operatorName?: string) => void;

  createFollowup: (followup: Omit<Followup, 'id' | 'createdAt'>) => void;
  updateFollowup: (id: string, updates: Partial<Followup>) => void;
  markFollowupCompleted: (id: string, result: string) => void;

  getCurrentPatient: () => Patient | undefined;
  getCurrentExam: () => Examination | undefined;
  getExamImages: () => ImageItem[];
  getExamLesions: () => Lesion[];
  getImageAnnotations: (imageId: string) => Annotation[];
}

function hydrateFromStorage(): Partial<AppState> {
  try {
    const raw = localStorage.getItem('endo-assist-' + PERSIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed || {};
    }
  } catch (e) {
    console.warn('[Store] Hydrate failed, using mock defaults:', e);
  }
  return {};
}

function persistState(state: AppState) {
  try {
    const toSave: Record<string, any> = {};
    PERSIST_FIELDS.forEach((k) => {
      (toSave as any)[k] = (state as any)[k];
    });
    localStorage.setItem('endo-assist-' + PERSIST_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('[Store] Persist failed:', e);
  }
}

const stored = hydrateFromStorage();

export const useAppStore = create<AppState>((set, get) => {
  const initialReports: Report[] = Array.isArray(stored.reports) ? (stored.reports as Report[]) : mockReports;
  return {
    currentPatientId: (stored.currentPatientId as string) || 'P001',
    patients: (stored.patients as Patient[]) || mockPatients,
    examinations: (stored.examinations as Examination[]) || mockExaminations,
    images: (stored.images as ImageItem[]) || mockImages,
    lesions: (stored.lesions as Lesion[]) || mockLesions,
    reports: initialReports,
    followups: (stored.followups as Followup[]) || mockFollowups,
    selectedExamId: (stored.selectedExamId as string) || 'E001',
    selectedImageId: (stored.selectedImageId as string) || 'IMG001',
    selectedLesionId: (stored.selectedLesionId as string) || 'L001',
    currentTool: (stored.currentTool as string) || 'select',
    currentAnnotationColor: (stored.currentAnnotationColor as string) || '#F53F3F',
    importNotification: null,
    setImportNotification: (n) => set({ importNotification: n }),

    setCurrentPatient: (id) => {
      set({ currentPatientId: id });
      const state = get();
      const exam = state.examinations.find((e) => e.patientId === id);
      if (exam) {
        set({ selectedExamId: exam.id });
        const firstImg = state.images.find((i) => i.examId === exam.id);
        if (firstImg) set({ selectedImageId: firstImg.id });
        const firstLesion = state.lesions.find((l) => l.examId === exam.id);
        if (firstLesion) set({ selectedLesionId: firstLesion.id });
      }
      persistState(get());
    },

    addPatient: (patient) => {
      set((s) => ({ patients: [...s.patients, patient] }));
      persistState(get());
    },
    importAppointments: ({ patients: newPatients, examinations: newExams }) => {
      const s = get();
      const existingIds = new Set(s.patients.map((p) => p.id));
      const dedupPatients = newPatients.filter((p) => !existingIds.has(p.id));
      const existingExamIds = new Set(s.examinations.map((e) => e.id));
      const dedupExams = newExams.filter((e) => !existingExamIds.has(e.id));
      const newReports = dedupExams.map((e) => emptyReportForExam(e.id));
      set({
        patients: [...s.patients, ...dedupPatients],
        examinations: [...s.examinations, ...dedupExams],
        reports: [...s.reports, ...newReports],
      });
      persistState(get());
      return {
        added: dedupPatients.length,
        addedExams: dedupExams.length,
        skipped: newPatients.length - dedupPatients.length,
      };
    },

    setSelectedExam: (id) => {
      set({ selectedExamId: id });
      const state = get();
      const firstImg = state.images.find((i) => i.examId === id);
      if (firstImg) set({ selectedImageId: firstImg.id });
      const firstLesion = state.lesions.find((l) => l.examId === id);
      if (firstLesion) set({ selectedLesionId: firstLesion.id });
      persistState(get());
    },

    updateExamField: (examId, field, value) => {
      set((s) => ({
        examinations: s.examinations.map((e) => (e.id === examId ? { ...e, [field]: value } : e)),
      }));
      persistState(get());
    },

    addConsumable: (examId, consumable) => {
      set((s) => ({
        examinations: s.examinations.map((e) =>
          e.id === examId ? { ...e, consumables: [...e.consumables, consumable] } : e,
        ),
      }));
      persistState(get());
    },

    removeConsumable: (examId, index) => {
      set((s) => ({
        examinations: s.examinations.map((e) =>
          e.id === examId
            ? { ...e, consumables: e.consumables.filter((_, i) => i !== index) }
            : e,
        ),
      }));
      persistState(get());
    },

    setSelectedImage: (id) => {
      set({ selectedImageId: id });
      persistState(get());
    },
    setCurrentTool: (tool) => {
      set({ currentTool: tool });
      persistState(get());
    },
    setAnnotationColor: (color) => {
      set({ currentAnnotationColor: color });
      persistState(get());
    },

    addAnnotation: (imageId, annotation) => {
      set((s) => ({
        images: s.images.map((img) =>
          img.id === imageId ? { ...img, annotations: [...img.annotations, annotation] } : img,
        ),
      }));
      persistState(get());
    },

    updateAnnotation: (imageId, annotationId, updates) => {
      set((s) => ({
        images: s.images.map((img) =>
          img.id === imageId
            ? {
                ...img,
                annotations: img.annotations.map((a) =>
                  a.id === annotationId ? { ...a, ...updates } : a,
                ),
              }
            : img,
        ),
      }));
      persistState(get());
    },

    removeAnnotation: (imageId, annotationId) => {
      set((s) => ({
        images: s.images.map((img) =>
          img.id === imageId
            ? { ...img, annotations: img.annotations.filter((a) => a.id !== annotationId) }
            : img,
        ),
      }));
      persistState(get());
    },

    setSelectedLesion: (id) => {
      set({ selectedLesionId: id });
      persistState(get());
    },

    addLesion: (lesion) => {
      set((s) => ({ lesions: [...s.lesions, lesion] }));
      persistState(get());
    },

    updateLesion: (lesionId, field, value) => {
      set((s) => ({
        lesions: s.lesions.map((l) => (l.id === lesionId ? { ...l, [field]: value } : l)),
      }));
      persistState(get());
    },

    removeLesion: (lesionId) => {
      set((s) => ({
        lesions: s.lesions.filter((l) => l.id !== lesionId),
        selectedLesionId:
          s.selectedLesionId === lesionId
            ? s.lesions.find((l) => l.id !== lesionId)?.id || ''
            : s.selectedLesionId,
      }));
      persistState(get());
    },

    registerBiopsy: (lesionId, biopsy) => {
      set((s) => ({
        lesions: s.lesions.map((l) => (l.id === lesionId ? { ...l, biopsy } : l)),
      }));
      persistState(get());
    },

    getReportByExamId: (examId) => {
      const s = get();
      let r = s.reports.find((r) => r.examId === examId);
      if (!r) {
        r = emptyReportForExam(examId);
        set({ reports: [...s.reports, r] });
        persistState(get());
      }
      return r;
    },
    getCurrentReport: () => get().getReportByExamId(get().selectedExamId),
    touchReport: (examId) => {
      set((s) => ({
        reports: s.reports.map((r) =>
          r.examId === examId ? { ...r, lastEditedAt: nowStamp() } : r,
        ),
      }));
    },

    generateFindings: () => {
      const state = get();
      const exam = state.getCurrentExam();
      if (!exam) return;
      state.getReportByExamId(exam.id);
      const lesions = state.getExamLesions();
      const allAnnotations: Annotation[] = [];
      state.images.forEach((img) => {
        img.annotations.forEach((a) => allAnnotations.push({ ...a, imageLocation: img.location } as any));
      });
      const findings = generateStructuredFindings(exam, lesions, allAnnotations);
      set((s) => ({
        reports: s.reports.map((r) => {
          if (r.examId !== exam.id) return r;
          const updated = { ...r, structuredFindings: findings, examId: exam.id };
          const { score, missingFields } = checkReportCompleteness(exam, lesions, updated);
          return { ...updated, completenessScore: score, missingFields, lastEditedAt: nowStamp() };
        }),
      }));
      persistState(get());
    },

    updateReportField: (field, value) => {
      const examId = get().selectedExamId;
      get().getReportByExamId(examId);
      set((s) => ({
        reports: s.reports.map((r) =>
          r.examId === examId ? { ...r, [field]: value, lastEditedAt: nowStamp() } : r,
        ),
      }));
      persistState(get());
      setTimeout(() => get().checkCompleteness(), 0);
    },

    checkCompleteness: () => {
      const state = get();
      const exam = state.getCurrentExam();
      if (!exam) return;
      const report = state.getCurrentReport() || emptyReportForExam(exam.id);
      const lesions = state.getExamLesions();
      const { score, missingFields } = checkReportCompleteness(exam, lesions, report);
      set((s) => ({
        reports: s.reports.map((r) =>
          r.examId === exam.id ? { ...r, completenessScore: score, missingFields } : r,
        ),
      }));
      persistState(get());
    },

    signReport: (doctorName) => {
      const examId = get().selectedExamId;
      get().snapshotReport(examId, 'before_sign', '签发前快照', doctorName);
      set((s) => ({
        reports: s.reports.map((r) =>
          r.examId === examId
            ? { ...r, doctorSignature: doctorName, signedAt: new Date().toISOString(), lastEditedAt: nowStamp() }
            : r,
        ),
        examinations: s.examinations.map((e) =>
          e.id === s.selectedExamId ? { ...e, status: 'signed' } : e,
        ),
      }));
      get().snapshotReport(examId, 'after_sign', '签发完成', doctorName);
      persistState(get());
    },

    snapshotReport: (examId, versionType, note, operatorName) => {
      const s = get();
      const report = s.getReportByExamId(examId);
      if (!report) return;
      const { structuredFindings, insertedTerms, diagnosis, recommendations, conclusion, doctorSignature, signedAt, completenessScore, missingFields } = report;
      const version: ReportVersion = {
        id: `V${examId}-${Date.now()}`,
        versionType,
        note,
        createdAt: nowStamp(),
        operatorName,
        snapshot: { structuredFindings, insertedTerms: [...insertedTerms], diagnosis, recommendations, conclusion, doctorSignature, signedAt, completenessScore, missingFields: [...missingFields] },
      };
      set((state) => ({
        reports: state.reports.map((r) =>
          r.examId === examId
            ? { ...r, versions: [...(r.versions || []), version], lastEditedAt: nowStamp() }
            : r,
        ),
      }));
    },

    getReportVersions: (examId) => {
      const r = get().getReportByExamId(examId);
      return r?.versions || [];
    },

    restoreReportVersion: (examId, versionId, operatorName) => {
      const r = get().getReportByExamId(examId);
      if (!r) return;
      const version = (r.versions || []).find((v) => v.id === versionId);
      if (!version) return;
      const versionTypeLabel = version.versionType === 'before_sign' ? '签发前' :
        version.versionType === 'after_sign' ? '已签发' :
        version.versionType === 'manual' ? '手动快照' :
        version.versionType === 'auto_save' ? '自动保存' : '历史版本';
      get().snapshotReport(examId, 'restore_before', `恢复前状态（目标：${versionTypeLabel}）`, operatorName);
      set((s) => ({
        reports: s.reports.map((rep) => {
          if (rep.examId !== examId) return rep;
          return {
            ...rep,
            structuredFindings: version.snapshot.structuredFindings,
            insertedTerms: [...version.snapshot.insertedTerms],
            diagnosis: version.snapshot.diagnosis,
            recommendations: version.snapshot.recommendations,
            conclusion: version.snapshot.conclusion,
            doctorSignature: version.snapshot.doctorSignature,
            signedAt: version.snapshot.signedAt,
            completenessScore: version.snapshot.completenessScore,
            missingFields: [...version.snapshot.missingFields],
            lastEditedAt: nowStamp(),
          };
        }),
      }));
      get().snapshotReport(examId, 'restore_to', `恢复至「${versionTypeLabel}」（${version.id}）`, operatorName);
      persistState(get());
    },

    createFollowup: (followup) => {
      set((s) => ({
        followups: [
          ...s.followups,
          { ...followup, id: `F${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) },
        ],
      }));
      persistState(get());
    },

    updateFollowup: (id, updates) => {
      set((s) => ({
        followups: s.followups.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      }));
      persistState(get());
    },

    markFollowupCompleted: (id, result) => {
      set((s) => ({
        followups: s.followups.map((f) =>
          f.id === id ? { ...f, status: 'completed', reviewResult: result } : f,
        ),
      }));
      persistState(get());
    },

    getCurrentPatient: () => get().patients.find((p) => p.id === get().currentPatientId),
    getCurrentExam: () => get().examinations.find((e) => e.id === get().selectedExamId),
    getExamImages: () => get().images.filter((i) => i.examId === get().selectedExamId),
    getExamLesions: () => get().lesions.filter((l) => l.examId === get().selectedExamId),
    getImageAnnotations: (imageId) =>
      get().images.find((i) => i.id === imageId)?.annotations || [],
  };
});
