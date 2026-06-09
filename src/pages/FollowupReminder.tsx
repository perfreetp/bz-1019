import { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import type { Followup, Patient } from '@/types';
import {
  Bell,
  Search,
  Calendar,
  Filter,
  Plus,
  CheckCircle2,
  Eye,
  Edit3,
  Send,
  AlertTriangle,
  Clock,
  User,
  X,
  ChevronDown,
  AlertCircle,
  Phone,
  MessageSquare,
  Smartphone,
  Users,
} from 'lucide-react';

const tabs = [
  { key: 'all', label: '全部', icon: Filter },
  { key: 'high', label: '高风险', icon: AlertTriangle },
  { key: 'pending', label: '待处理', icon: Clock },
  { key: 'completed', label: '已完成', icon: CheckCircle2 },
  { key: 'overdue', label: '逾期', icon: AlertCircle },
];

const riskConfig = {
  high: { label: '高风险', bg: 'bg-rose-500/10', text: 'text-rose-600', border: 'border-rose-200', badge: 'bg-rose-500', dot: 'bg-rose-500' },
  medium: { label: '中风险', bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-200', badge: 'bg-amber-500', dot: 'bg-amber-500' },
  low: { label: '低风险', bg: 'bg-sky-500/10', text: 'text-sky-600', border: 'border-sky-200', badge: 'bg-sky-500', dot: 'bg-sky-500' },
};

const statusConfig = {
  pending: { label: '待处理', bg: 'bg-amber-50 text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  completed: { label: '已完成', bg: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  overdue: { label: '逾期', bg: 'bg-rose-50 text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
};

const reminderTypeIcons: Record<string, typeof Phone> = {
  '短信': MessageSquare,
  '电话': Phone,
  'APP推送': Smartphone,
  '短信+电话': Bell,
  '电话+家属通知': Users,
  '电话+立即处理': AlertTriangle,
};

function calcDaysLeft(plannedDate: string): number {
  const today = new Date('2026-06-09');
  const planned = new Date(plannedDate);
  const diff = Math.ceil((planned.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function PatientSelect({
  patients,
  value,
  onChange,
  placeholder = '选择患者',
}: {
  patients: Patient[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [kw, setKw] = useState('');
  const selected = patients.find((p) => p.id === value);
  const filtered = patients.filter((p) => p.name.includes(kw) || p.id.includes(kw));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-left transition-all ${
          value
            ? 'border-slate-300 bg-white'
            : 'border-slate-300 bg-slate-50'
        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
      >
        {selected ? (
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-medium ${
              selected.gender === '男' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-pink-500 to-rose-500'
            }`}>
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-800">{selected.name}</div>
              <div className="text-[10px] text-slate-400">{selected.id} · {selected.gender} · {selected.age}岁</div>
            </div>
          </div>
        ) : (
          <span className="text-sm text-slate-400">{placeholder}</span>
        )}
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
          <div className="p-2.5 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={kw}
                onChange={(e) => setKw(e.target.value)}
                placeholder="搜索..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onChange(p.id);
                  setOpen(false);
                  setKw('');
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-blue-50/60 transition-colors text-left ${
                  p.id === value ? 'bg-blue-50/80' : ''
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs ${
                  p.gender === '男' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-pink-500 to-rose-500'
                }`}>
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{p.name}</div>
                  <div className="text-[10px] text-slate-400">{p.id} · {p.gender} · {p.age}岁</div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-8 text-center text-xs text-slate-400">无匹配结果</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FollowupCard({
  item,
  patient,
  isHighlight = false,
  onComplete,
  onEdit,
  onRemind,
}: {
  item: Followup;
  patient?: Patient;
  isHighlight?: boolean;
  onComplete: () => void;
  onEdit: () => void;
  onRemind: () => void;
}) {
  const risk = riskConfig[item.riskLevel];
  const status = statusConfig[item.status];
  const days = calcDaysLeft(item.plannedDate);
  const ReminderIcon = reminderTypeIcons[item.reminderType] || Bell;
  const patientGender = patient?.gender;
  const patientAge = patient?.age;

  return (
    <div className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden ${
      isHighlight
        ? 'bg-gradient-to-r from-rose-50 via-rose-50/70 to-white border-rose-200 shadow-lg shadow-rose-500/10'
        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
    }`}>
      {isHighlight && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-red-500 to-rose-500" />
      )}
      <div className="p-5 flex items-stretch gap-5">
        <div className="flex-1 flex items-start gap-4 min-w-0">
          <div className="relative shrink-0">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
              patientGender === '女'
                ? 'bg-gradient-to-br from-pink-500 via-rose-500 to-red-500'
                : 'bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500'
            }`}>
              <User className="w-7 h-7 text-white" />
            </div>
            {isHighlight && (
              <div className="absolute -top-1 -right-1">
                <span className="relative inline-flex">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white shadow-lg">
                    <AlertTriangle className="w-2.5 h-2.5" />
                  </span>
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2.5">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-lg font-bold text-slate-900">{item.patientName}</h3>
              <span className="text-sm text-slate-500">
                {patientGender || '--'} · {patientAge || '--'}岁
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${risk.bg} ${risk.text} ${risk.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
                {risk.label}
              </span>
            </div>

            <div className="flex items-start gap-2 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-700 max-w-full">
                <span className="truncate">{item.reason}</span>
              </span>
            </div>

            <div className="flex items-center gap-5 text-sm">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{formatDate(item.plannedDate)}</span>
              </div>
              <div className={`inline-flex items-center gap-1.5 font-semibold ${
                days < 0 ? 'text-rose-600' : days <= 7 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                <Clock className="w-4 h-4" />
                {days < 0 ? `逾期 ${Math.abs(days)} 天` : days === 0 ? '今日到期' : `剩余 ${days} 天`}
              </div>
            </div>
          </div>
        </div>

        <div className="w-px bg-slate-200/70 shrink-0" />

        <div className="w-[280px] shrink-0 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">状态</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.bg} ${status.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">提醒方式</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                <ReminderIcon className="w-3.5 h-3.5 text-slate-500" />
                {item.reminderType}
              </span>
            </div>
            {item.status === 'completed' && item.reviewResult && (
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-400 mb-1">复查结果</div>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{item.reviewResult}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {item.status === 'pending' && (
              <button
                onClick={onComplete}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                标记完成
              </button>
            )}
            <button className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition-colors">
              <Eye className="w-3.5 h-3.5" />
              详情
            </button>
            <button
              onClick={onEdit}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRemind}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 text-amber-600 text-xs font-medium hover:bg-amber-100 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FollowupReminder() {
  const {
    followups,
    patients,
    createFollowup,
    updateFollowup,
    markFollowupCompleted,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState('all');
  const [searchKw, setSearchKw] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [resultText, setResultText] = useState('');

  const [form, setForm] = useState({
    patientId: '',
    reason: '',
    plannedDate: '',
    riskLevel: 'low' as Followup['riskLevel'],
    reminderType: '短信',
  });

  const resetForm = () => {
    setForm({ patientId: '', reason: '', plannedDate: '', riskLevel: 'low', reminderType: '短信' });
    setEditingId(null);
  };

  const highRiskList = useMemo(
    () => followups.filter((f) => f.riskLevel === 'high' && f.status !== 'completed'),
    [followups],
  );

  const filteredList = useMemo(() => {
    let list = followups.slice();
    switch (activeTab) {
      case 'high':
        list = list.filter((f) => f.riskLevel === 'high');
        break;
      case 'pending':
        list = list.filter((f) => f.status === 'pending');
        break;
      case 'completed':
        list = list.filter((f) => f.status === 'completed');
        break;
      case 'overdue':
        list = list.filter((f) => f.status === 'overdue');
        break;
    }
    if (searchKw.trim()) {
      list = list.filter(
        (f) =>
          f.patientName.includes(searchKw) ||
          f.reason.includes(searchKw) ||
          f.patientId.includes(searchKw),
      );
    }
    if (dateFrom) {
      list = list.filter((f) => f.plannedDate >= dateFrom);
    }
    if (dateTo) {
      list = list.filter((f) => f.plannedDate <= dateTo);
    }
    return list.sort((a, b) => {
      const riskOrder = { high: 0, medium: 1, low: 2 };
      if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      }
      return new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime();
    });
  }, [followups, activeTab, searchKw, dateFrom, dateTo]);

  const stats = useMemo(() => {
    return {
      total: followups.length,
      high: followups.filter((f) => f.riskLevel === 'high' && f.status !== 'completed').length,
      pending: followups.filter((f) => f.status === 'pending').length,
      completed: followups.filter((f) => f.status === 'completed').length,
      overdue: followups.filter((f) => f.status === 'overdue').length,
    };
  }, [followups]);

  const getPatient = (id: string) => patients.find((p) => p.id === id);

  const handleOpenNew = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (f: Followup) => {
    setForm({
      patientId: f.patientId,
      reason: f.reason,
      plannedDate: f.plannedDate,
      riskLevel: f.riskLevel,
      reminderType: f.reminderType,
    });
    setEditingId(f.id);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!form.patientId || !form.reason || !form.plannedDate) return;
    const p = patients.find((x) => x.id === form.patientId);
    const payload = {
      patientId: form.patientId,
      patientName: p?.name || '',
      reason: form.reason,
      plannedDate: form.plannedDate,
      riskLevel: form.riskLevel,
      status: 'pending' as Followup['status'],
      reminderType: form.reminderType,
      reviewResult: editingId ? (followups.find((f) => f.id === editingId)?.reviewResult || '') : '',
    };
    if (editingId) {
      updateFollowup(editingId, payload);
    } else {
      createFollowup(payload);
    }
    setShowModal(false);
    resetForm();
  };

  const handleOpenComplete = (id: string) => {
    setCompletingId(id);
    setResultText('');
    setShowResultModal(true);
  };

  const handleConfirmComplete = () => {
    if (completingId && resultText.trim()) {
      markFollowupCompleted(completingId, resultText.trim());
      setShowResultModal(false);
      setCompletingId(null);
      setResultText('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="py-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Bell className="w-5.5 h-5.5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">随访提醒</h1>
                <p className="text-sm text-slate-500 mt-0.5">共 {stats.total} 条随访记录</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 border border-rose-100">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-semibold text-rose-700">{stats.high} 高风险</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-amber-700">{stats.pending} 待处理</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700">{stats.completed} 已完成</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 -mb-px overflow-x-auto pb-0">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.key;
              const count = t.key === 'all' ? stats.total : stats[t.key as keyof typeof stats];
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`shrink-0 inline-flex items-center gap-2 px-5 py-3.5 border-b-2 text-sm font-semibold transition-all ${
                    active
                      ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-500' : ''}`} />
                  {t.label}
                  <span className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-[11px] font-semibold ${
                    active ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchKw}
              onChange={(e) => setSearchKw(e.target.value)}
              placeholder="搜索患者姓名、ID 或原因..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
            <span className="text-slate-400 text-sm">至</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          {(searchKw || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setSearchKw('');
                setDateFrom('');
                setDateTo('');
              }}
              className="px-4 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-100 transition-colors font-medium"
            >
              重置
            </button>
          )}
        </div>

        {highRiskList.length > 0 && activeTab !== 'completed' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 px-1">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-rose-500 to-red-500" />
              <h2 className="text-sm font-bold text-slate-800">高风险紧急随访</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[11px] font-semibold">
                {highRiskList.length} 条需立即关注
              </span>
            </div>
            <div className="space-y-3">
              {highRiskList.map((f) => (
                <FollowupCard
                  key={f.id}
                  item={f}
                  patient={getPatient(f.patientId)}
                  isHighlight
                  onComplete={() => handleOpenComplete(f.id)}
                  onEdit={() => handleOpenEdit(f)}
                  onRemind={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-cyan-500" />
            <h2 className="text-sm font-bold text-slate-800">
              {activeTab === 'all' ? '全部随访' : tabs.find((t) => t.key === activeTab)?.label}
            </h2>
            <span className="text-xs text-slate-400">{filteredList.length} 条记录</span>
          </div>
          {filteredList.length > 0 ? (
            <div className="space-y-3">
              {filteredList
                .filter((f) => !(highRiskList.find((h) => h.id === f.id) && activeTab !== 'completed' && f.riskLevel === 'high'))
                .map((f) => (
                  <FollowupCard
                    key={f.id}
                    item={f}
                    patient={getPatient(f.patientId)}
                    onComplete={() => handleOpenComplete(f.id)}
                    onEdit={() => handleOpenEdit(f)}
                    onRemind={() => {}}
                  />
                ))}
              {activeTab === 'completed' &&
                filteredList.map((f) => (
                  <FollowupCard
                    key={f.id}
                    item={f}
                    patient={getPatient(f.patientId)}
                    onComplete={() => {}}
                    onEdit={() => handleOpenEdit(f)}
                    onRemind={() => {}}
                  />
                ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 py-20 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Bell className="w-7 h-7 text-slate-400" />
              </div>
              <div className="text-sm font-medium text-slate-600">暂无匹配的随访记录</div>
              <div className="text-xs text-slate-400 mt-1">调整筛选条件或新建随访</div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleOpenNew}
        className="fixed right-8 bottom-8 z-30 group inline-flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 text-white font-semibold shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all duration-300"
      >
        <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
          <Plus className="w-4 h-4" />
        </span>
        新建随访
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="relative px-6 py-5 bg-gradient-to-r from-blue-50 to-violet-50 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {editingId ? '编辑随访' : '新建随访'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editingId ? '修改随访提醒信息' : '创建一条新的随访记录'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="w-9 h-9 rounded-xl hover:bg-white/80 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                  患者 <span className="text-rose-500">*</span>
                </label>
                <PatientSelect
                  patients={patients}
                  value={form.patientId}
                  onChange={(v) => setForm({ ...form, patientId: v })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                  随访原因 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  rows={2}
                  placeholder="例：结肠息肉术后复查 / 萎缩性胃炎随访..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                    计划日期 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.plannedDate}
                    onChange={(e) => setForm({ ...form, plannedDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">提醒方式</label>
                  <select
                    value={form.reminderType}
                    onChange={(e) => setForm({ ...form, reminderType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option>短信</option>
                    <option>电话</option>
                    <option>APP推送</option>
                    <option>短信+电话</option>
                    <option>电话+家属通知</option>
                    <option>电话+立即处理</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">风险等级</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map((lv) => {
                    const cfg = riskConfig[lv];
                    const selected = form.riskLevel === lv;
                    return (
                      <button
                        key={lv}
                        type="button"
                        onClick={() => setForm({ ...form, riskLevel: lv })}
                        className={`relative flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 transition-all ${
                          selected
                            ? `${cfg.bg} ${cfg.border} border-current shadow-md`
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${cfg.badge} ${selected ? 'ring-4 ring-current/20' : ''}`} />
                        <span className={`text-sm font-bold ${selected ? cfg.text : 'text-slate-700'}`}>
                          {cfg.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.patientId || !form.reason || !form.plannedDate}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {editingId ? '保存修改' : '创建随访'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">标记完成</h3>
                  <p className="text-xs text-slate-500 mt-0.5">请填写复查结果信息</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                复查结果 <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={resultText}
                onChange={(e) => setResultText(e.target.value)}
                rows={5}
                placeholder="请填写患者复查结果、病理报告、医嘱等信息..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowResultModal(false);
                  setCompletingId(null);
                  setResultText('');
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmComplete}
                disabled={!resultText.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                确认完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
