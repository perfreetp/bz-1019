import { useState, useMemo, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { useAppStore } from '@/store';
import { termLibrary, searchTerms, type TermItem, type TermCategory } from '@/utils/termLibrary';
import { exportPatientSummary, downloadText } from '@/utils/storage';

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
  const {
    report,
    generateFindings,
    updateReportField,
    checkCompleteness,
    signReport,
    getCurrentPatient,
    getCurrentExam,
  } = useAppStore();

  const checkCompletenessRef = useRef(checkCompleteness);
  checkCompletenessRef.current = checkCompleteness;

  const patient = getCurrentPatient();
  const exam = getCurrentExam();

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
          <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200 flex items-center gap-3">
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
    </div>
  );
}
