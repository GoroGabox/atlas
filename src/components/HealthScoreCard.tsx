type Props = {
  score:     number;
  grade:     string;
  breakdown: { documentation: number; risk: number; busFactor: number };
  alerts:    string[];
  name:      string;
  compact?:  boolean;
};

const gradeColor: Record<string, string> = {
  A: "text-green-400 bg-green-400/10 border-green-400/20",
  B: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  C: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  D: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  F: "text-red-400 bg-red-400/10 border-red-400/20",
};

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
      <span className="text-[10px] text-gray-500 tabular-nums w-6 text-right">{value}</span>
    </div>
  );
}

export default function HealthScoreCard({
  score, grade, breakdown, alerts, name, compact,
}: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-300 truncate">{name}</p>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-lg font-bold text-white tabular-nums">{score}</span>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${gradeColor[grade]}`}>
            {grade}
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            score >= 85 ? "bg-green-500" :
            score >= 70 ? "bg-blue-500"  :
            score >= 55 ? "bg-yellow-500":
            score >= 40 ? "bg-orange-500": "bg-red-500"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Breakdown */}
      {!compact && (
        <div className="space-y-1.5">
          <div>
            <p className="text-[10px] text-gray-600 mb-0.5">Documentación</p>
            <Bar value={breakdown.documentation} max={40} color="bg-blue-500" />
          </div>
          <div>
            <p className="text-[10px] text-gray-600 mb-0.5">Riesgo</p>
            <Bar value={breakdown.risk} max={30} color="bg-green-500" />
          </div>
          <div>
            <p className="text-[10px] text-gray-600 mb-0.5">Bus factor</p>
            <Bar value={breakdown.busFactor} max={30} color="bg-purple-500" />
          </div>
        </div>
      )}

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="space-y-1">
          {alerts.map((a, i) => (
            <p key={i} className="text-[10px] text-yellow-400 flex items-center gap-1">
              <span>⚠</span>{a}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}