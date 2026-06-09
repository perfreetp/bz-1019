import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Star } from 'lucide-react';
import { useAppStore } from '../store';
import type { Consumable } from '../types';

const statusConfig = {
  pending: { label: '待检', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  in_progress: { label: '检查中', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  completed: { label: '已完成', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  signed: { label: '已签发', className: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const contraindicationOptions = ['严重心肺疾病', '凝血障碍', '妊娠', '肠梗阻', '其他'];

const deepestReachedOptions = [
  '食管上段',
  '食管中段',
  '食管下段',
  '贲门',
  '胃底',
  '胃体',
  '胃角',
  '胃窦',
  '幽门',
  '十二指肠球部',
  '十二指肠降部',
  '直肠',
  '乙状结肠',
  '降结肠',
  '脾曲',
  '横结肠',
  '肝曲',
  '升结肠',
  '盲肠',
  '盲肠（回盲瓣）',
  '末端回肠',
];

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="text-base font-semibold text-slate-800">{title}</span>
        {open ? (
          <ChevronDown className="w-5 h-5 text-slate-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-slate-500" />
        )}
      </button>
      {open && <div className="p-6">{children}</div>}
    </div>
  );
}

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}

function FormField({ label, children, required }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-600">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputBase =
  'w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all';

export default function ExaminationRecord() {
  const exam = useAppStore((s) => s.getCurrentExam());
  const selectedExamId = useAppStore((s) => s.selectedExamId);
  const updateExamField = useAppStore((s) => s.updateExamField);
  const addConsumable = useAppStore((s) => s.addConsumable);
  const removeConsumable = useAppStore((s) => s.removeConsumable);

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">未找到检查记录</p>
      </div>
    );
  }

  const status = statusConfig[exam.status];

  const handleChange = <K extends keyof typeof exam>(field: K, value: (typeof exam)[K]) => {
    updateExamField(selectedExamId, field, value);
  };

  const toggleContraindication = (item: string) => {
    const exists = exam.contraindications.includes(item);
    const next = exists
      ? exam.contraindications.filter((c) => c !== item)
      : [...exam.contraindications, item];
    handleChange('contraindications', next);
  };

  const handleAddConsumable = () => {
    const newItem: Consumable = { name: '', quantity: 1, batchNo: '' };
    addConsumable(selectedExamId, newItem);
  };

  const handleConsumableChange = (index: number, field: keyof Consumable, value: string | number) => {
    const updated = exam.consumables.map((c, i) =>
      i === index ? { ...c, [field]: value } : c,
    );
    handleChange('consumables', updated);
  };

  const renderStars = (score: number) => {
    const total = 9;
    const filled = Math.min(Math.max(score, 0), total);
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: total }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < filled ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">检查记录</h1>
            <p className="text-sm text-slate-500 mt-1">检查编号：{exam.id}</p>
          </div>
          <span
            className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-medium border ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        <Section title="基本信息">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="检查类型" required>
              <select
                className={inputBase}
                value={exam.type}
                onChange={(e) => handleChange('type', e.target.value as typeof exam.type)}
              >
                <option value="胃镜">胃镜</option>
                <option value="肠镜">肠镜</option>
                <option value="胃肠镜">胃肠镜</option>
              </select>
            </FormField>

            <FormField label="检查日期" required>
              <input
                type="date"
                className={inputBase}
                value={exam.examDate}
                onChange={(e) => handleChange('examDate', e.target.value)}
              />
            </FormField>

            <FormField label="检查时间" required>
              <input
                type="time"
                className={inputBase}
                value={exam.examTime}
                onChange={(e) => handleChange('examTime', e.target.value)}
              />
            </FormField>

            <FormField label="诊室">
              <input
                type="text"
                className={inputBase}
                placeholder="请输入诊室"
                value={exam.room}
                onChange={(e) => handleChange('room', e.target.value)}
              />
            </FormField>

            <FormField label="麻醉方式">
              <select
                className={inputBase}
                value={exam.anesthesiaType}
                onChange={(e) => handleChange('anesthesiaType', e.target.value)}
              >
                <option value="">请选择</option>
                <option value="无麻醉">无麻醉</option>
                <option value="口咽局部麻醉">口咽局部麻醉</option>
                <option value="静脉麻醉">静脉麻醉</option>
                <option value="全身麻醉">全身麻醉</option>
              </select>
            </FormField>

            <FormField label="术前诊断">
              <input
                type="text"
                className={inputBase}
                placeholder="请输入术前诊断"
                value={exam.preoperativeDiagnosis}
                onChange={(e) => handleChange('preoperativeDiagnosis', e.target.value)}
              />
            </FormField>
          </div>
        </Section>

        <Section title="术前评估">
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="ASA分级">
                <select
                  className={inputBase}
                  value={exam.asaGrade}
                  onChange={(e) => handleChange('asaGrade', e.target.value)}
                >
                  <option value="">请选择</option>
                  <option value="ASA I">ASA I - 正常健康</option>
                  <option value="ASA II">ASA II - 轻度系统性疾病</option>
                  <option value="ASA III">ASA III - 重度系统性疾病</option>
                  <option value="ASA IV">ASA IV - 严重系统性疾病威胁生命</option>
                </select>
              </FormField>

              <FormField label="Boston 肠道准备评分">
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={9}
                    className={inputBase}
                    value={exam.bostonScore}
                    onChange={(e) =>
                      handleChange('bostonScore', Math.min(9, Math.max(0, Number(e.target.value) || 0)))
                    }
                  />
                  {renderStars(exam.bostonScore)}
                </div>
              </FormField>
            </div>

            <FormField label="禁忌症核查">
              <div className="flex flex-wrap gap-3 pt-1">
                {contraindicationOptions.map((item) => {
                  const checked = exam.contraindications.includes(item);
                  return (
                    <label
                      key={item}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border cursor-pointer transition-all text-sm ${
                        checked
                          ? 'bg-rose-50 border-rose-300 text-rose-700'
                          : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-rose-500"
                        checked={checked}
                        onChange={() => toggleContraindication(item)}
                      />
                      {item}
                    </label>
                  );
                })}
              </div>
            </FormField>

            <FormField label="术前用药记录">
              <textarea
                rows={3}
                className={`${inputBase} resize-none`}
                placeholder="请输入术前用药情况，如：地西泮5mg肌注，东莨菪碱0.3mg肌注..."
                value={exam.preoperativeMedication}
                onChange={(e) => handleChange('preoperativeMedication', e.target.value)}
              />
            </FormField>
          </div>
        </Section>

        <Section title="器械与耗材">
          <div className="space-y-5">
            <FormField label="内镜型号">
              <input
                type="text"
                className={inputBase}
                placeholder="如：奥林巴斯 GIF-HQ290"
                value={exam.endoscopeModel}
                onChange={(e) => handleChange('endoscopeModel', e.target.value)}
              />
            </FormField>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-600">耗材列表</label>
                <button
                  type="button"
                  onClick={handleAddConsumable}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  新增
                </button>
              </div>

              {exam.consumables.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 py-8 text-center text-sm text-slate-400">
                  暂无耗材记录，点击右上角「新增」添加
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-medium text-slate-600 w-[40%]">
                          名称
                        </th>
                        <th className="px-4 py-2.5 text-left font-medium text-slate-600 w-[15%]">
                          数量
                        </th>
                        <th className="px-4 py-2.5 text-left font-medium text-slate-600 w-[35%]">
                          批号
                        </th>
                        <th className="px-4 py-2.5 w-[10%]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {exam.consumables.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              className="w-full px-2.5 py-1.5 rounded border border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all text-sm"
                              placeholder="耗材名称"
                              value={item.name}
                              onChange={(e) => handleConsumableChange(index, 'name', e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min={1}
                              className="w-full px-2.5 py-1.5 rounded border border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all text-sm"
                              value={item.quantity}
                              onChange={(e) =>
                                handleConsumableChange(index, 'quantity', Number(e.target.value) || 1)
                              }
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              className="w-full px-2.5 py-1.5 rounded border border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all text-sm"
                              placeholder="批号"
                              value={item.batchNo}
                              onChange={(e) => handleConsumableChange(index, 'batchNo', e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeConsumable(selectedExamId, index)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Section>

        <Section title="操作过程记录">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="进镜时间">
              <input
                type="time"
                className={inputBase}
                value={exam.insertionTime}
                onChange={(e) => handleChange('insertionTime', e.target.value)}
              />
            </FormField>

            <FormField label="最深到达部位">
              <select
                className={inputBase}
                value={exam.deepestReached}
                onChange={(e) => handleChange('deepestReached', e.target.value)}
              >
                <option value="">请选择</option>
                {deepestReachedOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="退镜时间">
              <input
                type="time"
                className={inputBase}
                value={exam.withdrawalTime}
                onChange={(e) => handleChange('withdrawalTime', e.target.value)}
              />
            </FormField>

            <div></div>

            <FormField label="操作医师">
              <input
                type="text"
                className={inputBase}
                placeholder="请输入操作医师姓名"
                value={exam.operatorName}
                onChange={(e) => handleChange('operatorName', e.target.value)}
              />
            </FormField>

            <FormField label="助手">
              <input
                type="text"
                className={inputBase}
                placeholder="请输入助手姓名"
                value={exam.assistantName}
                onChange={(e) => handleChange('assistantName', e.target.value)}
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField label="过程异常情况备注">
                <textarea
                  rows={4}
                  className={`${inputBase} resize-none`}
                  placeholder="请记录操作过程中的异常情况、特殊处理等..."
                  value={exam.processNotes}
                  onChange={(e) => handleChange('processNotes', e.target.value)}
                />
              </FormField>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
