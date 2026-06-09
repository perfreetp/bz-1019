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

  setCurrentPatient: (id: string) => void;
  addPatient: (patient: Patient) => void;
  importAppointments: (patients: Patient[]) => void;

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

export const useAppStore = create<AppState>((set, get) => ({
  currentPatientId: 'P001',
  patients: mockPatients,
  examinations: mockExaminations,
  images: mockImages,
  lesions: mockLesions,
  report: { ...mockReport },
  followups: mockFollowups,
  selectedExamId: 'E001',
  selectedImageId: 'IMG001',
  selectedLesionId: 'L001',
  currentTool: 'select',
  currentAnnotationColor: '#F53F3F',

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
  },

  addPatient: (patient) => set((s) => ({ patients: [...s.patients, patient] })),
  importAppointments: (patients) => set((s) => ({ patients: [...s.patients, ...patients] })),

  setSelectedExam: (id) => {
    set({ selectedExamId: id });
    const state = get();
    const firstImg = state.images.find((i) => i.examId === id);
    if (firstImg) set({ selectedImageId: firstImg.id });
    const firstLesion = state.lesions.find((l) => l.examId === id);
    if (firstLesion) set({ selectedLesionId: firstLesion.id });
  },

  updateExamField: (examId, field, value) =>
    set((s) => ({
      examinations: s.examinations.map((e) => (e.id === examId ? { ...e, [field]: value } : e)),
    })),

  addConsumable: (examId, consumable) =>
    set((s) => ({
      examinations: s.examinations.map((e) =>
        e.id === examId ? { ...e, consumables: [...e.consumables, consumable] } : e,
      ),
    })),

  removeConsumable: (examId, index) =>
    set((s) => ({
      examinations: s.examinations.map((e) =>
        e.id === examId
          ? { ...e, consumables: e.consumables.filter((_, i) => i !== index) }
          : e,
      ),
    })),

  setSelectedImage: (id) => set({ selectedImageId: id }),
  setCurrentTool: (tool) => set({ currentTool: tool }),
  setAnnotationColor: (color) => set({ currentAnnotationColor: color }),

  addAnnotation: (imageId, annotation) =>
    set((s) => ({
      images: s.images.map((img) =>
        img.id === imageId ? { ...img, annotations: [...img.annotations, annotation] } : img,
      ),
    })),

  updateAnnotation: (imageId, annotationId, updates) =>
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
    })),

  removeAnnotation: (imageId, annotationId) =>
    set((s) => ({
      images: s.images.map((img) =>
        img.id === imageId
          ? { ...img, annotations: img.annotations.filter((a) => a.id !== annotationId) }
          : img,
      ),
    })),

  setSelectedLesion: (id) => set({ selectedLesionId: id }),

  addLesion: (lesion) => set((s) => ({ lesions: [...s.lesions, lesion] })),

  updateLesion: (lesionId, field, value) =>
    set((s) => ({
      lesions: s.lesions.map((l) => (l.id === lesionId ? { ...l, [field]: value } : l)),
    })),

  removeLesion: (lesionId) =>
    set((s) => ({
      lesions: s.lesions.filter((l) => l.id !== lesionId),
      selectedLesionId:
        s.selectedLesionId === lesionId
          ? s.lesions.find((l) => l.id !== lesionId)?.id || ''
          : s.selectedLesionId,
    })),

  registerBiopsy: (lesionId, biopsy) =>
    set((s) => ({
      lesions: s.lesions.map((l) => (l.id === lesionId ? { ...l, biopsy } : l)),
    })),

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
  },

  updateReportField: (field, value) => {
    set((s) => ({ report: { ...s.report, [field]: value } }));
    setTimeout(() => get().checkCompleteness(), 0);
  },

  checkCompleteness: () => {
    const state = get();
    const exam = state.getCurrentExam();
    if (!exam) return;
    const lesions = state.getExamLesions();
    const { score, missingFields } = checkReportCompleteness(exam, lesions, state.report);
    set((s) => ({ report: { ...s.report, completenessScore: score, missingFields } }));
  },

  signReport: (doctorName) =>
    set((s) => ({
      report: { ...s.report, doctorSignature: doctorName, signedAt: new Date().toISOString() },
      examinations: s.examinations.map((e) =>
        e.id === s.selectedExamId ? { ...e, status: 'signed' } : e,
      ),
    })),

  createFollowup: (followup) =>
    set((s) => ({
      followups: [
        ...s.followups,
        { ...followup, id: `F${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) },
      ],
    })),

  updateFollowup: (id, updates) =>
    set((s) => ({
      followups: s.followups.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })),

  markFollowupCompleted: (id, result) =>
    set((s) => ({
      followups: s.followups.map((f) =>
        f.id === id ? { ...f, status: 'completed', reviewResult: result } : f,
      ),
    })),

  getCurrentPatient: () => get().patients.find((p) => p.id === get().currentPatientId),
  getCurrentExam: () => get().examinations.find((e) => e.id === get().selectedExamId),
  getExamImages: () => get().images.filter((i) => i.examId === get().selectedExamId),
  getExamLesions: () => get().lesions.filter((l) => l.examId === get().selectedExamId),
  getImageAnnotations: (imageId) =>
    get().images.find((i) => i.id === imageId)?.annotations || [],
}));
