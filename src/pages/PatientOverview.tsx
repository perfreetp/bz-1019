import { useState } from 'react';
import { useAppStore } from '@/store';
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

export default function PatientOverview() {
  const {
    patients,
    currentPatientId,
    setCurrentPatient,
    getCurrentPatient,
    examinations,
    importAppointments,
  } = useAppStore();

  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const patient = getCurrentPatient();
  const currentExam = examinations.find((e) => e.patientId === currentPatientId);
  const todayExams = examinations.filter((e) => e.examDate === '2026-06-09');

  const filteredPatients = patients.filter((p) =>
    p.name.includes(searchKeyword) || p.id.includes(searchKeyword),
  );

  const getPatientById = (id: string) => patients.find((p) => p.id === id);

  const handleImportAppointments = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,.csv';
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        importAppointments([]);
      }
    };
    fileInput.click();
  };

  return (
    <div className="min-h-screen bg-slate-50">
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
                    return (
                      <button
                        key={exam.id}
                        onClick={() => setCurrentPatient(exam.patientId)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          isCurrent
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
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${status?.color}`}
                              >
                                {exam.status === 'in_progress' && (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                )}
                                {exam.status === 'completed' && (
                                  <CheckCircle className="w-2.5 h-2.5" />
                                )}
                                {status?.label}
                              </span>
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
    </div>
  );
}
