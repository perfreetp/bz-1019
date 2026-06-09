import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Sparkles,
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  FileCheck,
  FileText,
  Printer,
  User,
  Calendar,
  AlertCircle,
  FileDown,
  X,
  Copy,
  PenLine,
  Clock,
  ListChecks,
  CheckCircle2,
  History,
  Camera,
  RotateCcw,
  GitCompare,
  Save,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { termLibrary, searchTerms, type TermItem, type TermCategory } from '@/utils/termLibrary';
import { exportPatientSummary, downloadText } from '@/utils/storage';
import type { Report, ReportVersion, ReportVersionType } from '@/types';

const examTypeMap: Record<string, { color: string; dot: string }> = {
  胃镜: { color: 'bg-rose-50 text-rose-600 border-rose-200', dot: 'bg-rose-500' },
  肠镜: { color: 'bg-sky-50 text-sky-600 border-sky-200', dot: 'bg-sky-500' },
  胃肠镜: { color: 'bg-violet-50 text-violet-600 border-violet-200', dot: 'bg-violet-500' },
};

type InsertTarget = 'findings' | 'diagnosis' | 'recommendations' | 'conclusion';

interface InsertMenuItem {
  key: InsertTarget;
  label: string;
  icon: LucideIcon;
}

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
}

function CircularProgress({ value, size = 44, strokeWidth = 5 }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? '#00B42A' : value >= 60 ? '#FF7D00' : '#F53F3F';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E6EB"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-xs font-bold"
          style={{ color }}
        >
          {Math.round(value)}%
        </span>
      </div>
    </div>
  );
}

export default function ReportEditor() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const reports = useAppStore((s) => s.reports);
  const allExaminations = useAppStore((s) => s.examinations);
  const generateFindings = useAppStore((s) => s.generateFindings);
  const updateReportField = useAppStore((s) => s.updateReportField);
  const checkCompleteness = useAppStore((s) => s.checkCompleteness);
  const signReport = useAppStore((s) => s.signReport);
  const snapshotReport = useAppStore((s) => s.snapshotReport);
  const getReportVersions = useAppStore((s) => s.getReportVersions);
  const restoreReportVersion = useAppStore((s) => s.restoreReportVersion);
  const getCurrentPatient = useAppStore((s) => s.getCurrentPatient);
  const getCurrentExam = useAppStore((s) => s.getCurrentExam);
  const getCurrentReport = useAppStore((s) => s.getCurrentReport);
  const selectedExamId = useAppStore((s) => s.selectedExamId);
  const currentPatientId = useAppStore((s) => s.currentPatientId);
  const setSelectedExam = useAppStore((s) => s.setSelectedExam);

  const checkCompletenessRef = useRef(checkCompleteness);
  checkCompletenessRef.current = checkCompleteness;

  const { id: paramExamId } = useParams<{ id: string }>();
  useEffect(() => {
    if (paramExamId && paramExamId !== useAppStore.getState().selectedExamId) {
      const s = useAppStore.getState();
      const targetExam = s.examinations.find((e) => e.id === paramExamId);
      if (targetExam) {
        if (targetExam.patientId !== s.currentPatientId) {
          s.setCurrentPatient(targetExam.patientId);
        }
        if (paramExamId !== s.selectedExamId) {
          s.setSelectedExam(paramExamId);
        }
      }
    }
  }, [paramExamId]);

  useEffect(() => {
    const v = searchParams.get('version');
    if (v === 'latest' || v === '1') {
      setShowVersionsPanel(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const patient = getCurrentPatient();
  const exam = getCurrentExam();
  const report = getCurrentReport() || {
    id: '', examId: selectedExamId,
    structuredFindings: '', insertedTerms: [], diagnosis: '', recommendations: '', conclusion: '',
    doctorSignature: '', signedAt: '', completenessScore: 0, missingFields: [], lastEditedAt: '',
  } as Report;

  const patientExams = useMemo(
    () => allExaminations.filter((e) => e.patientId === currentPatientId).sort((a, b) => b.examDate.localeCompare(a.examDate)),
    [allExaminations, currentPatientId]
  );

  const patientReports = useMemo(() => {
    if (!patient) return [];
    const patientExamIds = new Set<string>(patientExams.map((e) => e.id));
    return reports.filter((r) => patientExamIds.has(r.examId));
  }, [reports, patientExams, patient]);

  const reportVersions = useMemo(
    () => [...(report.versions || [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [report.versions, selectedExamId]
  );

  const [showVersionsPanel, setShowVersionsPanel] = useState(false);
  const [diffVersionId, setDiffVersionId] = useState<string | null>(null);

  const versionTypeLabels: Record<ReportVersionType, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
    before_sign: { label: '签发前', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
    after_sign: { label: '已签发', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: PenLine },
    auto_save: { label: '自动保存', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: History },
    manual: { label: '手动快照', color: 'bg-violet-50 text-violet-700 border-violet-200', icon: Camera },
    restore_before: { label: '恢复前', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: RotateCcw },
    restore_to: { label: '恢复至', color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200', icon: RotateCcw },
  };

  const handleSnapshot = () => {
    const note = prompt('请输入版本备注（可选）：', '');
    const op = prompt('请输入操作人姓名（可选）：', '') || undefined;
    snapshotReport(selectedExamId, 'manual', note || undefined, op);
  };

  const handleRestore = (verId: string) => {
    if (!confirm('确定要恢复到此版本吗？当前编辑内容会被覆盖。')) return;
    const op = prompt('请输入操作人姓名（可选）：', '') || undefined;
    restoreReportVersion(selectedExamId, verId, op);
    setDiffVersionId(null);
  };

  const [searchKeyword, setSearchKeyword] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    Object.fromEntries(termLibrary.map((c) => [c.name, true]))
  );
  const [hoveredTerm, setHoveredTerm] = useState<TermItem | null>(null);
  const [insertTarget, setInsertTarget] = useState<InsertTarget>('findings');
  const [doctorName, setDoctorName] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showInsertMenu, setShowInsertMenu] = useState<TermItem | null>(null);

  useEffect(() => {
    checkCompletenessRef.current();
  }, []);

  const searchResults = useMemo(
    () => searchTerms(searchKeyword),
    [searchKeyword]
  );

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const insertTermToField = (term: TermItem, target: InsertTarget) => {
    const fieldMap: Record<InsertTarget, keyof typeof report> = {
      findings: 'structuredFindings',
      diagnosis: 'diagnosis',
      recommendations: 'recommendations',
      conclusion: 'conclusion',
    };
    const field = fieldMap[target];
    const currentValue = (report[field] as string) || '';
    const separator = currentValue && !currentValue.endsWith('\n') ? '\n' : '';
    const newValue = currentValue + separator + term.text;
    updateReportField(field, newValue);
    const newTerms = [...(report.insertedTerms || []), `${term.code}|${target}`];
    updateReportField('insertedTerms', newTerms);
    setShowInsertMenu(null);
  };

  const handleSignReport = () => {
    if (!doctorName.trim()) return;
    signReport(doctorName.trim());
  };

  const handleExportSummary = () => {
    if (!patient || !exam) return;
    const content = exportPatientSummary(patient, exam, report);
    const filename = `${patient.name}_${exam.examDate}_患者说明.txt`;
    downloadText(filename, content);
  };

  const handlePrint = () => {
    window.print();
  };

  const copyTermCode = (term: TermItem) => {
    navigator.clipboard.writeText(term.text);
  };

  const renderTermLibrary = () => {
    const displayCategories: TermCategory[] = searchKeyword.trim()
      ? [{ name: '搜索结果', terms: searchResults }]
      : termLibrary;

    return (
      <div className="flex flex-col gap-1.5">
        {displayCategories.map((cat) => (
          <div key={cat.name} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => toggleCategory(cat.name)}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 transition-colors"
            >
              <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                {cat.name}
                <span className="text-xs font-normal text-slate-400">({cat.terms.length})</span>
              </span>
              {expandedCategories[cat.name] ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>
            {expandedCategories[cat.name] && (
              <div className="border-t border-slate-100 max-h-64 overflow-y-auto">
                {cat.terms.length === 0 ? (
                  <div className="px-3 py-6 text-center text-xs text-slate-400">
                    暂无匹配术语
                  </div>
                ) : (
                  <div className="py-1">
                    {cat.terms.map((term) => (
                      <div
                        key={term.code}
                        className="relative group px-3 py-2 cursor-pointer hover:bg-primary-50/60 transition-colors"
                        onMouseEnter={() => setHoveredTerm(term)}
                        onMouseLeave={() => setHoveredTerm(null)}
                      >
                        <div
                          className="flex items-start gap-2"
                          onClick={() => setShowInsertMenu(term)}
                        >
                          <span className="shrink-0 mt-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium bg-slate-100 text-slate-500 rounded">
                            {term.code}
                          </span>
                          <span className="text-xs text-slate-700 leading-relaxed line-clamp-2 group-hover:text-primary-700">
                            {term.text}
                          </span>
                        </div>

                        {hoveredTerm?.code === term.code && (
                          <div className="absolute left-full top-0 ml-2 w-64 z-50 bg-slate-800 text-white rounded-lg shadow-xl p-3 text-xs leading-relaxed animate-fade-in-up">
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700">
                              <span className="px-1.5 py-0.5 bg-primary-500/30 text-primary-200 rounded font-mono">
                                {term.code}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyTermCode(term);
                                }}
                                className="ml-auto inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                              >
                                <Copy className="w-3 h-3" />
                                复制
                              </button>
                            </div>
                            <div className="text-slate-200">{term.text}</div>
                          </div>
                        )}

                        {showInsertMenu?.code === term.code && (
                          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-40 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 w-44 animate-fade-in-up">
                            <div className="px-3 py-1.5 text-[11px] text-slate-400 border-b border-slate-100">
                              插入到以下区域
                            </div>
                            {([
                              { key: 'findings', label: '内镜所见', icon: FileText },
                              { key: 'diagnosis', label: '内镜诊断', icon: FileCheck },
                              { key: 'recommendations', label: '处理建议', icon: PenLine },
                              { key: 'conclusion', label: '复查建议', icon: Calendar },
                            ] as InsertMenuItem[]).map((item) => (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() => insertTermToField(term, item.key)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 transition-colors ${
                                  insertTarget === item.key ? 'bg-primary-50 text-primary-700' : 'text-slate-700'
                                }`}
                              >
                                <item.icon className="w-3.5 h-3.5" />
                                {item.label}
                              </button>
                            ))}
                            <div className="border-t border-slate-100 mt-1 pt-1">
                              <button
                                type="button"
                                onClick={() => setShowInsertMenu(null)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-50 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                                取消
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderEditorSection = (
    title: string,
    field: keyof typeof report,
    placeholder: string,
    rows: number,
    target: InsertTarget
  ) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-colors ${
            insertTarget === target
              ? 'bg-primary-100 text-primary-700 border border-primary-200'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
          onClick={() => setInsertTarget(target)}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${insertTarget === target ? 'bg-primary-500' : 'bg-slate-400'}`} />
          {insertTarget === target ? '插入目标区' : '设为目标'}
        </span>
      </div>
      <textarea
        rows={rows}
        className={`w-full px-5 py-4 text-sm text-slate-800 leading-relaxed bg-white resize-none focus:outline-none placeholder-slate-300 ${
          insertTarget === target ? 'ring-2 ring-inset ring-primary-200/60' : ''
        }`}
        placeholder={placeholder}
        value={(report[field] as string) || ''}
        onChange={(e) => updateReportField(field, e.target.value)}
      />
    </div>
  );

  const renderA4Preview = () => (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 p-5" style={{ aspectRatio: '1 / √1.414' }}>
      <div className="h-full flex flex-col text-[11px] text-slate-700">
        <div className="text-center border-b-2 border-slate-300 pb-3 mb-3">
          <div className="text-base font-bold text-slate-900 tracking-wider">消 化 内 镜 检 查 报 告</div>
          <div className="text-[10px] text-slate-500 mt-1">GASTROINTESTINAL ENDOSCOPY REPORT</div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3 pb-3 border-b border-dashed border-slate-200">
          <div className="flex">
            <span className="text-slate-500 shrink-0">姓名：</span>
            <span className="font-medium text-slate-800">{patient?.name || '--'}</span>
          </div>
          <div className="flex">
            <span className="text-slate-500 shrink-0">性别/年龄：</span>
            <span className="font-medium text-slate-800">
              {patient ? `${patient.gender} / ${patient.age}岁` : '--'}
            </span>
          </div>
          <div className="flex">
            <span className="text-slate-500 shrink-0">ID：</span>
            <span className="font-mono text-slate-800">{patient?.id || '--'}</span>
          </div>
          <div className="flex">
            <span className="text-slate-500 shrink-0">检查类型：</span>
            <span className="font-medium text-slate-800">{exam?.type || '--'}</span>
          </div>
          <div className="flex col-span-2">
            <span className="text-slate-500 shrink-0">检查日期：</span>
            <span className="font-medium text-slate-800">
              {exam ? `${exam.examDate} ${exam.examTime}` : '--'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden space-y-2.5">
          <div>
            <div className="font-bold text-slate-800 text-[11px] mb-1">【内镜所见】</div>
            <div className="text-[10.5px] leading-relaxed text-slate-600 line-clamp-6 whitespace-pre-wrap">
              {report.structuredFindings || '（待填写）'}
            </div>
          </div>

          <div>
            <div className="font-bold text-slate-800 text-[11px] mb-1">【内镜诊断】</div>
            <div className="text-[10.5px] leading-relaxed text-slate-600 line-clamp-3 whitespace-pre-wrap">
              {report.diagnosis || '（待填写）'}
            </div>
          </div>

          <div>
            <div className="font-bold text-slate-800 text-[11px] mb-1">【处理建议】</div>
            <div className="text-[10.5px] leading-relaxed text-slate-600 line-clamp-3 whitespace-pre-wrap">
              {report.recommendations || '（待填写）'}
            </div>
          </div>
        </div>

        <div className="mt-auto pt-3 border-t border-dashed border-slate-200">
          <div className="flex items-end justify-between">
            <div className="text-[10px] text-slate-500">
              <div>操作医师：{exam?.operatorName || '--'}</div>
              {report.doctorSignature && (
                <div className="mt-1 text-primary-700 font-medium">
                  签发医师：{report.doctorSignature}
                </div>
              )}
            </div>
            <div className="text-[10px] text-slate-500 text-right">
              {report.signedAt ? (
                <div>
                  签发日期：
                  <span className="font-medium text-slate-700">
                    {new Date(report.signedAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              ) : (
                <div>报告日期：{exam?.examDate || '--'}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        <div
          className="shrink-0 bg-white border-r border-slate-200 flex flex-col"
          style={{ width: 260 }}
        >
          <div className="px-4 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">标准术语库</h2>
                <p className="text-[10px] text-slate-400">点击术语快速插入</p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索术语或代码..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder-slate-400"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {renderTermLibrary()}
          </div>

          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60">
            <div className="text-[11px] text-slate-500 leading-relaxed">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                <span className="font-medium text-slate-600">插入目标区域</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {([
                  { key: 'findings', label: '所见' },
                  { key: 'diagnosis', label: '诊断' },
                  { key: 'recommendations', label: '建议' },
                  { key: 'conclusion', label: '复查' },
                ] as { key: InsertTarget; label: string }[]).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setInsertTarget(item.key)}
                    className={`py-1.5 text-[11px] rounded-md transition-all ${
                      insertTarget === item.key
                        ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/30'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-primary-300 hover:text-primary-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200">
            {patientExams.length > 1 && (
              <div className="mb-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-2.5">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-600 tracking-wide">同一患者检查时间轴（可切换）</span>
                  <span className="ml-1 text-[11px] text-slate-400">共 {patientExams.length} 次</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {patientExams.map((e, idx) => {
                    const r = patientReports.find((pr) => pr.examId === e.id);
                    const typeStyle = examTypeMap[e.type as keyof typeof examTypeMap] || examTypeMap['胃镜'];
                    const isActive = e.id === selectedExamId;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => {
                          if (e.id !== selectedExamId) {
                            setSelectedExam(e.id);
                            navigate(`/report/${e.id}`, { replace: true });
                          }
                        }}
                        className={`group relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-primary-500 to-cyan-500 text-white border-transparent shadow-md shadow-primary-500/30'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-primary-300 hover:bg-white hover:shadow-sm'
                        }`}
                      >
                        {idx < patientExams.length - 1 && (
                          <div className={`absolute left-full top-1/2 -translate-y-1/2 w-3 h-px ${isActive ? 'bg-primary-200' : 'bg-slate-300'}`} style={{ marginLeft: '-2px' }} />
                        )}
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isActive ? 'bg-white/25' : typeStyle?.color || 'bg-primary-100 text-primary-700'}`}>
                          {idx + 1}
                        </span>
                        <div className="text-left leading-tight">
                          <div className="font-semibold">
                            {e.type} · {e.examDate.replace(/-/g, '/')}
                          </div>
                          <div className={`mt-0.5 text-[10px] ${isActive ? 'text-white/75' : 'text-slate-500'} font-mono`}>
                            {e.examTime} · {e.id}
                          </div>
                        </div>
                        {r?.doctorSignature && (
                          <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-200' : 'text-emerald-500'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-600">
                  最近编辑：
                  <span className="font-semibold text-slate-800 ml-1">
                    {report.lastEditedAt || '尚未开始编辑'}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs text-blue-700">
                  报告 ID：<span className="font-mono font-semibold ml-1">{report.id || '--'}</span>
                </span>
              </div>
              {report.doctorSignature && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <PenLine className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs text-emerald-700">
                    已签发 · <span className="font-semibold ml-0.5">{report.doctorSignature}</span>
                  </span>
                </div>
              )}
              {patientReports.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200">
                  <ListChecks className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-xs text-violet-700">
                    本患者报告：<span className="font-semibold ml-0.5">{patientReports.length} 份</span>
                  </span>
                </div>
              )}
              <div className="flex-1" />
            </div>
            <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={generateFindings}
              className="group relative inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-primary-500 to-cyan-500 text-white rounded-xl hover:from-primary-600 hover:to-cyan-600 transition-all shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span className="text-sm font-semibold tracking-wide">生成结构化所见</span>
            </button>

            <div className="h-8 w-px bg-slate-200 mx-1" />

            <button
              type="button"
              onClick={checkCompleteness}
              className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/40 transition-all"
            >
              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                <FileCheck className="w-3 h-3 text-slate-600" />
              </div>
              <span className="text-sm font-medium">检查完整性</span>
              <CircularProgress value={report.completenessScore || 0} />
            </button>

            <button
              type="button"
              onClick={handleSnapshot}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-violet-200 text-violet-700 rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span className="text-sm font-medium">保存快照</span>
            </button>

            <button
              type="button"
              onClick={() => setShowVersionsPanel(!showVersionsPanel)}
              className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                showVersionsPanel
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-transparent shadow-md shadow-violet-500/30'
                  : 'bg-white border-violet-200 text-violet-700 hover:border-violet-400 hover:bg-violet-50'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="text-sm font-medium">版本历史</span>
              {reportVersions.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  showVersionsPanel ? 'bg-white/25 text-white' : 'bg-violet-100 text-violet-700'
                }`}>
                  {reportVersions.length}
                </span>
              )}
            </button>

            <div className="flex-1" />

            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">预览报告</span>
            </button>

            <button
              type="button"
              onClick={handleSignReport}
              disabled={!doctorName.trim() || !!report.doctorSignature}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-sm shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0"
            >
              <PenLine className="w-4 h-4" />
              <span className="text-sm font-medium">
                {report.doctorSignature ? '已签发' : '签发报告'}
              </span>
            </button>
          </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {renderEditorSection(
              '【内镜所见】',
              'structuredFindings',
              '在此编辑内镜检查的详细描述。可从左侧术语库点击插入标准描述，或使用上方"生成结构化所见"按钮自动生成...',
              12,
              'findings'
            )}

            <div className="grid grid-cols-2 gap-5">
              {renderEditorSection(
                '【内镜诊断】',
                'diagnosis',
                '请输入内镜诊断结论，如：慢性非萎缩性胃炎、胃息肉...',
                5,
                'diagnosis'
              )}
              {renderEditorSection(
                '【处理建议】',
                'recommendations',
                '请输入处理建议，如：饮食指导、药物治疗、内镜下治疗建议...',
                5,
                'recommendations'
              )}
            </div>

            {renderEditorSection(
              '【复查建议】',
              'conclusion',
              '请输入复查建议，包括复查时间和注意事项...',
              4,
              'conclusion'
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 block mb-1">医师签名</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={report.doctorSignature || doctorName}
                          onChange={(e) => setDoctorName(e.target.value)}
                          disabled={!!report.doctorSignature}
                          placeholder="请输入医师姓名"
                          className="w-40 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                        />
                        {report.doctorSignature && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                            <FileCheck className="w-3 h-3" />
                            已认证
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="h-12 w-px bg-slate-200" />

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 block mb-1">签发日期</label>
                      <div className="text-sm text-slate-700 font-medium min-w-[140px]">
                        {report.signedAt
                          ? new Date(report.signedAt).toLocaleString('zh-CN')
                          : '签发后自动记录'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="text-right">
                    <div className="text-slate-400">已插入标准术语</div>
                    <div className="text-lg font-bold text-primary-600">
                      {(report.insertedTerms || []).length}
                      <span className="text-xs font-normal text-slate-400 ml-1">条</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="shrink-0 bg-white border-l border-slate-200 flex flex-col"
          style={{ width: 320 }}
        >
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">报告质控</h2>
                <p className="text-[10px] text-slate-400">漏填项智能检查</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  漏填项提示
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    report.missingFields.length === 0
                      ? 'bg-emerald-50 text-emerald-600'
                      : report.missingFields.length <= 3
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {report.missingFields.length === 0 ? '已完备' : `${report.missingFields.length} 项`}
                </span>
              </div>

              {report.missingFields.length === 0 ? (
                <div className="py-4 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                    <FileCheck className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="text-xs text-emerald-600 font-medium">报告信息完整</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">可签发正式报告</div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {report.missingFields.map((field) => (
                    <span
                      key={field}
                      className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] rounded-md border border-slate-200"
                    >
                      <span className="w-1 h-1 rounded-full bg-slate-400 mr-1.5" />
                      {field}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary-500" />
                  报告预览
                </span>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="text-[11px] text-primary-600 hover:text-primary-700 font-medium"
                >
                  全屏查看 →
                </button>
              </div>
              <div className="rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-200 bg-slate-100 p-3">
                {renderA4Preview()}
              </div>
            </div>
          </div>

          <div className="shrink-0 px-5 py-4 border-t border-slate-100 bg-slate-50/60 space-y-2.5">
            <button
              type="button"
              onClick={handleExportSummary}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/40 transition-all"
            >
              <FileDown className="w-4 h-4" />
              <span className="text-sm font-medium">导出简版说明</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl hover:from-slate-900 hover:to-slate-800 transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span className="text-sm font-medium">打印报告</span>
            </button>
          </div>
        </div>
      </div>

      {showPreviewModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-8"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">报告预览</h3>
                  <p className="text-xs text-slate-500">
                    {patient?.name || ''} · {exam?.type || ''} · {exam?.examDate || ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  打印
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100">
              <div className="max-w-md mx-auto" style={{ aspectRatio: '1 / 1.414' }}>
                {(() => {
                  const content = renderA4Preview();
                  return content;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {showVersionsPanel && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setShowVersionsPanel(false)} />
          <div className="relative w-[440px] max-w-[90vw] bg-white shadow-2xl h-full flex flex-col animate-[slideInFromRight_0.3s_ease-out]">
            <div className="shrink-0 px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-violet-50 to-fuchsia-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-sm">
                  <History className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 tracking-wide">版本历史</h3>
                  <p className="text-[11px] text-slate-500">共 {reportVersions.length} 个版本 · 签发时自动保存</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowVersionsPanel(false); setDiffVersionId(null); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {reportVersions.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                    <Camera className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-600 mb-1">暂无版本记录</p>
                  <p className="text-xs text-slate-400">签发报告时会自动保存版本快照<br />也可以点击「保存快照」手动创建</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {reportVersions.map((ver, idx) => {
                    const cfg = versionTypeLabels[ver.versionType];
                    const Icon = cfg.icon;
                    const isDiffing = diffVersionId === ver.id;
                    return (
                      <div key={ver.id} className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                        <div className={`p-4 ${isDiffing ? 'bg-violet-50/70' : 'bg-white'}`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.color} border`}>
                              <Icon className="w-4.5 h-4.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold ${cfg.color}`}>
                                  {cfg.label}
                                </span>
                                <span className="text-xs font-bold text-slate-800">#{reportVersions.length - idx}</span>
                                {idx === 0 && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-800 text-white text-[10px] font-semibold">
                                    当前基准
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-700 font-mono mb-0.5">{ver.createdAt}</div>
                              {ver.operatorName && (
                                <div className="text-[11px] text-slate-500">操作人：<span className="text-slate-700 font-medium">{ver.operatorName}</span></div>
                              )}
                              {ver.note && (
                                <div className="mt-1.5 text-[11px] text-violet-700 bg-violet-50 rounded-lg px-2 py-1.5 border border-violet-100">
                                  📝 {ver.note}
                                </div>
                              )}
                              <div className="text-[10px] text-slate-400 mt-1.5 font-mono">v{ver.id.slice(-6)}</div>
                            </div>
                          </div>

                          <div className="mt-3.5 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDiffVersionId(isDiffing ? null : ver.id)}
                              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                isDiffing
                                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm shadow-violet-500/20'
                                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50'
                              }`}
                            >
                              <GitCompare className="w-3.5 h-3.5" />
                              {isDiffing ? '关闭差异' : '查看差异'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRestore(ver.id)}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white border border-rose-200 text-rose-700 hover:border-rose-400 hover:bg-rose-50 transition-all"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              恢复此版本
                            </button>
                          </div>
                        </div>

                        {isDiffing && (() => {
                          const fields: Array<{ key: keyof typeof ver.snapshot; label: string; isText?: boolean }> = [
                            { key: 'structuredFindings', label: '结构化所见', isText: true },
                            { key: 'diagnosis', label: '诊断', isText: true },
                            { key: 'recommendations', label: '建议', isText: true },
                            { key: 'conclusion', label: '结论', isText: true },
                            { key: 'doctorSignature', label: '签发医生' },
                            { key: 'completenessScore', label: '完整性评分' },
                          ];
                          return (
                            <div className="border-t border-violet-100 bg-gradient-to-br from-slate-50 to-white p-4 space-y-3">
                              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                <GitCompare className="w-3.5 h-3.5 text-violet-600" />
                                <span className="text-xs font-bold text-slate-700">与当前版本对比</span>
                              </div>
                              {fields.map(({ key, label, isText }) => {
                                const oldVal = typeof ver.snapshot[key] === 'number' ? String(ver.snapshot[key]) : (ver.snapshot[key] as string) || '';
                                const curVal = typeof report[key as keyof typeof report] === 'number' ? String(report[key as keyof typeof report]) : (report[key as keyof typeof report] as string) || '';
                                const isSame = oldVal === curVal;
                                if (isText && !oldVal && !curVal) return null;
                                if (isSame && !oldVal) return null;
                                return (
                                  <div key={key} className={`rounded-lg border p-3 ${isSame ? 'border-emerald-100 bg-emerald-50/40' : 'border-amber-100 bg-amber-50/40'}`}>
                                    <div className="flex items-center gap-1.5 mb-2">
                                      {isSame ? (
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <AlertCircle className="w-3 h-3 text-amber-600" />
                                      )}
                                      <span className="text-[11px] font-bold text-slate-700">{label}</span>
                                      {!isSame && <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md bg-amber-200 text-amber-800 font-semibold">有变化</span>}
                                    </div>
                                    {isText ? (
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <div className="text-[10px] text-slate-400 mb-1 font-medium">该版本</div>
                                          <div className="text-[11px] text-slate-700 bg-white rounded-md p-2 border border-slate-200 whitespace-pre-wrap max-h-28 overflow-y-auto">
                                            {oldVal || <span className="text-slate-400">（空）</span>}
                                          </div>
                                        </div>
                                        <div>
                                          <div className="text-[10px] text-slate-400 mb-1 font-medium">当前版本</div>
                                          <div className="text-[11px] text-slate-700 bg-white rounded-md p-2 border border-slate-200 whitespace-pre-wrap max-h-28 overflow-y-auto">
                                            {curVal || <span className="text-slate-400">（空）</span>}
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-3 text-[11px]">
                                        <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-mono">
                                          {oldVal || <span className="text-slate-400">空</span>}
                                        </span>
                                        <ArrowRight className="w-3 h-3 text-slate-400" />
                                        <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-mono">
                                          {curVal || <span className="text-slate-400">空</span>}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
