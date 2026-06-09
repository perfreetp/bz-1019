export interface TermCategory {
  name: string;
  terms: TermItem[];
}

export interface TermItem {
  code: string;
  text: string;
}

export const termLibrary: TermCategory[] = [
  {
    name: '食管描述',
    terms: [
      { code: 'ESO-001', text: '食管黏膜光滑，血管纹理清晰，扩张度好，齿状线清晰' },
      { code: 'ESO-002', text: '食管中段可见一纵形糜烂灶，表面覆白苔，周围黏膜充血水肿' },
      { code: 'ESO-003', text: '食管下段可见数条纵形充血带，融合不超过3/4周径' },
      { code: 'ESO-004', text: '贲门开闭好，E-G线清楚' },
      { code: 'ESO-005', text: '食管下段近齿状线处可见岛状橘红色黏膜' },
    ],
  },
  {
    name: '胃部描述',
    terms: [
      { code: 'STO-001', text: '胃底、胃体黏膜光滑，色泽潮红，未见溃疡及出血' },
      { code: 'STO-002', text: '胃角弧形，黏膜光滑柔软，蠕动佳' },
      { code: 'STO-003', text: '胃窦黏膜充血水肿，红白相间，以红为主，呈花斑样改变' },
      { code: 'STO-004', text: '胃窦大弯侧可见一约0.6cm广基息肉，表面光滑' },
      { code: 'STO-005', text: '胃角中央可见一约1.2cm×0.8cm溃疡，底覆黄白苔，边缘整齐' },
      { code: 'STO-006', text: '胃体上部后壁可见一凹陷性病变，表面粗糙，边界欠清' },
      { code: 'STO-007', text: '幽门圆，开闭好，未见胆汁返流' },
    ],
  },
  {
    name: '十二指肠描述',
    terms: [
      { code: 'DUD-001', text: '十二指肠球部及降部未见异常' },
      { code: 'DUD-002', text: '十二指肠球部前壁可见一约0.5cm溃疡，底覆白苔' },
      { code: 'DUD-003', text: '十二指肠降部乳头形态正常，开口清晰' },
    ],
  },
  {
    name: '结直肠描述',
    terms: [
      { code: 'COL-001', text: '结肠各段黏膜光滑，血管纹理清晰，未见明显异常' },
      { code: 'COL-002', text: '直肠黏膜充血水肿，可见散在点状糜烂' },
      { code: 'COL-003', text: '乙状结肠可见一约0.8cm带蒂息肉，表面分叶状' },
      { code: 'COL-004', text: '升结肠可见多发憩室，黏膜光滑' },
      { code: 'COL-005', text: '横结肠肝曲可见一约1.5cm侧向发育型病变，颗粒型' },
      { code: 'COL-006', text: '回盲部回盲瓣形态正常，阑尾开口清晰' },
      { code: 'COL-007', text: '肛门可见内痔核，直肠黏膜光滑' },
    ],
  },
  {
    name: '内镜诊断',
    terms: [
      { code: 'DX-001', text: '慢性非萎缩性胃炎' },
      { code: 'DX-002', text: '反流性食管炎（LA-A级）' },
      { code: 'DX-003', text: '胃息肉' },
      { code: 'DX-004', text: '胃溃疡（A1期）' },
      { code: 'DX-005', text: '十二指肠球部溃疡（H2期）' },
      { code: 'DX-006', text: '结肠息肉' },
      { code: 'DX-007', text: '溃疡性结肠炎（活动期，轻度）' },
      { code: 'DX-008', text: 'Barrett食管' },
      { code: 'DX-009', text: '结肠憩室病' },
      { code: 'DX-010', text: '内痔' },
    ],
  },
  {
    name: '处理建议',
    terms: [
      { code: 'ADV-001', text: '建议清淡饮食，避免辛辣刺激食物' },
      { code: 'ADV-002', text: '质子泵抑制剂抑酸治疗4-8周后复查胃镜' },
      { code: 'ADV-003', text: '建议内镜下息肉切除术（EMR）' },
      { code: 'ADV-004', text: '已行活检，等待病理报告回报' },
      { code: 'ADV-005', text: '建议完善幽门螺杆菌检测，阳性者行根除治疗' },
      { code: 'ADV-006', text: '建议1-2年后复查肠镜' },
      { code: 'ADV-007', text: '建议转诊胃肠外科进一步评估' },
      { code: 'ADV-008', text: '止血治疗后观察，必要时再次内镜处理' },
    ],
  },
];

export function searchTerms(keyword: string): TermItem[] {
  if (!keyword.trim()) return [];
  const results: TermItem[] = [];
  termLibrary.forEach((cat) => {
    cat.terms.forEach((term) => {
      if (term.text.includes(keyword) || term.code.toLowerCase().includes(keyword.toLowerCase())) {
        results.push(term);
      }
    });
  });
  return results;
}
