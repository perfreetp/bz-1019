import { create } from 'zustand';
import type {
  Patient,
  Examination,
  ImageItem,
  Lesion,
  Report,
  Followup,
  Annotation,
  Consumable,
} from '../types';
import {
  mockPatients,
  mockExaminations,
  mockImages,
  mockLesions,
  mockReport,
  mockFollowups,
} from '../utils/mockData';
import { generateStructuredFindings, checkReportCompleteness } from '../utils/reportGenerator';
import { saveToStorage, loadFromStorage } from '../utils/storage';

const PERSIST_KEY = 'app-state-v1';
const PERSIST_FIELDS = [
  'currentPatientId',
  'patients',
  'examinations',
  'images',
  'lesions',
  'report',
  'followups',
  'selectedExamId',
  'selectedImageId',
  'selectedLesionId',
  'currentTool',
  'currentAnnotationColor',
] as const;

interface AppState {
  currentPatientId: string;
  patients: Patient[];
  examinations: Examination[];
  images: ImageItem[];
  lesions: Lesion[];
  report: Report;
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
  importAppointments: (payload: { patients: Patient[]; examinations: Examination[] }) => { added: number };

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

  generateFindings: () => void;
  updateReportField: <K extends keyof Report>(field: K, value: Report[K]) => void;
  checkCompleteness: () => void;
  signReport: (doctorName: string) => void;

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
  const initialReport = (stored.report as Report) || { ...mockReport };
  return {
    currentPatientId: (stored.currentPatientId as string) || 'P001',
    patients: (stored.patients as Patient[]) || mockPatients,
    examinations: (stored.examinations as Examination[]) || mockExaminations,
    images: (stored.images as ImageItem[]) || mockImages,
    lesions: (stored.lesions as Lesion[]) || mockLesions,
    report: initialReport,
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
        set({ report: { ...mockReport, examId: exam.id } });
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
      set({
        patients: [...s.patients, ...dedupPatients],
        examinations: [...s.examinations, ...dedupExams],
      });
      persistState(get());
      return { added: dedupPatients.length };
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

    generateFindings: () => {
      const state = get();
      const exam = state.getCurrentExam();
      if (!exam) return;
      const lesions = state.getExamLesions();
      const allAnnotations: Annotation[] = [];
      state.images.forEach((img) => {
        img.annotations.forEach((a) => allAnnotations.push({ ...a, imageLocation: img.location } as any));
      });
      const findings = generateStructuredFindings(exam, lesions, allAnnotations);
      const updated = { ...state.report, structuredFindings: findings, examId: exam.id };
      const { score, missingFields } = checkReportCompleteness(exam, lesions, updated);
      set({ report: { ...updated, completenessScore: score, missingFields } });
      persistState(get());
    },

    updateReportField: (field, value) => {
      set((s) => ({ report: { ...s.report, [field]: value } }));
      persistState(get());
      setTimeout(() => get().checkCompleteness(), 0);
    },

    checkCompleteness: () => {
      const state = get();
      const exam = state.getCurrentExam();
      if (!exam) return;
      const lesions = state.getExamLesions();
      const { score, missingFields } = checkReportCompleteness(exam, lesions, state.report);
      set((s) => ({ report: { ...s.report, completenessScore: score, missingFields } }));
      persistState(get());
    },

    signReport: (doctorName) => {
      set((s) => ({
        report: { ...s.report, doctorSignature: doctorName, signedAt: new Date().toISOString() },
        examinations: s.examinations.map((e) =>
          e.id === s.selectedExamId ? { ...e, status: 'signed' } : e,
        ),
      }));
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
