"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type DashboardChartPoint = {
  label: string;
  value: number;
};

const CHART_COLORS = [
  "#2563EB",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#EC4899",
  "#84CC16",
  "#F97316",
  "#6366F1",
];

export default function AdminPastorCharts({
  departmentMembers,
  reportEvolution,
  soulEvolution,
  publicRequestRate,
  appointmentRate,
}: {
  departmentMembers: DashboardChartPoint[];
  reportEvolution: DashboardChartPoint[];
  soulEvolution: DashboardChartPoint[];
  publicRequestRate: number;
  appointmentRate: number;
}) {
  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <RateCard
          label="Demandes publiques traitées"
          value={publicRequestRate}
          description="Prières, intégrations et témoignages clôturés ou traités."
          gradient="from-blue-600 via-indigo-500 to-violet-500"
        />
        <RateCard
          label="Rendez-vous traités"
          value={appointmentRate}
          description="Part des rendez-vous sortis du statut nouveau / en cours."
          gradient="from-emerald-500 via-teal-500 to-cyan-500"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard
          title="Répartition des membres par département"
          description="Tous les membres non archivés, répartis selon leur affectation départementale."
        >
          {departmentMembers.length ? (
            <div className="space-y-1">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart margin={{ top: 36, right: 52, bottom: 10, left: 52 }}>
                  <defs>
                    <filter id="pieShadow" x="-30%" y="-30%" width="160%" height="160%">
                      <feDropShadow dx="0" dy="7" stdDeviation="6" floodOpacity="0.20" />
                    </filter>
                  </defs>

                  <Pie
                    data={departmentMembers}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={96}
                    startAngle={90}
                    endAngle={-270}
                    isAnimationActive={false}
                    legendType="none"
                  >
                    {departmentMembers.map((_, index) => (
                      <Cell
                        key={`depth-${index}`}
                        fill={darken(CHART_COLORS[index % CHART_COLORS.length])}
                        stroke="transparent"
                        transform="translate(0,8)"
                      />
                    ))}
                  </Pie>

                  <Pie
                    data={departmentMembers}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="47%"
                    innerRadius={60}
                    outerRadius={96}
                    paddingAngle={2}
                    cornerRadius={6}
                    stroke="#ffffff"
                    strokeWidth={2}
                    filter="url(#pieShadow)"
                    labelLine={{ stroke: "#94A3B8", strokeWidth: 1 }}
                    label={(props: any) => {
                      const index = departmentMembers.findIndex(
                        (item) => item.label === props.name
                      );
                      const color = CHART_COLORS[
                        Math.max(0, index) % CHART_COLORS.length
                      ];

                      return (
                        <text
                          x={props.x}
                          y={props.y}
                          fill={color}
                          textAnchor={props.textAnchor}
                          dominantBaseline="central"
                          fontSize={10}
                          fontWeight={800}
                        >
                          {`${props.name} ${Math.round((props.percent || 0) * 100)}%`}
                        </text>
                      );
                    }}
                  >
                    {departmentMembers.map((_, index) => (
                      <Cell
                        key={`slice-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value, name) => [`${value} membre(s)`, name]}
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid #DCEAF5",
                      boxShadow: "0 12px 30px rgba(15,23,42,.12)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-2 text-[10px] font-bold leading-4 text-slate-600">
                {departmentMembers.map((item, index) => (
                  <span key={`legend-${item.label}`} className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-[3px]"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <EmptyChart text="Aucune affectation de membre disponible." />
          )}
        </ChartCard>

        <ChartCard
          title="Complétude des rapports de départements"
          description="Pourcentage des départements actifs ayant transmis leur rapport par mois."
        >
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={reportEvolution} barCategoryGap="28%">
              <defs>
                <linearGradient id="reportGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="45%" stopColor="#4F46E5" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
                <filter id="barShadow" x="-20%" y="-20%" width="140%" height="160%">
                  <feDropShadow dx="0" dy="7" stdDeviation="5" floodOpacity="0.22" />
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="4 5" stroke="#DCEAF5" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} unit="%" tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value) => [`${value}%`, "Complétude"]}
                cursor={{ fill: "rgba(37,99,235,.05)" }}
                contentStyle={{
                  borderRadius: 16,
                  border: "1px solid #DCEAF5",
                  boxShadow: "0 12px 30px rgba(15,23,42,.12)",
                }}
              />
              <Bar
                dataKey="value"
                name="Complétude (%)"
                fill="url(#reportGradient)"
                radius={[12, 12, 4, 4]}
                filter="url(#barShadow)"
                maxBarSize={64}
              >
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(value: unknown) => `${Number(value || 0)}%`}
                  fill="#03357A"
                  fontWeight={800}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Évolution des âmes reçues / suivies"
          description="Nouveaux suivis pastoraux créés au cours des six derniers mois."
        >
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={soulEvolution} barCategoryGap="28%">
              <defs>
                <linearGradient id="soulGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="50%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
                <filter id="soulShadow" x="-20%" y="-20%" width="140%" height="160%">
                  <feDropShadow dx="0" dy="7" stdDeviation="5" floodOpacity="0.20" />
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="4 5" stroke="#DCEAF5" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 16,
                  border: "1px solid #DCEAF5",
                  boxShadow: "0 12px 30px rgba(15,23,42,.12)",
                }}
              />
              <Bar
                dataKey="value"
                name="Âmes"
                fill="url(#soulGradient)"
                radius={[12, 12, 4, 4]}
                filter="url(#soulShadow)"
                maxBarSize={64}
              >
                <LabelList
                  dataKey="value"
                  position="top"
                  fill="#065F46"
                  fontWeight={800}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </section>
  );
}

function darken(hex: string) {
  const value = hex.replace("#", "");
  const r = Math.max(0, Math.floor(parseInt(value.slice(0, 2), 16) * 0.68));
  const g = Math.max(0, Math.floor(parseInt(value.slice(2, 4), 16) * 0.68));
  const b = Math.max(0, Math.floor(parseInt(value.slice(4, 6), 16) * 0.68));
  return `rgb(${r}, ${g}, ${b})`;
}

function RateCard({
  label,
  value,
  description,
  gradient,
}: {
  label: string;
  value: number;
  description: string;
  gradient: string;
}) {
  const boundedValue = Math.max(0, Math.min(100, value));

  return (
    <article className="overflow-hidden rounded-3xl border border-[#DCEAF5] bg-white shadow-sm">
      <div className={`bg-gradient-to-r ${gradient} p-5 text-white`}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black text-white/90">{label}</p>
            <p className="mt-2 text-4xl font-black">{boundedValue}%</p>
          </div>
          <div className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-black backdrop-blur">
            {boundedValue >= 80
              ? "Très bon"
              : boundedValue >= 60
                ? "À suivre"
                : "Action requise"}
          </div>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/20 shadow-inner">
          <div
            className="h-full rounded-full bg-white shadow"
            style={{ width: `${boundedValue}%` }}
          />
        </div>
      </div>

      <p className="p-5 text-sm leading-6 text-slate-500">{description}</p>
    </article>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-[#DCEAF5] bg-gradient-to-b from-white to-[#F8FBFD] p-5 shadow-sm">
      <h2 className="text-lg font-black text-[#03357A]">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-5 min-h-[320px]">{children}</div>
    </article>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-[300px] items-center justify-center rounded-2xl bg-[#F8FBFD] px-6 text-center text-sm font-semibold text-slate-500">
      {text}
    </div>
  );
}
