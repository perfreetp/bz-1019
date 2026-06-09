export interface DiagnosisHint {
  diagnosis: string;
  icdCode: string;
  probability: number;
  keyFeatures: string[];
  nextSteps: string[];
}

const diagnosisDatabase: DiagnosisHint[] = [
  {
    diagnosis: '反流性食管炎（LA-A级）',
    icdCode: 'K21.0',
    probability: 0.85,
    keyFeatures: ['食管下段纵形糜烂', '融合<3/4周径', '伴反酸烧心症状'],
    nextSteps: ['PPI治疗8周', '抬高床头15cm', '避免咖啡浓茶'],
  },
  {
    diagnosis: 'Barrett食管（短段）',
    icdCode: 'K22.7',
    probability: 0.72,
    keyFeatures: ['食管下段橘红色岛状黏膜', '齿状线上移', '长径<3cm'],
    nextSteps: ['四象限活检', 'PPI维持治疗', '1年后复查胃镜'],
  },
  {
    diagnosis: '慢性萎缩性胃炎（C-2型）',
    icdCode: 'K29.4',
    probability: 0.68,
    keyFeatures: ['胃体小弯黏膜变薄', '血管透见', '皱襞变平'],
    nextSteps: ['胃窦+胃体多点活检', 'Hp根除治疗', '1-2年复查胃镜'],
  },
  {
    diagnosis: '胃溃疡（A1期，Forrest IIa）',
    icdCode: 'K25.0',
    probability: 0.90,
    keyFeatures: ['胃角圆形溃疡', '底覆黄白苔', '周围黏膜充血', '可见裸露血管'],
    nextSteps: ['抑酸治疗6-8周', '活检排除恶性', '4周后复查胃镜', 'Hp检测'],
  },
  {
    diagnosis: '早期胃癌（凹陷型，IIc）',
    icdCode: 'C16.9',
    probability: 0.55,
    keyFeatures: ['胃体上部后壁', '不规则凹陷', '边界不清', '黏膜粗糙颗粒感'],
    nextSteps: ['靛胭脂染色+放大内镜', '靶向活检', '转诊外科评估ESD指征'],
  },
  {
    diagnosis: '结肠管状腺瘤（低级别上皮内瘤变）',
    icdCode: 'D12.6',
    probability: 0.78,
    keyFeatures: ['乙状结肠', '0.8cm带蒂息肉', '表面分叶', '色泽发红'],
    nextSteps: ['内镜下切除（EMR/圈套）', '完整送病理', '1年后复查肠镜'],
  },
  {
    diagnosis: '结肠侧向发育型肿瘤（LST-G）',
    icdCode: 'D12.6',
    probability: 0.65,
    keyFeatures: ['横结肠肝曲', '1.5cm颗粒型病变', '边界清楚', '中央凹陷'],
    nextSteps: ['放大+NBI评估pit pattern', 'ESD切除', '密切随访'],
  },
  {
    diagnosis: '溃疡性结肠炎（活动期，E2型）',
    icdCode: 'K51.3',
    probability: 0.82,
    keyFeatures: ['直肠至降结肠连续性病变', '黏膜弥漫充血', '点状糜烂', '血管纹理消失'],
    nextSteps: ['多段活检', '美沙拉嗪诱导缓解', '粪菌检测', '消化科随访'],
  },
  {
    diagnosis: '内痔（III度）',
    icdCode: 'K64.1',
    probability: 0.88,
    keyFeatures: ['肛门', '内痔核脱出', '排便后自行回纳', '无痛性便血史'],
    nextSteps: ['肛肠科会诊', '硬化剂注射或套扎', '高纤维饮食，保持大便通畅'],
  },
  {
    diagnosis: '结肠憩室病（无并发症）',
    icdCode: 'K57.3',
    probability: 0.70,
    keyFeatures: ['升结肠多发憩室', '黏膜光滑', '开口正常', '无粪石嵌顿'],
    nextSteps: ['高膳食纤维饮食', '避免坚果类食物', '出现腹痛发热及时就诊'],
  },
];

export function getDiagnosisHints(location: string, features: string[]): DiagnosisHint[] {
  const scored = diagnosisDatabase.map((h) => {
    let score = h.probability;
    const locLower = location.toLowerCase();
    const featText = features.join(' ');

    const hText = h.keyFeatures.join(' ') + h.diagnosis;
    if (hText.includes(location) || (locLower.includes('胃') && h.icdCode.startsWith('K25'))) {
      score += 0.1;
    }
    if (locLower.includes('食管') && h.icdCode.startsWith('K21')) {
      score += 0.1;
    }
    if (locLower.includes('结肠') || locLower.includes('直肠') || locLower.includes('乙状')) {
      if (h.icdCode.startsWith('D12') || h.icdCode.startsWith('K51') || h.icdCode.startsWith('K57') || h.icdCode.startsWith('K64')) {
        score += 0.1;
      }
    }

    features.forEach((f) => {
      if (hText.includes(f)) {
        score += 0.05;
      }
    });

    return { ...h, probability: Math.min(0.99, score) };
  });

  return scored.sort((a, b) => b.probability - a.probability).slice(0, 5);
}

export const morphologyOptions = [
  '隆起型（Is）',
  '隆起型（Ip）',
  '隆起型（Isp）',
  '平坦隆起型（IIa）',
  '平坦型（IIb）',
  '平坦凹陷型（IIc）',
  '凹陷型（III）',
  '溃疡型',
];

export const surfaceFeatureOptions = [
  '光滑',
  '颗粒状',
  '结节状',
  '分叶状',
  '糜烂',
  '溃疡形成',
  '白苔附着',
  '充血发红',
  '腺管开口紊乱',
];

export const forrestGradeOptions = [
  'I a：喷射状活动性出血',
  'I b：渗血性活动性出血',
  'II a：裸露血管',
  'II b：血凝块附着',
  'II c：黑色基底',
  'III：基底洁净，无出血征象',
];
