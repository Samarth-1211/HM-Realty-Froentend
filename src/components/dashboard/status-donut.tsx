import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatEnumLabel } from '@/lib/utils'

const STATUS_HEX: Record<string, string> = {
  NEW: '#0ea5e9',
  ASSIGNED: '#f59e0b',
  IN_PROGRESS: '#8b5cf6',
  CONVERTED: '#10b981',
  LOST: '#f43f5e',
}

export function StatusDonut({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).filter(([, v]) => v > 0)
  const total = entries.reduce((sum, [, v]) => sum + v, 0)

  if (total === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-slate-400">
        No lead data yet
      </div>
    )
  }

  const chartData = entries.map(([status, value]) => ({ name: formatEnumLabel(status), value, status }))

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              strokeWidth={0}
            >
              {chartData.map((entry) => (
                <Cell key={entry.status} fill={STATUS_HEX[entry.status] ?? '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-900">{total}</span>
          <span className="text-[11px] text-slate-400">total</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {chartData.map((entry) => (
          <div key={entry.status} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: STATUS_HEX[entry.status] ?? '#94a3b8' }}
              />
              <span className="text-slate-600">{entry.name}</span>
            </div>
            <span className="font-semibold text-slate-800">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
