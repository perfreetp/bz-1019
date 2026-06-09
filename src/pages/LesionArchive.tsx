import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  User,
  Calendar,
  FileText,
  MapPin,
  Ruler,
  Shapes,
  Droplets,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  TrendingUp,
  FileImage,
  Stethoscope,
  Microscope,
  ArrowLeft,
  Sparkles,
  Link2,
  Layers,
  Activity,
  Clock,
  History,
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { Lesion, Examination, Patient, ImageItem, Biopsy } from '@/types';

interface LesionHistoryItem {
  lesion: Lesion;
  exam: Examination;
  annotations: number;
  linkedImage?: ImageItem;
}

export default function LesionArchive() {
  const navigate = useNavigate();
  const patients = useAppStore((s) => s.patients);
  const allExaminations = useAppStore((s) => s.examinations);
  const allLesions = useAppStore((s) => s.lesions);
  const allImages = useAppStore((s) => s.images);
  const setCurrentPatient = useAppStore((s) => s.setCurrentPatient);
  const setSelectedExam = useAppStore((s) => s.setSelectedExam);

  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => useAppStore.getState().currentPatientId || (patients[0]?.id ?? ''));

  const patient = useMemo(() => patients.find((p) => p.id === selectedPatientId), [patients, selectedPatientId]);

  const patientExams = useMemo(
    () => allExaminations.filter((e) => e.patientId === selectedPatientId).sort((a, b) => b.examDate.localeCompare(a.examDate)),
    [allExaminations, selectedPatientId]
  );

  const annotationMap = useMemo(() => {
    const m: Record<string, number> = {};
    allImages.forEach((img) => {
      (img.annotations || []).forEach((a) => {
        if (a.lesionId) m[a.lesionId] = (m[a.lesionId] || 0) + 1;
      });
    });
    return m;
  }, [allImages]);

  const examImageMap = useMemo(() => {
    const m: Record<string, ImageItem[]> = {};
    allImages.forEach((img) => {
      if (!m[img.examId]) m[img.examId] = [];
      m[img.examId].push(img);
    });
    return m;
  }, [allImages]);

  const examLesionMap = useMemo(() => {
    const m: Record<string, Lesion[]> = {};
    allLesions.forEach((l) => {
      if (!m[l.examId]) m[l.examId] = [];
      m[l.examId].push(l);
    });
    return m;
  }, [allLesions]);

  const lesionImageMap = useMemo(() => {
    const m: Record<string, ImageItem> = {};
    allImages.forEach((img) => {
      (img.annotations || []).forEach((a) => {
        if (a.lesionId && !m[a.lesionId]) m[a.lesionId] = img;
      });
    });
    return m;
  }, [allImages]);

  const totalLesions = useMemo(
    () => patientExams.reduce((acc, e) => acc + (examLesionMap[e.id]?.length || 0), 0),
    [patientExams, examLesionMap]
  );

  const totalImages = useMemo(
    () => patientExams.reduce((acc, e) => acc + (examImageMap[e.id]?.length || 0), 0),
    [patientExams, examImageMap]
  );

  const buildChangeComparison = (examIdx: number, lesion: Lesion): { trend: 'up' | 'down' | 'same' | 'new'; diffMm?: number; prevSize?: string } => {
    for (let j = examIdx + 1; j < patientExams.length; j++) {
      const prevExam = patientExams[j];
      const prevLesions = examLesionMap[prevExam.id] || [];
      const match = prevLesions.find((pl) => pl.location === lesion.location || pl.id.split('-')[0] === lesion.id.split('-')[0]);
      if (match) {
        const curr = lesion.sizeMajor || 0;
        const prev = match.sizeMajor || 0;
        const diff = +(curr - prev).toFixed(1);
        const prevSizeStr = `${match.sizeMajor}×${match.sizeMinor}mm`;
        if (Math.abs(diff) < 0.1) return { trend: 'same', diffMm: diff, prevSize: prevSizeStr };
        return { trend: diff > 0 ? 'up' : 'down', diffMm: diff, prevSize: prevSizeStr };
      }
    }
    return { trend: 'new' };
  };

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatientId(p.id);
    setPatientDropdownOpen(false);
  };

  const jumpToExam = (examId: string) => {
    if (patient?.id !== useAppStore.getState().currentPatientId) setCurrentPatient(patient!.id);
    setSelectedExam(examId);
    navigate(`/lesion/${examId}`);
  };

  const jumpToAnnotation = (examId: string) => {
    if (patient?.id !== useAppStore.getState().currentPatientId) setCurrentPatient(patient!.id);
    setSelectedExam(examId);
    navigate(`/annotation/${examId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-sm">
                <Layers className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-800 tracking-wide">病灶归档视图</h1>
                <p className="text-[11px] text-slate-500">历次检查病灶汇总 · 变化追踪 · 复查对比</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setPatientDropdownOpen(!patientDropdownOpen)}
              className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-violet-300 hover:shadow-sm transition-all min-w-[280px]"
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
              <div className="absolute right-0 mt-2 w-full bg-white rounded-xl border border-slate-200 shadow-lg z-50 max-h-80 overflow-y-auto py-1.5">
                {patients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-slate-50 transition-colors ${
                      p.id === selectedPatientId ? 'bg-violet-50 text-violet-800' : 'text-slate-700'
                    }`}
                  >
                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-semibold">
                      {p.name.charAt(0)}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{p.id} · {p.gender} {p.age}岁</div>
                    </div>
                    {p.id === selectedPatientId && (
                      <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-5 space-y-5">
        {!patient ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <User className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">请选择患者</h2>
            <p className="text-sm text-slate-500">在右上角下拉中选择要查看归档的患者</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-sm">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 tracking-wide">总检查次数</div>
                    <div className="text-2xl font-bold text-slate-800">{patientExams.length}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center shadow-sm">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 tracking-wide">累计发现病灶</div>
                    <div className="text-2xl font-bold text-slate-800">{totalLesions}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center shadow-sm">
                    <FileImage className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 tracking-wide">留存影像</div>
                    <div className="text-2xl font-bold text-slate-800">{totalImages}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center shadow-sm">
                    <History className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 tracking-wide">首次检查距今</div>
                    <div className="text-2xl font-bold text-slate-800">
                      {patientExams.length >= 2
                        ? Math.round((new Date(patientExams[0]?.examDate).getTime() - new Date(patientExams[patientExams.length - 1]?.examDate).getTime()) / 86400000) || 0
                        : '-'}
                      <span className="text-sm font-medium ml-1 text-slate-500">天</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {patientExams.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Stethoscope className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">暂无检查记录</h2>
                <p className="text-sm text-slate-500">该患者还没有内镜检查记录</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[22px] top-4 bottom-4 w-px bg-gradient-to-b from-violet-300 via-blue-300 to-cyan-300" />

                <div className="space-y-5">
                  {patientExams.map((exam, idx) => {
                    const lesions = examLesionMap[exam.id] || [];
                    const images = examImageMap[exam.id] || [];
                    const isLatest = idx === 0;
                    const typeStyle = examTypeMap[exam.type as keyof typeof examTypeMap] || examTypeMap['胃镜'];
                    return (
                      <div key={exam.id} className="relative pl-14">
                        <div className={`absolute left-0 top-5 w-11 h-11 rounded-full flex items-center justify-center shadow-md border-4 border-white ${isLatest ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 ring-4 ring-violet-100' : 'bg-gradient-to-br from-slate-300 to-slate-400'}`}>
                          <Clock className={`w-4 h-4 text-white`} />
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          <div className={`px-6 py-4 border-b border-slate-100 ${isLatest ? 'bg-gradient-to-r from-violet-50 to-fuchsia-50' : 'bg-slate-50'}`}>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div>
                                  <div className="flex items-center gap-2.5 mb-1">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[11px] font-semibold ${typeStyle?.color || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                      {exam.type}
                                    </span>
                                    <span className="text-lg font-bold text-slate-800">{exam.examDate}</span>
                                    <span className="text-xs text-slate-500">{exam.examTime}</span>
                                    {isLatest && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[10px] font-semibold">
                                        <Sparkles className="w-3 h-3" /> 最新
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                    <span className="font-mono">{exam.id}</span>
                                    <span>·</span>
                                    <span>{exam.room}</span>
                                    {exam.operatorName && (
                                      <>
                                        <span>·</span>
                                        <span>操作：{exam.operatorName}</span>
                                      </>
                                    )}
                                    {exam.deepestReached && (
                                      <>
                                        <span>·</span>
                                        <span>到达：{exam.deepestReached}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => jumpToAnnotation(exam.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50 transition-all"
                                >
                                  <FileImage className="w-3.5 h-3.5" />
                                  影像 ({images.length})
                                </button>
                                <button
                                  onClick={() => jumpToExam(exam.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs hover:from-violet-600 hover:to-fuchsia-600 transition-all shadow-sm shadow-violet-500/20"
                                >
                                  <Stethoscope className="w-3.5 h-3.5" />
                                  查看病灶 ({lesions.length})
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="p-6">
                            {lesions.length === 0 ? (
                              <div className="py-8 text-center text-sm text-slate-500">
                                <Shapes className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                本次检查未发现明确病灶
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {lesions.map((lesion, lidx) => {
                                  const comp = buildChangeComparison(idx, lesion);
                                  const linkedImg = lesionImageMap[lesion.id];
                                  const annCount = annotationMap[lesion.id] || 0;
                                  return (
                                    <div
                                      key={lesion.id}
                                      className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50/50 to-white hover:border-violet-200 hover:shadow-sm transition-all"
                                    >
                                      <div className="flex items-start gap-4">
                                        <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden relative">
                                          {linkedImg ? (
                                            <>
                                              <img src={linkedImg.url} alt="" className="w-full h-full object-cover" />
                                              {annCount > 0 && (
                                                <div className="absolute top-1 left-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-violet-500/90 text-white text-[10px] font-semibold">
                                                  <Link2 className="w-2.5 h-2.5" /> {annCount}
                                                </div>
                                              )}
                                            </>
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                              <FileImage className="w-7 h-7" />
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                                              #{lidx + 1}
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100 text-[11px] font-semibold">
                                              <MapPin className="w-3 h-3" />
                                              {lesion.location}
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-semibold">
                                              <Ruler className="w-3 h-3" />
                                              {lesion.sizeMajor ? `${lesion.sizeMajor}×${lesion.sizeMinor}mm` : '未测量'}
                                            </span>
                                            {lesion.morphology && (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100 text-[11px] font-semibold">
                                                <Shapes className="w-3 h-3" />
                                                {lesion.morphology}
                                              </span>
                                            )}

                                            {comp.trend === 'up' && (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 text-[11px] font-semibold">
                                                <ArrowUpRight className="w-3 h-3" />
                                                增大 {comp.diffMm}mm（上次 {comp.prevSize}）
                                              </span>
                                            )}
                                            {comp.trend === 'down' && (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                                                <ArrowDownRight className="w-3 h-3" />
                                                缩小 {Math.abs(comp.diffMm as number)}mm（上次 {comp.prevSize}）
                                              </span>
                                            )}
                                            {comp.trend === 'same' && (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200 text-[11px] font-semibold">
                                                <Minus className="w-3 h-3" />
                                                大小稳定（上次 {comp.prevSize}）
                                              </span>
                                            )}
                                            {comp.trend === 'new' && !isLatest && (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-200 text-[11px] font-semibold">
                                                <TrendingUp className="w-3 h-3" />
                                                新增病灶
                                              </span>
                                            )}
                                          </div>

                                          {((lesion.preliminaryDiagnosis && lesion.preliminaryDiagnosis.length > 0) || lesion.notes) && (
                                            <div className="grid grid-cols-2 gap-3 mb-2">
                                              {lesion.preliminaryDiagnosis && lesion.preliminaryDiagnosis.length > 0 && (
                                                <div className="p-2.5 rounded-lg bg-violet-50 border border-violet-100">
                                                  <div className="text-[10px] text-violet-500 font-semibold mb-0.5 tracking-wide flex items-center gap-1">
                                                    <Microscope className="w-3 h-3" /> 初步诊断
                                                  </div>
                                                  <div className="text-xs text-violet-800 font-medium">{lesion.preliminaryDiagnosis.join('、')}</div>
                                                </div>
                                              )}
                                              {lesion.notes && (
                                                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                                                  <div className="text-[10px] text-emerald-600 font-semibold mb-0.5 tracking-wide flex items-center gap-1">
                                                    <Stethoscope className="w-3 h-3" /> 备注
                                                  </div>
                                                  <div className="text-xs text-emerald-800 font-medium">{lesion.notes}</div>
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {lesion.biopsy && (
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-100 text-[11px] text-sky-700">
                                              <Droplets className="w-3 h-3" />
                                              活检：{lesion.biopsy.site} · {lesion.biopsy.forcepsCount} 钳
                                              {lesion.biopsy.specimenNos && lesion.biopsy.specimenNos.length > 0 && ` · 标本${lesion.biopsy.specimenNos.join('/')}`}
                                            </div>
                                          )}

                                          {lesion.surfaceFeature && (
                                            <p className="mt-2 text-[11px] text-slate-500">
                                              <span className="text-slate-400">表面特征：</span>{lesion.surfaceFeature}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const examTypeMap: Record<string, { color: string; dot: string }> = {
  胃镜: { color: 'bg-rose-50 text-rose-600 border-rose-200', dot: 'bg-rose-500' },
  肠镜: { color: 'bg-sky-50 text-sky-600 border-sky-200', dot: 'bg-sky-500' },
  胃肠镜: { color: 'bg-violet-50 text-violet-600 border-violet-200', dot: 'bg-violet-500' },
};
