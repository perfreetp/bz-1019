import type { Examination, Lesion, Annotation } from '../types';

export function generateStructuredFindings(
  exam: Examination,
  lesions: Lesion[],
  annotations: Annotation[],
): string {
  const sections: string[] = [];
  const hasGastro = exam.type === '胃镜' || exam.type === '胃肠镜';
  const hasColon = exam.type === '肠镜' || exam.type === '胃肠镜';

  sections.push('【进镜情况】');
  if (exam.insertionTime) {
    sections.push(`  进镜时间：${exam.insertionTime}`);
  }
  if (exam.deepestReached) {
    sections.push(`  最深到达：${exam.deepestReached}`);
  }
  if (exam.withdrawalTime) {
    sections.push(`  退镜时间：${exam.withdrawalTime}`);
  }
  if (exam.bostonScore) {
    sections.push(`  肠道准备 Boston 评分：${exam.bostonScore}分`);
  }
  sections.push('');

  if (hasGastro) {
    sections.push('【食管】');
    const esoLesions = lesions.filter((l) => l.location.includes('食管'));
    const esoAnns = annotations.filter((a) => {
      const loc = (a as any).imageLocation || '';
      return loc.includes('食管');
    });
    if (esoLesions.length === 0 && esoAnns.length === 0) {
      sections.push('  食管黏膜光滑，血管纹理清晰，扩张度好，齿状线清晰。');
    } else {
      esoLesions.forEach((l, i) => {
        sections.push(formatLesionDescription(l, i + 1));
      });
    }
    sections.push('');

    sections.push('【胃】');
    const stoLesions = lesions.filter(
      (l) => l.location.includes('胃') || l.location.includes('贲门') || l.location.includes('幽门'),
    );
    if (stoLesions.length === 0) {
      sections.push('  胃底、胃体黏膜光滑，色泽潮红，未见溃疡及出血。胃角弧形，黏膜光滑柔软，蠕动佳。');
      sections.push('  胃窦黏膜光滑，红白相间，以红为主。幽门圆，开闭好，未见胆汁返流。');
    } else {
      stoLesions.forEach((l, i) => {
        sections.push(formatLesionDescription(l, i + 1));
      });
    }
    sections.push('');

    sections.push('【十二指肠】');
    const dudLesions = lesions.filter((l) => l.location.includes('十二指肠'));
    if (dudLesions.length === 0) {
      sections.push('  十二指肠球部及降部未见异常。');
    } else {
      dudLesions.forEach((l, i) => {
        sections.push(formatLesionDescription(l, i + 1));
      });
    }
    sections.push('');
  }

  if (hasColon) {
    sections.push('【直肠及肛门】');
    const rectLesions = lesions.filter((l) => l.location.includes('直肠') || l.location.includes('肛门'));
    if (rectLesions.length === 0) {
      sections.push('  直肠黏膜光滑，血管纹理清晰。肛门未见明显异常。');
    } else {
      rectLesions.forEach((l, i) => sections.push(formatLesionDescription(l, i + 1)));
    }
    sections.push('');

    sections.push('【结肠各段】');
    const colLesions = lesions.filter(
      (l) =>
        l.location.includes('乙状') ||
        l.location.includes('降结肠') ||
        l.location.includes('横结肠') ||
        l.location.includes('升结肠') ||
        l.location.includes('盲肠'),
    );
    if (colLesions.length === 0) {
      sections.push('  乙状结肠、降结肠、横结肠、升结肠及回盲部黏膜光滑，血管纹理清晰，未见明显异常。');
      sections.push('  回盲瓣形态正常，阑尾开口清晰。');
    } else {
      colLesions.forEach((l, i) => sections.push(formatLesionDescription(l, i + 1)));
    }
    sections.push('');
  }

  if (lesions.some((l) => l.biopsy)) {
    sections.push('【活检情况】');
    lesions
      .filter((l) => l.biopsy)
      .forEach((l) => {
        sections.push(
          `  ${l.location}：活检${l.biopsy!.forcepsCount}块，标本号：${l.biopsy!.specimenNos.join('、')}`,
        );
      });
    sections.push('');
  }

  return sections.join('\n');
}

function formatLesionDescription(lesion: Lesion, idx: number): string {
  const parts: string[] = [];
  parts.push(`  病灶${idx}（${lesion.location}）：`);

  if (lesion.sizeMajor && lesion.sizeMinor) {
    parts.push(`大小约${lesion.sizeMajor}cm × ${lesion.sizeMinor}cm，`);
  } else if (lesion.sizeMajor) {
    parts.push(`直径约${lesion.sizeMajor}cm，`);
  }
  if (lesion.morphology) {
    parts.push(`形态学分类：${lesion.morphology}，`);
  }
  if (lesion.surfaceFeature) {
    parts.push(`表面${lesion.surfaceFeature}，`);
  }
  if (lesion.forrestGrade) {
    parts.push(`出血分级：${lesion.forrestGrade}，`);
  }
  if (lesion.activeBleeding) {
    parts.push('伴活动性出血，');
  }
  if (lesion.notes) {
    parts.push(lesion.notes);
  }

  let text = parts.join('');
  if (text.endsWith('，')) {
    text = text.slice(0, -1);
  }
  return text + '。';
}

export function checkReportCompleteness(
  exam: Examination,
  lesions: Lesion[],
  report: Partial<{ structuredFindings: string; diagnosis: string; recommendations: string; conclusion: string }>,
): { score: number; missingFields: string[] } {
  const checks: { field: string; label: string; passed: boolean }[] = [];

  checks.push({ field: 'examType', label: '检查类型', passed: !!exam.type });
  checks.push({ field: 'examDate', label: '检查日期', passed: !!exam.examDate });
  checks.push({ field: 'operator', label: '操作医师', passed: !!exam.operatorName });
  checks.push({ field: 'asaGrade', label: 'ASA分级', passed: !!exam.asaGrade });

  if (exam.type.includes('肠镜') || exam.type === '胃肠镜') {
    checks.push({ field: 'bostonScore', label: 'Boston评分', passed: exam.bostonScore > 0 });
    checks.push({ field: 'deepestReached', label: '到达部位', passed: !!exam.deepestReached });
  }

  checks.push({
    field: 'insertionTime',
    label: '进镜时间',
    passed: !!exam.insertionTime,
  });
  checks.push({
    field: 'withdrawalTime',
    label: '退镜时间',
    passed: !!exam.withdrawalTime,
  });

  checks.push({
    field: 'findings',
    label: '内镜所见描述',
    passed: !!(report.structuredFindings && report.structuredFindings.trim().length > 50),
  });
  checks.push({
    field: 'diagnosis',
    label: '内镜诊断',
    passed: !!(report.diagnosis && report.diagnosis.trim().length > 2),
  });
  checks.push({
    field: 'recommendations',
    label: '处理建议',
    passed: !!(report.recommendations && report.recommendations.trim().length > 4),
  });
  checks.push({
    field: 'conclusion',
    label: '复查建议',
    passed: !!(report.conclusion && report.conclusion.trim().length > 2),
  });

  lesions.forEach((l, i) => {
    checks.push({
      field: `lesion_${i}_size`,
      label: `病灶${i + 1}大小`,
      passed: l.sizeMajor > 0,
    });
    checks.push({
      field: `lesion_${i}_morphology`,
      label: `病灶${i + 1}形态`,
      passed: !!l.morphology,
    });
  });

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);
  const missingFields = checks.filter((c) => !c.passed).map((c) => c.label);

  return { score, missingFields };
}
