import { motion } from "framer-motion";
import { TrendingUp, MessageSquare, Users, CheckCheck, Calendar } from "lucide-react";
import { useState } from "react";

const dailyVolume = [42, 68, 55, 89, 120, 95, 145, 132, 178, 156, 190, 168, 210, 245];
const hourlyPeak = [12, 8, 5, 4, 6, 15, 42, 78, 105, 125, 118, 132, 110, 95, 88, 102, 115, 128, 118, 95, 68, 45, 32, 18];
const deliveryBreakdown = [
  { label: "Read", value: 68, color: "hsl(152,62%,36%)" },
  { label: "Delivered", value: 22, color: "hsl(196,72%,46%)" },
  { label: "Sent", value: 7, color: "hsl(234,62%,55%)" },
  { label: "Failed", value: 3, color: "hsl(0,72%,51%)" },
];

export default function Analytics() {
  const [range, setRange] = useState("7d");

  const maxVolume = Math.max(...dailyVolume);
  const maxHourly = Math.max(...hourlyPeak);
  const total = deliveryBreakdown.reduce((s, d) => s + d.value, 0);
  let cumulative = 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Analytics & Insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">Deep-dive into your messaging performance</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1">
          {["24h", "7d", "30d", "90d"].map(r => (
            <button key={r} onClick={() => setRange(r)} className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{r}</button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Sent", value: "48,291", change: "+18.3%", icon: MessageSquare },
          { label: "Delivery Rate", value: "97.8%", change: "+0.4%", icon: CheckCheck },
          { label: "Read Rate", value: "68.2%", change: "+2.1%", icon: TrendingUp },
          { label: "New Contacts", value: "1,247", change: "+12.5%", icon: Users },
        ].map((k, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl glass-card stat-card-glow p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <k.icon className="h-4 w-4" />
              <span className="text-[10px] font-medium uppercase tracking-wider">{k.label}</span>
            </div>
            <div className="mt-2 flex items-end gap-2">
              <p className="text-2xl font-bold tabular-nums text-foreground">{k.value}</p>
              <span className="mb-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary tabular-nums">{k.change}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Daily Volume Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="col-span-2 rounded-xl glass-card stat-card-glow p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Message Volume</h2>
              <p className="text-xs text-muted-foreground">Daily sent messages over the last {range}</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />Sent
            </span>
          </div>
          <div className="flex h-56 items-end gap-2">
            {dailyVolume.map((v, i) => (
              <div key={i} className="group relative flex flex-1 flex-col items-center">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(v / maxVolume) * 100}%` }}
                  transition={{ delay: i * 0.04, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                  className="w-full rounded-t-md bg-gradient-to-t from-primary to-emerald-light opacity-80 hover:opacity-100"
                />
                <span className="mt-2 text-[9px] tabular-nums text-muted-foreground">D{i + 1}</span>
                <div className="pointer-events-none absolute -top-8 rounded-md bg-foreground px-2 py-0.5 text-[10px] font-semibold text-background opacity-0 group-hover:opacity-100 transition-opacity">
                  {v}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Delivery Breakdown Donut */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl glass-card stat-card-glow p-6">
          <h2 className="text-sm font-bold text-foreground">Delivery Breakdown</h2>
          <p className="text-xs text-muted-foreground">Message status distribution</p>
          <div className="mt-6 flex flex-col items-center">
            <svg viewBox="0 0 100 100" className="h-40 w-40 -rotate-90">
              {deliveryBreakdown.map((d, i) => {
                const dash = (d.value / total) * 251.2;
                const offset = -cumulative;
                cumulative += dash;
                return (
                  <circle
                    key={i}
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke={d.color}
                    strokeWidth="14"
                    strokeDasharray={`${dash} 251.2`}
                    strokeDashoffset={offset}
                  />
                );
              })}
            </svg>
            <div className="mt-4 grid w-full grid-cols-2 gap-2">
              {deliveryBreakdown.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs text-muted-foreground">{d.label}</span>
                  <span className="ml-auto text-xs font-semibold tabular-nums text-foreground">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Hourly Peak */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl glass-card stat-card-glow p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">Peak Hours</h2>
            <p className="text-xs text-muted-foreground">When your contacts are most active</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="h-3 w-3" />Today</span>
        </div>
        <div className="flex h-40 items-end gap-1">
          {hourlyPeak.map((v, i) => (
            <div key={i} className="group relative flex flex-1 flex-col items-center">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(v / maxHourly) * 100}%` }}
                transition={{ delay: i * 0.02, duration: 0.5 }}
                className="w-full rounded-t bg-gradient-to-t from-indigo/60 to-indigo hover:from-indigo/80 hover:to-indigo"
              />
              <span className="mt-1.5 text-[8px] tabular-nums text-muted-foreground">{i}h</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}