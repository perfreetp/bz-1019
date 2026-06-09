import { useMemo } from 'react';
import { useAppStore } from '@/store';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Activity,
  FileCheck2,
  Target,
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  User,
  ChevronRight,
  Award,
  ShieldCheck,
  BarChart3,
  PieChart as PieIcon,
  Gauge,
  AlertCircle,
} from 'lucide-react';

const workloadData = [
  { month: '1月', 胃镜: 186, 肠镜: 142, 合计: 328 },
  { month: '2月', 胃镜: 165, 肠镜: 128, 合计: 293 },
  { month: '3月', 胃镜: 210, 肠镜: 168, 合计: 378 },
  { month: '4月', 胃镜: 198, 肠镜: 155, 合计: 353 },
  { month: '5月', 胃镜: 225, 肠镜: 182, 合计: 407 },
  { month: '6月', 胃镜: 248, 肠镜: 201, 合计: 449 },
];

const diseaseData = [
  { name: '慢性胃炎', value: 186, color: '#60A5FA' },
  { name: '结肠息肉', value: 142, color: '#34D399' },
  { name: '胃/十二指肠溃疡', value: 98, color: '#FBBF24' },
  { name: '反流性食管炎', value: 76, color: '#A78BFA' },
  { name: '结直肠癌', value: 32, color: '#F87171' },
  { name: '其他', value: 54, color: '#94A3B8' },
];

const doctorMissingData = [
  { name: '陈主任', 漏填率: 3.2, 报告数: 128, 达标: true },
  { name: '赵副主任', 漏填率: 5.8, 报告数: 96, 达标: false },
  { name: '孙医师', 漏填率: 4.1, 报告数: 74, 达标: true },
  { name: '李医师', 漏填率: 2.5, 报告数: 62, 达标: true },
  { name: '周医师', 漏填率: 6.9, 报告数: 58, 达标: false },
  { name: '王医师', 漏填率: 1.8, 报告数: 45, 达标: true },
];

const missingFieldsData = [
  { field: 'Boston肠道准备评分', count: 42, ratio: 28.2, trend: 'down' as const },
  { field: '最深到达部位', count: 36, ratio: 24.2, trend: 'down' as const },
  { field: '操作医师签名', count: 28, ratio: 18.8, trend: 'up' as const },
  { field: '退镜时间', count: 24, ratio: 16.1, trend: 'down' as const },
  { field: '活检部位描述', count: 12, ratio: 8.1, trend: 'flat' as const },
  { field: '麻醉方式记录', count: 8, ratio: 4.6, trend: 'flat' as const },
];

const overtimeReports = [
  { id: 'R2026060501', patient: '张建国', type: '胃肠镜', doctor: '赵副主任', hours: 32, submitted: false },
  { id: 'R2026060408', patient: '李秀英', type: '肠镜', doctor: '周医师', hours: 26, submitted: false },
  { id: 'R2026060312', patient: '王大伟', type: '胃镜', doctor: '孙医师', hours: 18, submitted: true },
  { id: 'R2026060205', patient: '刘芳', type: '肠镜', doctor: '赵副主任', hours: 14, submitted: false },
];

const gaugeData = [
  { subject: '胃镜', A: 94, fullMark: 100 },
  { subject: '肠镜', A: 89, fullMark: 100 },
  { subject: '胃肠镜', A: 91, fullMark: 100 },
  { subject: '病理', A: 86, fullMark: 100 },
  { subject: '麻醉', A: 97, fullMark: 100 },
  { subject: '随访', A: 82, fullMark: 100 },
];

function KpiCard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  trendValue,
  gradient,
  children,
}: {
  icon: typeof Activity;
  label: string;
  value?: string | number;
  unit?: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  gradient: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-lg hover:border-slate-300 transition-all duration-300">
      <div className={`absolute top-0 right-0 w-40 h-40 ${gradient} rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2 group-hover:opacity-30 transition-opacity`} />
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center shadow-lg shadow-blue-500/20`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend && trendValue && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
              trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {trendValue}
            </span>
          )}
        </div>
        {value !== undefined && (
          <div className="text-4xl font-black text-slate-900 tracking-tight leading-none">
            {value}
            {unit && <span className="text-lg font-semibold text-slate-500 ml-1">{unit}</span>}
          </div>
        )}
        <div className={value !== undefined ? "mt-3" : ""}>
          <span className="text-sm font-medium text-slate-500">{label}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function RingProgress({ value, size = 130, stroke = 12 }: { value: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={stroke}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-slate-900">{value}%</span>
        <span className="text-[10px] text-slate-500 font-medium mt-0.5">完成度</span>
      </div>
    </div>
  );
}

function ChartCard({
  icon: Icon,
  title,
  subtitle,
  accent,
  children,
  action,
}: {
  icon: typeof BarChart3;
  title: string;
  subtitle?: string;
  accent: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${accent} flex items-center justify-center shadow-sm`}>
            <Icon className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function QualityDashboard() {
  const { followups, examinations, report } = useAppStore();

  const kpiSummary = useMemo(() => {
    const signedCount = examinations.filter((e) => e.status === 'signed').length;
    const colonExams = examinations.filter((e) => e.type !== '胃镜');
    const cecalReached = colonExams.filter(
      (e) => e.deepestReached.includes('盲肠') || e.deepestReached.includes('回盲'),
    );
    const adenomaRate = 38.6;

    return {
      totalExams: 449,
      momGrowth: 10.3,
      avgCompletion: 91.5,
      cecalRate: colonExams.length > 0 ? Math.round((cecalReached.length / Math.max(colonExams.length, 1)) * 1000) / 10 : 95.2,
      adenomaRate,
      signedCount,
    };
  }, [examinations]);

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <ShieldCheck className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">质控看板</h1>
              <p className="text-sm text-slate-500 mt-0.5">2026年6月 · 内镜中心质量监控数据</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                placeholder="搜索报告..."
                className="pl-9 pr-4 py-2 rounded-xl bg-slate-100 border border-transparent text-sm w-60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-400 transition-all"
              />
            </div>
            <button className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors inline-flex items-center gap-2">
              <Award className="w-4 h-4" />
              导出月报
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-4 gap-5">
          <KpiCard
            icon={Activity}
            label="本月检查总数"
            value={kpiSummary.totalExams}
            unit="例"
            trend="up"
            trendValue="+10.3% 环比"
            gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
          />

          <KpiCard
            icon={FileCheck2}
            label="报告平均完成率"
            trend="up"
            trendValue="+2.8% 环比"
            gradient="bg-gradient-to-br from-violet-500 to-fuchsia-500"
          >
            <div className="mt-4 flex justify-center">
              <RingProgress value={kpiSummary.avgCompletion} />
            </div>
          </KpiCard>

          <KpiCard
            icon={Target}
            label="盲肠插镜率"
            value={kpiSummary.cecalRate}
            unit="%"
            trend="up"
            trendValue="+1.5% 环比"
            gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
          >
            <div className="mt-4 flex items-center gap-2.5">
              <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                  style={{ width: `${kpiSummary.cecalRate}%` }}
                />
              </div>
              <span className="text-xs font-bold text-emerald-700 shrink-0">≥95%达标</span>
            </div>
          </KpiCard>

          <KpiCard
            icon={Search}
            label="腺瘤检出率"
            value={kpiSummary.adenomaRate}
            unit="%"
            trend="up"
            trendValue="+3.2% 环比"
            gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          >
            <div className="mt-4 flex items-center gap-2.5">
              <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                  style={{ width: `${kpiSummary.adenomaRate}%` }}
                />
              </div>
              <span className="text-xs font-bold text-amber-700 shrink-0">≥25%达标</span>
            </div>
          </KpiCard>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <ChartCard
            icon={BarChart3}
            title="月度工作量趋势"
            subtitle="近6个月 胃镜/肠镜检查量统计"
            accent="bg-gradient-to-br from-blue-500 to-cyan-500"
            action={
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 px-2.5 py-1 rounded-lg bg-blue-50">
                <TrendingUp className="w-3.5 h-3.5" />
                持续增长
              </span>
            }
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={workloadData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                      padding: '12px 16px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                    }}
                    itemStyle={{ padding: '2px 0' }}
                    labelStyle={{ marginBottom: '6px', fontWeight: 700 }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px', fontWeight: 600 }}
                  />
                  <Line type="monotone" dataKey="胃镜" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="肠镜" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="合计" stroke="#6366F1" strokeWidth={3.5} dot={{ r: 5, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard
            icon={PieIcon}
            title="病种分布统计"
            subtitle="本月检查确诊病种构成比"
            accent="bg-gradient-to-br from-violet-500 to-purple-600"
          >
            <div className="h-72 flex items-center">
              <div className="flex-1 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={diseaseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="#fff"
                    >
                      {diseaseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#F8FAFC',
                        fontSize: '12px',
                        padding: '12px 16px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-48 space-y-2.5 pl-2">
                {diseaseData.map((d, i) => {
                  const pct = ((d.value / 588) * 100).toFixed(1);
                  return (
                    <div key={i} className="flex items-center gap-2.5 group">
                      <span className="w-3 h-3 rounded-sm shrink-0 shadow-sm" style={{ backgroundColor: d.color }} />
                      <span className="text-xs text-slate-600 flex-1 truncate group-hover:text-slate-800">{d.name}</span>
                      <span className="text-xs font-bold text-slate-800 shrink-0 tabular-nums">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <ChartCard
            icon={AlertTriangle}
            title="各医师报告漏填率"
            subtitle="按出具报告数排序 · 阈值 5%"
            accent="bg-gradient-to-br from-rose-500 to-pink-600"
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={doctorMissingData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} unit="%" domain={[0, 10]} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#64748B"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                    tick={(props) => {
                      const { x, y, payload, index } = props;
                      const d = doctorMissingData[index];
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text x={0} y={0} dy={4} textAnchor="end" fill={d.达标 ? '#0F766E' : '#BE123C'} fontSize={12} fontWeight={600}>
                            {payload.value}
                            {d.达标 ? ' ✓' : ' !'}
                          </text>
                        </g>
                      );
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                      padding: '12px 16px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === '漏填率') return [`${value}%`, name];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="漏填率" barSize={22} radius={[0, 6, 6, 0]}>
                    {doctorMissingData.map((d, i) => (
                      <Cell
                        key={i}
                        fill={d.达标 ? 'url(#okBar)' : 'url(#badBar)'}
                      />
                    ))}
                    <defs>
                      <linearGradient id="okBar" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#34D399" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                      <linearGradient id="badBar" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#FB923C" />
                        <stop offset="100%" stopColor="#F43F5E" />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center gap-6 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-emerald-400 to-emerald-500" />
                <span className="text-xs text-slate-600 font-medium">达标（&lt;5%）</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-amber-400 to-rose-500" />
                <span className="text-xs text-slate-600 font-medium">超标（≥5%）</span>
              </div>
              <div className="ml-auto text-xs text-slate-500">
                达标率 <span className="font-bold text-slate-800">66.7%</span>
              </div>
            </div>
          </ChartCard>

          <ChartCard
            icon={Gauge}
            title="报告完成度仪表盘"
            subtitle="各检查类型综合评分"
            accent="bg-gradient-to-br from-amber-500 to-yellow-500"
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={gaugeData} cx="50%" cy="50%" outerRadius="75%">
                  <defs>
                    <radialGradient id="radarGrad">
                      <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#F97316" stopOpacity={0.6} />
                    </radialGradient>
                  </defs>
                  <PolarGrid stroke="#E2E8F0" strokeWidth={1.2} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 10 }} stroke="#CBD5E1" />
                  <Radar
                    name="完成度"
                    dataKey="A"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    fill="url(#radarGrad)"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                      padding: '12px 16px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                    }}
                    formatter={(value: number) => [`${value}分`, '完成度']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-2.5">
              {[
                { label: '平均分', value: '90分', color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: '最高项', value: '麻醉 97', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: '待改进', value: '随访 82', color: 'text-rose-600', bg: 'bg-rose-50' },
              ].map((s, i) => (
                <div key={i} className={`text-center py-2.5 rounded-xl ${s.bg}`}>
                  <div className={`text-[10px] font-medium mb-0.5 opacity-75`} style={{ color: 'inherit' }}>{s.label}</div>
                  <div className={`text-sm font-black ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-5 gap-5">
          <div className="col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-sm shadow-rose-500/30">
                  <AlertTriangle className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">高频漏填项统计</h3>
                  <p className="text-xs text-slate-500 mt-0.5">本月共发现 {missingFieldsData.reduce((s, x) => s + x.count, 0)} 项漏填</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 px-2.5 py-1 rounded-lg bg-slate-100">
                Top {missingFieldsData.length}
              </span>
            </div>
            <div>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">字段名称</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">漏填次数</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">占比</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">趋势</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-40">改善程度</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {missingFieldsData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                            i < 3 ? 'bg-gradient-to-br from-rose-500/10 to-orange-500/10 text-rose-600' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {i + 1}
                          </span>
                          <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-900">{row.field}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-lg font-black tabular-nums ${
                          row.count >= 30 ? 'text-rose-600' : row.count >= 15 ? 'text-amber-600' : 'text-slate-700'
                        }`}>
                          {row.count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                          {row.ratio}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.trend === 'down' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold">
                            <TrendingDown className="w-3.5 h-3.5" />
                            改善
                          </span>
                        ) : row.trend === 'up' ? (
                          <span className="inline-flex items-center gap-1 text-rose-600 text-xs font-bold">
                            <TrendingUp className="w-3.5 h-3.5" />
                            恶化
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 text-xs font-bold">
                            <span className="w-3.5 h-0.5 bg-slate-400 rounded-full inline-block" />
                            持平
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                row.trend === 'down' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                                row.trend === 'up' ? 'bg-gradient-to-r from-rose-400 to-pink-500' :
                                'bg-gradient-to-r from-slate-400 to-slate-500'
                              }`}
                              style={{ width: `${Math.min(row.ratio * 3, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center shadow-sm shadow-amber-500/30">
                  <Clock className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">超时未完成报告</h3>
                  <p className="text-xs text-slate-500 mt-0.5">超过24h未签发 · 共 {overtimeReports.length} 份</p>
                </div>
              </div>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {overtimeReports.map((r, i) => (
                <div key={i} className="px-5 py-4 hover:bg-slate-50/70 transition-colors group cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-sm">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      {r.submitted ? (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                          <AlertCircle className="w-2.5 h-2.5 text-white" />
                        </span>
                      ) : (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-900 truncate">{r.patient}</span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          r.type === '胃镜' ? 'bg-rose-50 text-rose-600' :
                          r.type === '肠镜' ? 'bg-sky-50 text-sky-600' :
                          'bg-violet-50 text-violet-600'
                        }`}>
                          {r.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <span className="truncate">{r.doctor}</span>
                        <span>·</span>
                        <span className="font-mono text-slate-400">{r.id.slice(-6)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          r.hours >= 24 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          <Clock className="w-3 h-3" />
                          超时 {r.hours}h
                        </span>
                        {r.submitted ? (
                          <span className="text-[11px] font-semibold text-emerald-600 inline-flex items-center gap-1">
                            已提交 <ChevronRight className="w-3 h-3" />
                          </span>
                        ) : (
                          <button className="text-[11px] font-bold text-white px-2.5 py-1 rounded-lg bg-gradient-to-r from-rose-500 to-amber-500 shadow-sm shadow-rose-500/20 hover:shadow-md transition-all inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            催办
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100">
              <button className="w-full text-xs font-bold text-slate-600 hover:text-slate-800 py-1.5 inline-flex items-center justify-center gap-1 group">
                查看全部超时报告
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {[
            { title: '随访跟进率', desc: '本月随访记录跟进情况', value: 86, color: 'from-violet-500 to-purple-600', total: followups.length, done: followups.filter(f => f.status !== 'pending').length },
            { title: '病理相符率', desc: '内镜诊断与病理一致', value: 94.2, color: 'from-teal-500 to-cyan-600', suffix: '%' },
            { title: '患者满意度', desc: '近30日回收问卷评分', value: 4.8, color: 'from-pink-500 to-rose-600', suffix: '/5.0', total: 326 },
          ].map((s, i) => (
            <div key={i} className={`relative bg-gradient-to-br ${s.color} rounded-2xl p-6 text-white shadow-lg overflow-hidden group hover:shadow-xl transition-shadow`}>
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl group-hover:scale-125 transition-transform duration-500" />
              <div className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold opacity-95">{s.title}</h3>
                    <p className="text-xs opacity-70 mt-0.5">{s.desc}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-5xl font-black tracking-tight leading-none">
                    {s.value}{s.suffix || ''}
                  </span>
                </div>
                {s.total !== undefined && (
                  <div className="text-xs opacity-80 font-medium">
                    {s.done !== undefined ? `已处理 ${s.done} / 共 ${s.total} 条` : `样本量 ${s.total} 份`}
                  </div>
                )}
                <div className="mt-5 h-2 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full bg-white/90 rounded-full shadow-lg"
                    style={{ width: `${(typeof s.value === 'number' ? (s.suffix === '/5.0' ? (s.value / 5) * 100 : s.value) : 80)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
