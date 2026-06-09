import { useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  MapPin,
  Ruler,
  Shapes,
  Sparkles,
  Droplets,
  Syringe,
  StickyNote,
  X,
  PlusCircle,
  Brain,
  CheckCircle2,
  ArrowRight,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { Lesion, Biopsy } from '@/types';
import {
  getDiagnosisHints,
  morphologyOptions,
  surfaceFeatureOptions,
  forrestGradeOptions,
} from '@/utils/diagnosisHelper';

const inputBase =
  'w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all';

const inputSmall =
  'w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all';

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SectionCard({ title, icon, children }: SectionCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

interface FormLabelProps {
  label: string;
  required?: boolean;
}

function FormLabel({ label, required }: FormLabelProps) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  );
}

export default function LesionAssessment() {
  const examLesions = useAppStore((s) => s.getExamLesions());
  const examImages = useAppStore((s) => s.getExamImages());
  const selectedExamId = useAppStore((s) => s.selectedExamId);
  const selectedLesionId = useAppStore((s) => s.selectedLesionId);
  const setSelectedLesion = useAppStore((s) => s.setSelectedLesion);
  const addLesion = useAppStore((s) => s.addLesion);
  const updateLesion = useAppStore((s) => s.updateLesion);
  const removeLesion = useAppStore((s) => s.removeLesion);
  const registerBiopsy = useAppStore((s) => s.registerBiopsy);

  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  const currentLesion = examLesions.find((l) => l.id === selectedLesionId);

  const diagnosisHints = useMemo(() => {
    if (!currentLesion) return [];
    const features: string[] = [];
    if (currentLesion.morphology) features.push(currentLesion.morphology);
    const sfs = currentLesion.surfaceFeature
      .split(/[,，、\s]+/)
      .filter(Boolean);
    features.push(...sfs);
    return getDiagnosisHints(currentLesion.location, features);
  }, [currentLesion]);

  const linkedImages = useMemo(
    () => examImages.filter((img) => currentLesion?.imageIds.includes(img.id)),
    [examImages, currentLesion]
  );

  const surfaceFeatureArr = useMemo(
    () =>
      currentLesion?.surfaceFeature
        ? currentLesion.surfaceFeature.split(/[,，、\s]+/).filter(Boolean)
        : [],
    [currentLesion]
  );

  const handleAddLesion = () => {
    const idx = examLesions.length + 1;
    const newLesion: Lesion = {
      id: `L${Date.now()}`,
      examId: selectedExamId,
      location: `病灶${idx}`,
      sizeMajor: 0,
      sizeMinor: 0,
      morphology: '',
      surfaceFeature: '',
      forrestGrade: '',
      activeBleeding: false,
      preliminaryDiagnosis: [],
      notes: '',
      imageIds: [],
      biopsy: null,
    };
    addLesion(newLesion);
    setSelectedLesion(newLesion.id);
  };

  const handleUpdate = <K extends keyof Lesion>(field: K, value: Lesion[K]) => {
    if (!currentLesion) return;
    updateLesion(currentLesion.id, field, value);
  };

  const toggleSurfaceFeature = (opt: string) => {
    if (!currentLesion) return;
    const exists = surfaceFeatureArr.includes(opt);
    const next = exists
      ? surfaceFeatureArr.filter((f) => f !== opt)
      : [...surfaceFeatureArr, opt];
    handleUpdate('surfaceFeature', next.join('、'));
  };

  const toggleImageLink = (imageId: string) => {
    if (!currentLesion) return;
    const exists = currentLesion.imageIds.includes(imageId);
    const next = exists
      ? currentLesion.imageIds.filter((id) => id !== imageId)
      : [...currentLesion.imageIds, imageId];
    handleUpdate('imageIds', next);
  };

  const addDiagnosisToList = (diagnosis: string) => {
    if (!currentLesion) return;
    if (currentLesion.preliminaryDiagnosis.includes(diagnosis)) return;
    handleUpdate('preliminaryDiagnosis', [
      ...currentLesion.preliminaryDiagnosis,
      diagnosis,
    ]);
  };

  const removeDiagnosisFromList = (diagnosis: string) => {
    if (!currentLesion) return;
    handleUpdate(
      'preliminaryDiagnosis',
      currentLesion.preliminaryDiagnosis.filter((d) => d !== diagnosis)
    );
  };

  const updateBiopsy = (patch: Partial<Biopsy>) => {
    if (!currentLesion) return;
    const current: Biopsy = currentLesion.biopsy || {
      site: '',
      forcepsCount: 0,
      specimenNos: [],
    };
    registerBiopsy(currentLesion.id, { ...current, ...patch });
  };

  const addSpecimenNo = () => {
    if (!currentLesion) return;
    const current: Biopsy = currentLesion.biopsy || {
      site: '',
      forcepsCount: 0,
      specimenNos: [],
    };
    const nextNo = `B${current.specimenNos.length + 1}`;
    updateBiopsy({ specimenNos: [...current.specimenNos, nextNo] });
  };

  const removeSpecimenNo = (index: number) => {
    if (!currentLesion?.biopsy) return;
    const next = currentLesion.biopsy.specimenNos.filter((_, i) => i !== index);
    updateBiopsy({ specimenNos: next });
  };

  const updateSpecimenNo = (index: number, value: string) => {
    if (!currentLesion?.biopsy) return;
    const next = currentLesion.biopsy.specimenNos.map((s, i) =>
      i === index ? value : s
    );
    updateBiopsy({ specimenNos: next });
  };

  const getProbabilityColor = (p: number) => {
    if (p >= 0.85) return 'from-rose-500 to-red-500';
    if (p >= 0.7) return 'from-amber-500 to-orange-500';
    if (p >= 0.55) return 'from-sky-500 to-blue-500';
    return 'from-slate-400 to-slate-500';
  };

  if (examLesions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-[1400px] mx-auto p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              暂无病灶记录
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              点击下方按钮创建第一个病灶评估
            </p>
            <button
              onClick={handleAddLesion}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-sm shadow-blue-500/20 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              新增病灶
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            {examLesions.map((lesion, idx) => {
              const isActive = lesion.id === selectedLesionId;
              return (
                <div key={lesion.id} className="relative group">
                  <button
                    onClick={() => setSelectedLesion(lesion.id)}
                    className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-transparent shadow-sm shadow-blue-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-md text-xs flex items-center justify-center font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="max-w-[140px] truncate">
                      {lesion.location || `病灶${idx + 1}`}
                    </span>
                  </button>
                  {examLesions.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLesion(lesion.id);
                      }}
                      className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${
                        isActive
                          ? 'bg-white text-rose-600 shadow'
                          : 'bg-slate-200 text-slate-600 hover:bg-rose-100 hover:text-rose-600'
                      }`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
            <button
              onClick={handleAddLesion}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-all"
            >
              <Plus className="w-4 h-4" />
              新增病灶
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <SectionCard
              title="位置与关联图像"
              icon={<MapPin className="w-4 h-4" />}
            >
              <div>
                <FormLabel label="病灶位置" required />
                <input
                  type="text"
                  className={inputBase}
                  placeholder="如：胃角中央、食管下段距门齿38cm..."
                  value={currentLesion?.location || ''}
                  onChange={(e) => handleUpdate('location', e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <FormLabel label="关联内镜图像" />
                  <button
                    onClick={() => setImagePickerOpen(!imagePickerOpen)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    {imagePickerOpen ? '收起选择器' : '选择图像'}
                  </button>
                </div>
                {linkedImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {linkedImages.map((img) => (
                      <div
                        key={img.id}
                        className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-100"
                      >
                        <img
                          src={img.url}
                          alt={img.location}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1">
                          <div className="text-[10px] text-white font-medium truncate">
                            {img.location}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleImageLink(img.id)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {imagePickerOpen && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 max-h-64 overflow-y-auto">
                    <div className="grid grid-cols-4 gap-2">
                      {examImages.map((img) => {
                        const selected = currentLesion?.imageIds.includes(img.id);
                        return (
                          <button
                            key={img.id}
                            onClick={() => toggleImageLink(img.id)}
                            className={`relative rounded-lg overflow-hidden aspect-square border-2 transition-all ${
                              selected
                                ? 'border-blue-500 ring-2 ring-blue-200'
                                : 'border-transparent hover:border-slate-300'
                            }`}
                          >
                            <img
                              src={img.url}
                              alt={img.location}
                              className="w-full h-full object-cover"
                            />
                            {selected && (
                              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1">
                              <div className="text-[10px] text-white font-medium truncate">
                                {img.location}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard title="大小测量" icon={<Ruler className="w-4 h-4" />}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel label="长径 (cm)" required />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className={inputBase}
                    value={currentLesion?.sizeMajor ?? ''}
                    onChange={(e) =>
                      handleUpdate('sizeMajor', Number(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <FormLabel label="短径 (cm)" />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className={inputBase}
                    value={currentLesion?.sizeMinor ?? ''}
                    onChange={(e) =>
                      handleUpdate('sizeMinor', Number(e.target.value) || 0)
                    }
                  />
                </div>
              </div>
              {(currentLesion?.sizeMajor || 0) > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm">
                  <Ruler className="w-4 h-4 shrink-0" />
                  <span>
                    病变尺寸约{' '}
                    <span className="font-semibold">
                      {currentLesion?.sizeMajor}cm ×{' '}
                      {currentLesion?.sizeMinor || 0}cm
                    </span>
                  </span>
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="形态学分类"
              icon={<Shapes className="w-4 h-4" />}
            >
              <div>
                <FormLabel label="病变大体形态（Paris分型）" required />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {morphologyOptions.map((opt) => {
                    const active = currentLesion?.morphology === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleUpdate('morphology', opt)}
                        className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-all text-center ${
                          active
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="表面特征"
              icon={<Sparkles className="w-4 h-4" />}
            >
              <div>
                <FormLabel label="黏膜表面特征（多选）" />
                <div className="flex flex-wrap gap-2">
                  {surfaceFeatureOptions.map((opt) => {
                    const active = surfaceFeatureArr.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggleSurfaceFeature(opt)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            active ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="出血评估"
              icon={<Droplets className="w-4 h-4" />}
            >
              <div className="space-y-4">
                <div>
                  <FormLabel label="Forrest 出血分级" />
                  <select
                    className={inputBase}
                    value={currentLesion?.forrestGrade || ''}
                    onChange={(e) => handleUpdate('forrestGrade', e.target.value)}
                  >
                    <option value="">无明显出血征象</option>
                    {forrestGradeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        currentLesion?.activeBleeding
                          ? 'bg-rose-100 text-rose-600'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <AlertCircle className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">
                        活动性出血
                      </div>
                      <div className="text-xs text-slate-500">
                        标记后提示需紧急止血处理
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleUpdate('activeBleeding', !currentLesion?.activeBleeding)
                    }
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      currentLesion?.activeBleeding
                        ? 'bg-rose-500'
                        : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${
                        currentLesion?.activeBleeding ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
                {currentLesion?.activeBleeding && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <div className="font-semibold mb-0.5">⚠️ 活动性出血警告</div>
                      建议立即行内镜下止血处理（止血夹/APC/注射），并密切监测生命体征
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard title="活检登记" icon={<Syringe className="w-4 h-4" />}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <FormLabel label="取检部位" />
                  <input
                    type="text"
                    className={inputBase}
                    placeholder="如：胃角溃疡边缘"
                    value={currentLesion?.biopsy?.site || ''}
                    onChange={(e) => updateBiopsy({ site: e.target.value })}
                  />
                </div>
                <div>
                  <FormLabel label="钳数" />
                  <input
                    type="number"
                    min="0"
                    className={inputBase}
                    value={currentLesion?.biopsy?.forcepsCount ?? ''}
                    onChange={(e) =>
                      updateBiopsy({ forcepsCount: Number(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <FormLabel label="标本号" />
                  <button
                    onClick={addSpecimenNo}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    添加标本
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(currentLesion?.biopsy?.specimenNos?.length ?? 0) === 0 ? (
                    <div className="w-full px-3 py-2.5 rounded-lg border border-dashed border-slate-300 text-xs text-slate-400 text-center">
                      尚未登记标本号
                    </div>
                  ) : (
                    (currentLesion?.biopsy?.specimenNos || []).map((no, i) => (
                      <div
                        key={i}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200"
                      >
                        <input
                          type="text"
                          className="w-14 bg-transparent text-sm text-amber-800 font-medium text-center focus:outline-none"
                          value={no}
                          onChange={(e) => updateSpecimenNo(i, e.target.value)}
                        />
                        <button
                          onClick={() => removeSpecimenNo(i)}
                          className="w-4 h-4 rounded flex items-center justify-center text-amber-500 hover:bg-amber-100 hover:text-amber-700 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="备注说明"
              icon={<StickyNote className="w-4 h-4" />}
            >
              <textarea
                rows={4}
                className={`${inputBase} resize-none`}
                placeholder="记录病灶的特殊观察、处理方式、随访建议等..."
                value={currentLesion?.notes || ''}
                onChange={(e) => handleUpdate('notes', e.target.value)}
              />
            </SectionCard>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2 bg-gradient-to-r from-violet-50 to-indigo-50">
                <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">
                  AI辅助诊断建议
                </h3>
                <span className="ml-auto text-[11px] text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full font-medium">
                  智能匹配
                </span>
              </div>
              <div className="p-4 space-y-3">
                {diagnosisHints.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Brain className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">请先填写病灶位置与特征</div>
                    <div className="text-xs mt-1">系统将基于输入信息智能推荐诊断方向</div>
                  </div>
                ) : (
                  diagnosisHints.map((hint, idx) => {
                    const alreadyAdded = currentLesion?.preliminaryDiagnosis.includes(
                      hint.diagnosis
                    );
                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-all"
                      >
                        <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-slate-800 truncate">
                                  {hint.diagnosis}
                                </span>
                                <span className="text-[10px] text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded shrink-0 font-mono">
                                  {hint.icdCode}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                  <div
                                    className={`h-full bg-gradient-to-r ${getProbabilityColor(
                                      hint.probability
                                    )}`}
                                    style={{
                                      width: `${Math.round(hint.probability * 100)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-slate-700 tabular-nums w-10 text-right">
                                  {Math.round(hint.probability * 100)}%
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => addDiagnosisToList(hint.diagnosis)}
                              disabled={alreadyAdded}
                              className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                alreadyAdded
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
                                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20'
                              }`}
                            >
                              {alreadyAdded ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  已添加
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  添加
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="px-4 py-3 space-y-2.5">
                          <div>
                            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                              关键特征
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {hint.keyFeatures.map((kf, i) => (
                                <span
                                  key={i}
                                  className="inline-block px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-100"
                                >
                                  {kf}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <ArrowRight className="w-3 h-3" />
                              下一步建议
                            </div>
                            <ul className="space-y-0.5">
                              {hint.nextSteps.map((ns, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-slate-600 flex items-start gap-1.5"
                                >
                                  <span className="text-slate-400 mt-0.5">•</span>
                                  <span>{ns}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">
                  初步诊断列表
                </h3>
                <span className="ml-auto text-xs text-slate-500">
                  共 {currentLesion?.preliminaryDiagnosis.length || 0} 项
                </span>
              </div>
              <div className="p-4">
                {(currentLesion?.preliminaryDiagnosis.length ?? 0) === 0 ? (
                  <div className="py-6 text-center">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 flex items-center justify-center mb-2">
                      <CheckCircle2 className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="text-sm text-slate-500">尚未添加初步诊断</div>
                    <div className="text-xs text-slate-400 mt-1">
                      从上方AI建议中点击「添加」，或手动输入
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentLesion?.preliminaryDiagnosis.map((d, i) => (
                      <div
                        key={i}
                        className="group flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 hover:border-emerald-200 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-emerald-500 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                            {i + 1}
                          </div>
                          <span className="text-sm font-medium text-emerald-800 truncate">
                            {d}
                          </span>
                        </div>
                        <button
                          onClick={() => removeDiagnosisFromList(d)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-500 hover:bg-emerald-100 hover:text-rose-600 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">
                  关联病灶图像
                </h3>
                <span className="ml-auto text-xs text-slate-500">
                  {linkedImages.length} 张
                </span>
              </div>
              <div className="p-4">
                {linkedImages.length === 0 ? (
                  <div className="py-6 text-center">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 flex items-center justify-center mb-2">
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="text-sm text-slate-500">暂无关联图像</div>
                    <div className="text-xs text-slate-400 mt-1">
                      请在左侧「位置与关联图像」中选择
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {linkedImages.map((img) => (
                      <div
                        key={img.id}
                        className="group rounded-xl overflow-hidden border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all bg-slate-50"
                      >
                        <div className="aspect-square bg-slate-100 relative">
                          <img
                            src={img.url}
                            alt={img.location}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/50 text-white backdrop-blur-sm">
                            {img.capturedAt}
                          </div>
                        </div>
                        <div className="px-2.5 py-2 bg-white border-t border-slate-100">
                          <div className="text-xs font-semibold text-slate-800 truncate">
                            {img.location}
                          </div>
                          {img.description && (
                            <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-tight">
                              {img.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
