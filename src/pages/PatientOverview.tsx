import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import type { Patient, Examination } from '@/types';
import {
  User,
  FileUp,
  Calendar,
  Phone,
  IdCard,
  ClipboardList,
  AlertTriangle,
  Activity,
  Pill,
  PlayCircle,
  FileText,
  CalendarPlus,
  Download,
  ChevronDown,
  Stethoscope,
  Clock,
  CheckCircle,
  Loader2,
  Search,
  Scale,
  ShieldAlert,
  X,
  CheckCircle2,
  Info,
  Upload,
  History,
} from 'lucide-react';

const statusMap = {
  pending: { label: '待检', color: 'bg-amber-100 text-amber-700' },
  in_progress: { label: '检查中', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-700' },
  signed: { label: '已签发', color: 'bg-purple-100 text-purple-700' },
};

const examTypeMap = {
  胃镜: { color: 'bg-rose-50 text-rose-600 border-rose-200', dot: 'bg-rose-500' },
  肠镜: { color: 'bg-sky-50 text-sky-600 border-sky-200', dot: 'bg-sky-500' },
  胃肠镜: { color: 'bg-violet-50 text-violet-600 border-violet-200', dot: 'bg-violet-500' },
};

interface SkippedPatient { patient: Patient; reason: string; }
interface SkippedExam { exam: Examination; reason: string; }

function parseCSV(csv: string): {
  patients: Patient[]; examinations: Examination[];
  fileDupPatients: SkippedPatient[]; fileDupExams: SkippedExam[];
} {
  const lines = csv.replace(/\r/g, '').split('\n').filter((l) => l.trim());
  if (lines.length < 2) throw new Error('CSV 内容为空或只有表头');
  const headers = lines[0].split(',').map((h) => h.trim());
  const requiredFields = ['id', 'name', 'gender', 'age'];
  const hasPatientFields = requiredFields.every((f) => headers.includes(f));
  const hasExamFields = headers.includes('examId') || headers.includes('examDate');
  if (!hasPatientFields && !hasExamFields) throw new Error('缺少必填列：至少需要患者列(id/name/gender/age)或检查列(examId/examDate)');

  const patients: Patient[] = [];
  const examinations: Examination[] = [];
  const fileDupPatients: SkippedPatient[] = [];
  const fileDupExams: SkippedExam[] = [];
  const patientIdSet = new Set<string>();
  const examIdSet = new Set<string>();
  const examKeySet = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((v) => v.replace(/^"|"$/g, '').trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h] = values[idx] || ''));

    const hasRowPatient = row.id && row.name;
    const hasRowExam = row.examId || (row.examDate && row.id);

    if (hasRowPatient) {
      const gender = (row.gender === '女' ? '女' : '男') as Patient['gender'];
      const patient: Patient = {
        id: row.id,
        name: row.name,
        gender,
        age: parseInt(row.age) || 0,
        idCard: row.idCard || '',
        phone: row.phone || '',
        chiefComplaint: row.chiefComplaint || '',
        allergyHistory: row.allergyHistory ? row.allergyHistory.split(/[、;；]/).filter(Boolean) : [],
        pastHistory: [],
        labResults: [],
        bmi: row.bmi ? parseFloat(row.bmi) : undefined,
        appointmentDate: row.appointmentDate || row.examDate,
      };
      if (!patientIdSet.has(row.id)) {
        patientIdSet.add(row.id);
        patients.push(patient);
      } else {
        fileDupPatients.push({ patient, reason: '文件内患者ID重复' });
      }
    }

    if (hasRowExam) {
      const hasExplicitId = !!row.examId;
      const examId = row.examId || `E${row.id}-${i}`;
      const examType = ((row.examType || '胃镜') as Examination['type']) || '胃镜';
      const examDate = row.examDate || '2026-06-09';
      const compositeKey = `${row.id}|${examDate}|${examType}`;
      const exam: Examination = {
        id: examId,
        patientId: row.id || '',
        type: examType,
        examDate,
        examTime: row.examTime || '09:00',
        room: row.room || '内镜1室',
        anesthesiaType: row.anesthesiaType || '静脉麻醉',
        preoperativeDiagnosis: row.preoperativeDiagnosis || row.chiefComplaint || '',
        bostonScore: parseInt(row.bostonScore) || 0,
        asaGrade: row.asaGrade || '',
        endoscopeModel: row.endoscopeModel || '',
        insertionTime: row.insertionTime || '',
        deepestReached: row.deepestReached || '',
        withdrawalTime: row.withdrawalTime || '',
        operatorName: row.operatorName || '',
        assistantName: row.assistantName || '',
        consumables: [],
        contraindications: [],
        status: 'pending',
        preoperativeMedication: row.preoperativeMedication || '',
        processNotes: row.processNotes || '',
      };
      if (!hasExplicitId && examKeySet.has(compositeKey)) {
        fileDupExams.push({ exam, reason: `同患者同日同类型重复（${examDate} ${examType}）` });
      } else if (!examIdSet.has(examId)) {
        examIdSet.add(examId);
        if (!hasExplicitId) examKeySet.add(compositeKey);
        examinations.push(exam);
      } else {
        fileDupExams.push({ exam, reason: `文件内检查编号${examId}重复` });
      }
    }
  }
  return { patients, examinations, fileDupPatients, fileDupExams };
}

function parseJSON(text: string): {
  patients: Patient[]; examinations: Examination[];
  fileDupPatients: SkippedPatient[]; fileDupExams: SkippedExam[];
} {
  const data = JSON.parse(text);
  let rawPatients: Patient[] = [];
  let rawExams: Examination[] = [];
  if (Array.isArray(data)) {
    rawPatients = data as Patient[];
  } else if (data) {
    if (Array.isArray(data.patients)) rawPatients = data.patients as Patient[];
    else if (Array.isArray(data.items)) rawPatients = data.items as Patient[];
    if (Array.isArray(data.examinations)) rawExams = data.examinations as Examination[];
    else if (Array.isArray(data.exams)) rawExams = data.exams as Examination[];
  }
  if (rawPatients.length === 0 && rawExams.length === 0) {
    throw new Error('JSON 结构不支持，需是数组或包含 patients/examinations 字段的对象');
  }
  const patientIdSet = new Set<string>();
  const patients: Patient[] = [];
  const fileDupPatients: SkippedPatient[] = [];
  for (const p of rawPatients) {
    if (p && p.id) {
      if (!patientIdSet.has(p.id)) {
        patientIdSet.add(p.id);
        patients.push(p);
      } else {
        fileDupPatients.push({ patient: p, reason: '文件内患者ID重复' });
      }
    }
  }
  const examIdSet = new Set<string>();
  const examinations: Examination[] = [];
  const fileDupExams: SkippedExam[] = [];
  for (const e of rawExams) {
    if (e && e.id) {
      if (!examIdSet.has(e.id)) {
        examIdSet.add(e.id);
        examinations.push(e);
      } else {
        fileDupExams.push({ exam: e, reason: `文件内检查编号${e.id}重复` });
      }
    }
  }
  return { patients, examinations, fileDupPatients, fileDupExams };
}

function ImportToast() {
  const { importNotification, setImportNotification } = useAppStore();
  useEffect(() => {
    if (!importNotification) return;
    const t = setTimeout(() => setImportNotification(null), 4500);
    return () => clearTimeout(t);
  }, [importNotification, setImportNotification]);
  if (!importNotification) return null;
  const cfg = {
    success: { bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2, iconColor: 'text-emerald-500', textColor: 'text-emerald-800' },
    error: { bg: 'bg-rose-50 border-rose-200', icon: AlertTriangle, iconColor: 'text-rose-500', textColor: 'text-rose-800' },
    info: { bg: 'bg-blue-50 border-blue-200', icon: Info, iconColor: 'text-blue-500', textColor: 'text-blue-800' },
  }[importNotification.type];
  const Icon = cfg.icon;
  return (
    <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-right duration-300">
      <div className={`flex items-start gap-3 min-w-[320px] max-w-md px-4 py-3 rounded-xl border shadow-lg ${cfg.bg}`}>
        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${cfg.iconColor}`} />
        <div className={`flex-1 text-sm font-medium leading-relaxed ${cfg.textColor}`}>
          {importNotification.message}
        </div>
        <button
          onClick={() => setImportNotification(null)}
          className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/60 transition-colors ${cfg.iconColor}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function PatientOverview() {
  const navigate = useNavigate();
  const {
    patients,
    currentPatientId,
    selectedExamId,
    setCurrentPatient,
    setSelectedExam,
    getCurrentPatient,
    examinations,
    reports,
    importAppointments,
    importNotification,
    setImportNotification,
  } = useAppStore();

  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const [importPreview, setImportPreview] = useState<{
    newPatients: Patient[];
    newExams: Examination[];
    skippedPatients: SkippedPatient[];
    skippedExams: SkippedExam[];
    parsed: { patients: Patient[]; examinations: Examination[] };
  } | null>(null);

  const patient = getCurrentPatient();
  const currentExam = examinations.find((e) => e.patientId === currentPatientId);
  const today = '2026-06-09';
  const todayExams = examinations.filter((e) => e.examDate === today);

  const filteredPatients = patients.filter((p) =>
    p.name.includes(searchKeyword) || p.id.includes(searchKeyword),
  );

  const getPatientById = (id: string) => patients.find((p) => p.id === id);

  const handleImportAppointments = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,.csv';
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const ext = file.name.split('.').pop()?.toLowerCase();
      try {
        const text = await file.text();
        if (!text.trim()) throw new Error('文件内容为空');
        let parsed;
        if (ext === 'csv') {
          parsed = parseCSV(text);
        } else if (ext === 'json') {
          parsed = parseJSON(text);
        } else {
          try { parsed = parseJSON(text); } catch { parsed = parseCSV(text); }
        }
        if (!parsed.patients || parsed.patients.length === 0) {
          if (!parsed.examinations || parsed.examinations.length === 0) {
            throw new Error('未解析到任何有效患者或检查记录');
          }
        }

        const existingPatientIds = new Set(patients.map((p) => p.id));
        const existingExamIds = new Set(examinations.map((e) => e.id));

        const newPatientsFromFile = parsed.patients.filter((p) => !existingPatientIds.has(p.id));
        const skippedPatientsStore: SkippedPatient[] = parsed.patients
          .filter((p) => existingPatientIds.has(p.id))
          .map((p) => ({ patient: p, reason: '系统中已存在该患者' }));

        const validExamPatientIds = new Set<string>([
          ...newPatientsFromFile.map((p) => p.id),
          ...patients.map((p) => p.id),
        ]);
        const examsWithValidPatient = parsed.examinations.filter((e) => validExamPatientIds.has(e.patientId));
        const examsInvalidPatient: SkippedExam[] = parsed.examinations
          .filter((e) => !validExamPatientIds.has(e.patientId))
          .map((e) => ({ exam: e, reason: `关联患者ID（${e.patientId || '空'}）不存在` }));

        const newExamsFromFile = examsWithValidPatient.filter((e) => !existingExamIds.has(e.id));
        const skippedExamsStore: SkippedExam[] = examsWithValidPatient
          .filter((e) => existingExamIds.has(e.id))
          .map((e) => ({ exam: e, reason: `系统中已存在检查${e.id}` }));

        const skippedPatients = [...skippedPatientsStore, ...parsed.fileDupPatients];
        const skippedExams = [...skippedExamsStore, ...parsed.fileDupExams, ...examsInvalidPatient];

        const fullParsed = {
          patients: parsed.patients,
          examinations: parsed.examinations,
          fileDupPatients: parsed.fileDupPatients,
          fileDupExams: parsed.fileDupExams,
          examsInvalidPatient,
        };
        setImportPreview({
          newPatients: newPatientsFromFile,
          newExams: newExamsFromFile,
          skippedPatients,
          skippedExams,
          parsed: fullParsed as any,
        });
      } catch (err: any) {
        console.error('[Import error]', err);
        setImportNotification({
          type: 'error',
          message: `导入失败（${ext?.toUpperCase() || '文件'}）：${err?.message || '未知错误'}\n请检查：JSON 格式是否合法，或 CSV 是否包含 id/name/gender/age 列。`,
        });
      }
    };
    fileInput.click();
  };

  const confirmImport = () => {
    if (!importPreview) return;
    const { newPatients, newExams } = importPreview;
    if (newPatients.length === 0 && newExams.length === 0) {
      setImportPreview(null);
      setImportNotification({ type: 'info', message: '没有可导入的新记录。' });
      return;
    }
    const result = importAppointments({ patients: newPatients, examinations: newExams });
    const examCount = newExams.length;
    const totalPatientCount = importPreview.parsed?.patients?.length || 0;
    const totalExamCount = importPreview.parsed?.examinations?.length || 0;
    const msgParts: string[] = [];
    if (result.added > 0) msgParts.push(`新增 ${result.added} 位患者`);
    if (examCount > 0) msgParts.push(`新增 ${examCount} 条检查安排`);
    const skippedCount = totalPatientCount + totalExamCount - (result.added + examCount);
    setImportNotification({
      type: 'success',
      message: `导入成功！${msgParts.join('，')}。${skippedCount > 0 ? `另有 ${skippedCount} 条重复或无效记录已跳过。` : '患者下拉和今日日程已更新。'}`,
    });
    setImportPreview(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <ImportToast />
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="relative">
            <button
              onClick={() => setPatientDropdownOpen(!patientDropdownOpen)}
              className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all min-w-[280px]"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-sm">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-slate-800">
                  {patient?.name || '请选择患者'}
                </div>
                <div className="text-xs text-slate-500">
                  {patient ? `${patient.gender} · ${patient.age}岁` : '患者列表'}
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${patientDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {patientDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-[380px] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-30">
                <div className="p-3 border-b border-slate-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      placeholder="搜索姓名或ID..."
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setCurrentPatient(p.id);
                        setPatientDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50/60 transition-colors text-left ${
                        p.id === currentPatientId ? 'bg-blue-50/80' : ''
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm ${
                        p.gender === '男'
                          ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                          : 'bg-gradient-to-br from-pink-500 to-rose-500'
                      }`}>
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-500">
                          {p.id} · {p.gender} · {p.age}岁
                        </div>
                      </div>
                      {p.id === currentPatientId && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </button>
                  ))}
                  {filteredPatients.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-slate-400">
                      未找到匹配患者
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentExam && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                  statusMap[currentExam.status as keyof typeof statusMap]?.color ||
                  'bg-slate-100 text-slate-700'
                }`}
              >
                {currentExam.status === 'in_progress' && (
                  <Loader2 className="w-3 h-3 animate-spin" />
                )}
                {statusMap[currentExam.status as keyof typeof statusMap]?.label || '未知'}
              </span>
            )}
            <span className="text-xs text-slate-500">
              {patient?.appointmentDate} · 今日预约
            </span>
          </div>

          <button
            onClick={handleImportAppointments}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-sm shadow-blue-500/20 text-sm font-medium"
          >
            <FileUp className="w-4 h-4" />
            导入预约
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {patient ? (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 flex items-stretch gap-6">
                <div className="flex flex-col items-center gap-3 pr-6 border-r border-slate-100 min-w-[180px]">
                  <div className={`w-24 h-24 rounded-2xl flex items-center justify-center shadow-lg ${
                    patient.gender === '男'
                      ? 'bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500'
                      : 'bg-gradient-to-br from-pink-500 via-rose-500 to-red-500'
                  }`}>
                    <User className="w-12 h-12 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-slate-800">{patient.name}</div>
                    <div className="flex items-center justify-center gap-2 mt-1.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                          patient.gender === '男'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-pink-50 text-pink-600'
                        }`}
                      >
                        {patient.gender}
                      </span>
                      <span className="text-xs text-slate-500">{patient.age}岁</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-3 min-w-0">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <IdCard className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-slate-400">身份证号</div>
                        <div className="text-slate-700 font-medium truncate">{patient.idCard}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-slate-400">联系电话</div>
                        <div className="text-slate-700 font-medium">{patient.phone}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100/50">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                      <ClipboardList className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-amber-600 font-medium mb-1">主诉</div>
                      <div className="text-sm text-amber-900 leading-relaxed">
                        {patient.chiefComplaint}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pl-6 border-l border-slate-100 w-[360px]">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Scale className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-xs font-medium text-emerald-700">BMI</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-700">
                      {patient.bmi?.toFixed(1) || '--'}
                      <span className="text-sm font-normal text-emerald-500 ml-1">kg/m²</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <ShieldAlert className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="text-xs font-medium text-indigo-700">ASA分级</span>
                    </div>
                    <div className="text-2xl font-bold text-indigo-700">
                      {currentExam?.asaGrade?.replace('ASA ', '') || '--'}
                      <span className="text-sm font-normal text-indigo-500 ml-1">级</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Pill className="w-4 h-4 text-orange-600" />
                      </div>
                      <span className="text-xs font-medium text-orange-700">过敏史</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {patient.allergyHistory.length > 0 ? (
                        patient.allergyHistory.map((a, i) => (
                          <span
                            key={i}
                            className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700"
                          >
                            {a}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-orange-400">无</span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-red-50 border border-rose-100/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                      </div>
                      <span className="text-xs font-medium text-rose-700">过敏警告</span>
                    </div>
                    <div className="text-sm">
                      {patient.allergyHistory.length > 0 ? (
                        <span className="font-semibold text-rose-600">
                          有 {patient.allergyHistory.length} 项过敏记录
                        </span>
                      ) : (
                        <span className="text-rose-400">未记录</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pl-6 border-l border-slate-100 min-w-[260px]">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-cyan-600" />
                    <span className="text-sm font-semibold text-slate-700">关键检验指标</span>
                  </div>
                  <div className="space-y-2">
                    {patient.labResults.slice(0, 5).map((lab, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-2.5 rounded-lg ${
                          lab.abnormal
                            ? 'bg-rose-50/80 border border-rose-100'
                            : 'bg-slate-50 border border-slate-100/60'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-medium truncate ${lab.abnormal ? 'text-rose-700' : 'text-slate-600'}`}>
                            {lab.name}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">参考: {lab.reference || '-'}</div>
                        </div>
                        <div className="text-right ml-3">
                          <div className={`text-sm font-bold ${lab.abnormal ? 'text-rose-600' : 'text-slate-700'}`}>
                            {lab.value}
                            <span className="text-[10px] font-normal text-slate-400 ml-1">{lab.unit}</span>
                          </div>
                          {lab.abnormal && (
                            <span className="inline-flex items-center text-[10px] text-rose-500 font-medium mt-0.5">
                              ↑ 异常
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-5 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-violet-600" />
                  </div>
                  <h2 className="text-base font-semibold text-slate-800">既往检查摘要</h2>
                  <span className="ml-auto text-xs text-slate-400">
                    共 {patient.pastHistory.length} 条记录
                  </span>
                </div>
                {patient.pastHistory.length > 0 ? (
                  <div className="relative pl-6">
                    <div className="absolute left-[11px] top-1 bottom-1 w-0.5 bg-gradient-to-b from-violet-300 via-violet-200 to-slate-100" />
                    <div className="space-y-5">
                      {patient.pastHistory.map((exam, i) => {
                        const style = examTypeMap[exam.type as keyof typeof examTypeMap];
                        return (
                          <div key={exam.id} className="relative">
                            <div
                              className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-4 border-white shadow-sm ${style?.dot || 'bg-slate-400'}`}
                            />
                            <div className={`p-4 rounded-xl border ${style?.color || 'bg-slate-50 border-slate-200'}`}>
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-sm font-semibold text-slate-700">
                                    {exam.date}
                                  </span>
                                </div>
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${style?.color}`}
                                >
                                  {exam.type}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 mb-2">
                                🏥 {exam.hospital}
                              </div>
                              <div className="text-sm text-slate-700 leading-relaxed">
                                {exam.diagnosis}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                      <Stethoscope className="w-7 h-7 text-slate-400" />
                    </div>
                    <div className="text-sm text-slate-500">暂无既往检查记录</div>
                  </div>
                )}
              </div>

              <div className="col-span-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-sky-600" />
                  </div>
                  <h2 className="text-base font-semibold text-slate-800">今日日程</h2>
                  <span className="ml-auto text-xs text-slate-400">
                    {todayExams.length} 个预约
                  </span>
                </div>
                <div className="space-y-3">
                  {todayExams.map((exam) => {
                    const p = getPatientById(exam.patientId);
                    const status = statusMap[exam.status as keyof typeof statusMap];
                    const style = examTypeMap[exam.type as keyof typeof examTypeMap];
                    const isCurrent = exam.patientId === currentPatientId;
                    const isActiveExam = exam.id === selectedExamId;
                    const examReport = reports.find((r) => r.examId === exam.id);
                    const reportEditedRecently = (() => {
                      if (!examReport || !examReport.lastEditedAt) return null;
                      try {
                        const t = new Date(examReport.lastEditedAt.replace(/-/g, '/')).getTime();
                        const now = Date.now();
                        const hoursAgo = (now - t) / 3600000;
                        if (hoursAgo < 0) return null;
                        if (hoursAgo < 24) return { level: 'hot' as const, text: '24h 内修改' };
                        if (hoursAgo < 72) return { level: 'warm' as const, text: `${Math.floor(hoursAgo / 24)} 天前修改` };
                        return null;
                      } catch {
                        return null;
                      }
                    })();
                    return (
                      <button
                        key={exam.id}
                        onClick={() => {
                          if (exam.patientId !== currentPatientId) setCurrentPatient(exam.patientId);
                          if (exam.id !== selectedExamId) setSelectedExam(exam.id);
                        }}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          isActiveExam
                            ? 'bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-300 shadow ring-2 ring-blue-200'
                            : isCurrent
                            ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 shadow-sm'
                            : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                            p?.gender === '男'
                              ? 'bg-gradient-to-br from-blue-400 to-cyan-400'
                              : 'bg-gradient-to-br from-pink-400 to-rose-400'
                          }`}>
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-sm font-semibold text-slate-800 truncate">
                                {p?.name}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${status?.color}`}
                                >
                                  {exam.status === 'in_progress' && (
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                  )}
                                  {exam.status === 'completed' && (
                                    <CheckCircle className="w-2.5 h-2.5" />
                                  )}
                                  {status?.label}
                                </span>
                                {reportEditedRecently && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (exam.id !== selectedExamId) {
                                        if (exam.patientId !== currentPatientId) setCurrentPatient(exam.patientId);
                                        setSelectedExam(exam.id);
                                      }
                                      navigate(`/report/${exam.id}?version=latest`);
                                    }}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border animate-pulse hover:shadow-sm transition-all cursor-pointer ${
                                      reportEditedRecently.level === 'hot'
                                        ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                    }`}
                                    title={examReport?.lastEditedAt ? `最近编辑于 ${examReport.lastEditedAt}（点击查看版本）` : ''}
                                  >
                                    <History className="w-2.5 h-2.5" />
                                    {reportEditedRecently.text}
                                    {examReport?.versions && examReport.versions.length > 0 && (
                                      <span className="ml-0.5 opacity-70">·{examReport.versions.length}版</span>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[11px] ${style?.color}`}
                              >
                                {exam.type}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {exam.examTime}
                              </span>
                              <span>· {exam.room}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {exam.preoperativeDiagnosis}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="col-span-3 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h2 className="text-base font-semibold text-slate-800 mb-4">快捷操作</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                        <PlayCircle className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">开始检查</span>
                    </button>
                    <button className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">查看报告</span>
                    </button>
                    <button className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/20 hover:-translate-y-0.5 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                        <CalendarPlus className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">新建随访</span>
                    </button>
                    <button className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white hover:shadow-lg hover:shadow-violet-500/20 hover:-translate-y-0.5 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                        <Download className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">导出数据</span>
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg p-6 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  <div className="relative">
                    <div className="text-xs text-slate-400 mb-1">当前检查类型</div>
                    <div className="text-xl font-bold mb-4">{currentExam?.type || '未安排'}</div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">检查室</span>
                        <span className="text-sm font-medium">{currentExam?.room || '--'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">麻醉方式</span>
                        <span className="text-sm font-medium">{currentExam?.anesthesiaType || '--'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">操作医师</span>
                        <span className="text-sm font-medium">{currentExam?.operatorName || '--'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Boston评分</span>
                        <span className="text-sm font-medium">{currentExam?.bostonScore || 0}/9</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-20 text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <User className="w-10 h-10 text-slate-400" />
            </div>
            <div className="text-lg font-semibold text-slate-700 mb-2">请选择患者</div>
            <div className="text-sm text-slate-500">从顶部下拉列表选择一位患者查看详情</div>
          </div>
        )}
      </div>

      {importPreview && (() => {
        const { newPatients, newExams, skippedPatients, skippedExams } = importPreview;
        const totalP = newPatients.length + skippedPatients.length;
        const totalE = newExams.length + skippedExams.length;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-[720px] max-w-full max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-[fadeIn_.15s_ease-out]">
              <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">导入预约预览</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        共解析 {totalP} 位患者 · {totalE} 条检查安排，请确认后导入
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setImportPreview(null)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-3">
                  <div className="bg-white rounded-xl p-3 border border-slate-200">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">新增患者</div>
                    <div className="text-xl font-bold text-blue-600">{newPatients.length}</div>
                    <div className="text-[10px] text-slate-400">patient ID 均为新</div>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-slate-200">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">新增检查</div>
                    <div className="text-xl font-bold text-cyan-600">{newExams.length}</div>
                    <div className="text-[10px] text-slate-400">exam ID 均为新</div>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-slate-200">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">重复跳过</div>
                    <div className="text-xl font-bold text-amber-500">
                      {skippedPatients.length + skippedExams.length}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {skippedPatients.length}人/{skippedExams.length}条
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-slate-200">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">将导入</div>
                    <div className="text-xl font-bold text-emerald-600">
                      {newPatients.length + newExams.length}
                    </div>
                    <div className="text-[10px] text-slate-400">条记录总数量</div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {newPatients.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      新增患者（{newPatients.length}）
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="max-h-[140px] overflow-y-auto divide-y divide-slate-100">
                        {newPatients.map((p) => (
                          <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50/50">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {p.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-slate-800 truncate">
                                {p.name}
                                <span className="ml-2 text-[11px] font-normal text-slate-500">
                                  {p.gender} · {p.age}岁
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">{p.id}</div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold shrink-0">
                              新增
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {newExams.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-500" />
                      新增检查安排（{newExams.length}）
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="max-h-[160px] overflow-y-auto divide-y divide-slate-100">
                        {newExams.map((e) => {
                          const p = patients.find((pt) => pt.id === e.patientId) || newPatients.find((pt) => pt.id === e.patientId);
                          return (
                            <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 bg-cyan-50/40">
                              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                                {e.id.slice(-3)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-slate-800 truncate">
                                  {e.type}
                                  <span className="ml-2 text-[11px] font-normal text-slate-500">
                                    {e.examDate} · {e.room}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                  <span className="font-mono">{e.id}</span>
                                  {p && <span>· 患者：{p.name}</span>}
                                </div>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 font-semibold shrink-0">
                                新增
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {skippedPatients.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      跳过 · 重复患者（{skippedPatients.length}）
                    </h4>
                    <div className="border border-slate-200 border-dashed rounded-xl overflow-hidden">
                      <div className="max-h-[140px] overflow-y-auto divide-y divide-slate-100">
                        {skippedPatients.map((sk, i) => (
                          <div key={`${sk.patient.id}-${i}`} className="flex items-center gap-3 px-4 py-2.5 bg-slate-50/70">
                            <div className="w-7 h-7 rounded-md bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">
                              {sk.patient.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-slate-600 truncate">
                                {sk.patient.name}
                                <span className="ml-2 text-[10px] text-slate-400">
                                  {sk.patient.gender} · {sk.patient.age}岁
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">{sk.patient.id}</div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 shrink-0 font-medium max-w-[150px] truncate" title={sk.reason}>
                              {sk.reason}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {skippedExams.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      跳过 · 重复检查（{skippedExams.length}）
                    </h4>
                    <div className="border border-slate-200 border-dashed rounded-xl overflow-hidden">
                      <div className="max-h-[140px] overflow-y-auto divide-y divide-slate-100">
                        {skippedExams.map((se, i) => (
                          <div key={`${se.exam.id}-${i}`} className="flex items-center gap-3 px-4 py-2.5 bg-slate-50/70">
                            <div className="w-7 h-7 rounded-md bg-slate-200 text-slate-500 flex items-center justify-center font-mono text-[10px] shrink-0">
                              {se.exam.id.slice(-3)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-slate-600 truncate">
                                {se.exam.type} · {se.exam.examDate}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">{se.exam.id}</div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 shrink-0 font-medium max-w-[180px] truncate" title={se.reason}>
                              {se.reason}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button
                  onClick={() => setImportPreview(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={confirmImport}
                  disabled={newPatients.length === 0 && newExams.length === 0}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  确认导入
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
