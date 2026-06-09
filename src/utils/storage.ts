const STORAGE_PREFIX = 'endo-assist-';

export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn('Storage write failed:', e);
  }
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : defaultValue;
  } catch (e) {
    console.warn('Storage read failed:', e);
    return defaultValue;
  }
}

export function clearStorage(key: string): void {
  localStorage.removeItem(STORAGE_PREFIX + key);
}

export function exportPatientSummary(patient: any, exam: any, report: any): string {
  const lines: string[] = [];
  lines.push('================================================');
  lines.push('           消化内镜检查 - 患者告知说明');
  lines.push('================================================');
  lines.push('');
  lines.push(`患者姓名：${patient.name}      性别：${patient.gender}      年龄：${patient.age}岁`);
  lines.push(`检查类型：${exam.type}        检查日期：${exam.examDate}`);
  lines.push(`操作医师：${exam.operatorName}`);
  lines.push('');
  lines.push('------------------------------------------------');
  lines.push('一、主要检查所见：');
  lines.push('------------------------------------------------');
  lines.push(report.structuredFindings || '（详细请见正式报告）');
  lines.push('');
  lines.push('------------------------------------------------');
  lines.push('二、内镜诊断：');
  lines.push('------------------------------------------------');
  lines.push(report.diagnosis || '（详见病理回报后更新）');
  lines.push('');
  lines.push('------------------------------------------------');
  lines.push('三、处理建议及注意事项：');
  lines.push('------------------------------------------------');
  lines.push(report.recommendations || '1. 术后2小时可进食温凉流质饮食');
  lines.push('2. 如出现腹痛、黑便、呕血等请及时就诊');
  lines.push('3. 如有活检，请于3个工作日后查询病理报告');
  lines.push('');
  lines.push('------------------------------------------------');
  lines.push('四、复查建议：');
  lines.push('------------------------------------------------');
  lines.push(report.conclusion || '请遵医嘱定期复查');
  lines.push('');
  lines.push('================================================');
  lines.push(`本说明仅供参考，以正式报告为准。  ${new Date().toLocaleDateString('zh-CN')}`);
  lines.push('================================================');
  return lines.join('\n');
}

export function downloadText(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
