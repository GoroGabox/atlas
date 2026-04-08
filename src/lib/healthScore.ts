export type ModuleScore = {
  moduleId:   string;
  moduleName: string;
  score:      number;   // 0-100
  grade:      "A" | "B" | "C" | "D" | "F";
  breakdown: {
    documentation: number;  // 0-40
    risk:          number;  // 0-30
    busFactor:     number;  // 0-30
  };
  alerts: string[];
};

type Feature = {
  documentationStatus: string;
  riskLevel:           string;
  busFactor:           number;
};

type Module = {
  id:                  string;
  name:                string;
  documentationStatus: string;
  riskLevel:           string;
  features:            Feature[];
};

function gradeFromScore(score: number): ModuleScore["grade"] {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function calcModuleScore(mod: Module): ModuleScore {
  const alerts: string[] = [];
  const features = mod.features;

  // ── Documentación (0-40) ──────────────────────────────
  const docWeights = { complete: 1, partial: 0.5, none: 0 };

  const modDocScore =
    docWeights[mod.documentationStatus as keyof typeof docWeights] ?? 0;

  const featDocAvg = features.length
    ? features.reduce((acc, f) => acc + (docWeights[f.documentationStatus as keyof typeof docWeights] ?? 0), 0) / features.length
    : 0;

  const documentationScore = Math.round((modDocScore * 0.3 + featDocAvg * 0.7) * 40);

  if (documentationScore < 20) alerts.push("Documentación insuficiente");

  // ── Riesgo (0-30) ────────────────────────────────────
  const riskWeights = { low: 1, medium: 0.5, high: 0 };

  const modRiskScore =
    riskWeights[mod.riskLevel as keyof typeof riskWeights] ?? 0.5;

  const featRiskAvg = features.length
    ? features.reduce((acc, f) => acc + (riskWeights[f.riskLevel as keyof typeof riskWeights] ?? 0.5), 0) / features.length
    : modRiskScore;

  const riskScore = Math.round((modRiskScore * 0.3 + featRiskAvg * 0.7) * 30);

  const highRiskCount = features.filter((f) => f.riskLevel === "high").length;
  if (highRiskCount > 0) alerts.push(`${highRiskCount} feature${highRiskCount > 1 ? "s" : ""} con riesgo alto`);

  // ── Bus factor (0-30) ─────────────────────────────────
  const avgBus = features.length
    ? features.reduce((acc, f) => acc + f.busFactor, 0) / features.length
    : 1;

  const busScore = Math.round(Math.min(avgBus / 3, 1) * 30);

  const criticalBus = features.filter((f) => f.busFactor <= 1).length;
  if (criticalBus > 0) alerts.push(`${criticalBus} feature${criticalBus > 1 ? "s" : ""} con bus factor crítico`);

  const score = documentationScore + riskScore + busScore;

  return {
    moduleId:   mod.id,
    moduleName: mod.name,
    score,
    grade: gradeFromScore(score),
    breakdown: {
      documentation: documentationScore,
      risk:          riskScore,
      busFactor:     busScore,
    },
    alerts,
  };
}

export function calcGlobalScore(scores: ModuleScore[]) {
  if (!scores.length) return 0;
  return Math.round(scores.reduce((acc, s) => acc + s.score, 0) / scores.length);
}