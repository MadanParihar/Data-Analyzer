import React from 'react';
import {
    BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
    PieChart, Pie, Cell
} from 'recharts';
import { useTheme } from '../../hooks/useTheme';

interface GraphChartProps {
    data: any[];
    chartType: string;
    xAxis: string;
    yAxis: string;
    enableAnimation?: boolean;
    chartRef?: React.RefObject<HTMLDivElement | null>;
}


const GraphChart: React.FC<GraphChartProps> = ({ data, chartType, yAxis, enableAnimation = true, chartRef }) => {
    const { theme } = useTheme();

    if (!data || data.length === 0) {
        return <div className="graph-placeholder">No data to display</div>;
    }

    // Dynamic Colors based on theme (Electric Violet / zinc neutrals)
    const isDark = theme === 'dark';
    const chartColors = {
        stroke: isDark ? "#a1a1aa" : "#71717a",
        grid: isDark ? "#27272a" : "#e4e4e7",
        tooltipBg: isDark ? "#18181b" : "#ffffff",
        tooltipBorder: isDark ? "#3f3f46" : "#e4e4e7",
        text: isDark ? "#fafafa" : "#18181b",
        accent: isDark ? "#8b7cff" : "#6d5efc",
        secondary: isDark ? "#34d399" : "#059669"
    };

    // Pie slice palette — violet accent first, then complementary hues
    const pieColors = isDark
        ? ["#8b7cff", "#34d399", "#fbbf24", "#22d3ee", "#fb7185", "#a78bfa", "#4ade80", "#f97316"]
        : ["#6d5efc", "#059669", "#d97706", "#0891b2", "#e11d48", "#7c3aed", "#16a34a", "#ea580c"];

    const isPie = chartType === 'pie';
    const stripKey = (val: any) => (typeof val === 'string' ? val.split('__')[0] : val);

    const CommonProps = {
        data: data,
        margin: { top: 20, right: 30, left: 20, bottom: 50 },
    };

    const XAxisProps = {
        dataKey: "_uniqueKey",
        tickFormatter: (val: string) => val.split('__')[0],
        angle: -45,
        height: 120,
        stroke: chartColors.stroke,
        style: { fontSize: '12px', fill: chartColors.stroke }
    };

    const YAxisProps = {
        stroke: chartColors.stroke,
        style: { fontSize: '12px', fill: chartColors.stroke }
    };

    // Calculate dynamic width based on data length to prevent compression
    const PIXELS_PER_POINT = 60;
    const dynamicWidth = Math.max(data.length * PIXELS_PER_POINT, 500);

    const renderChartContent = () => {
        switch (chartType) {
            case 'bar':
                return (
                    <BarChart {...CommonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                        <XAxis {...XAxisProps} textAnchor="end" />
                        <YAxis {...YAxisProps} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: chartColors.tooltipBg,
                                borderRadius: '8px',
                                border: `1px solid ${chartColors.tooltipBorder}`,
                                color: chartColors.text
                            }}
                            itemStyle={{ color: chartColors.text }}
                            labelFormatter={(label) => label.split('__')[0]}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar
                            dataKey={yAxis}
                            fill={chartColors.accent}
                            radius={[4, 4, 0, 0]}
                            isAnimationActive={enableAnimation}
                        />
                    </BarChart>
                );
            case 'line':
                return (
                    <LineChart {...CommonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                        <XAxis {...XAxisProps} textAnchor="end" />
                        <YAxis {...YAxisProps} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: chartColors.tooltipBg,
                                borderRadius: '8px',
                                border: `1px solid ${chartColors.tooltipBorder}`,
                                color: chartColors.text
                            }}
                            itemStyle={{ color: chartColors.text }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line
                            type="monotone"
                            dataKey={yAxis}
                            stroke={chartColors.accent}
                            strokeWidth={3}
                            dot={{ fill: chartColors.accent, r: 4 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            isAnimationActive={enableAnimation}
                        />
                    </LineChart>
                );
            case 'area':
                return (
                    <AreaChart {...CommonProps}>
                        <defs>
                            <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartColors.accent} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={chartColors.accent} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                        <XAxis {...XAxisProps} textAnchor="end" />
                        <YAxis {...YAxisProps} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: chartColors.tooltipBg,
                                borderRadius: '8px',
                                border: `1px solid ${chartColors.tooltipBorder}`,
                                color: chartColors.text
                            }}
                            itemStyle={{ color: chartColors.text }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Area
                            type="monotone"
                            dataKey={yAxis}
                            stroke={chartColors.accent}
                            fillOpacity={1}
                            fill="url(#colorArea)"
                            strokeWidth={3}
                            isAnimationActive={enableAnimation}
                        />
                    </AreaChart>
                );
            case 'pie': {
                // Aggregate rows by category label (sum values) so each unique
                // category is a single slice instead of one slice per row.
                const totals = new Map<string, number>();
                data.forEach((d) => {
                    const name = stripKey(d._uniqueKey ?? d[yAxis]);
                    const val = Number(d[yAxis]) || 0;
                    totals.set(name, (totals.get(name) ?? 0) + val);
                });

                let slices = Array.from(totals, ([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value);

                // Keep the largest slices readable; roll the rest into "Other".
                const MAX_SLICES = 8;
                if (slices.length > MAX_SLICES) {
                    const top = slices.slice(0, MAX_SLICES);
                    const other = slices.slice(MAX_SLICES).reduce((s, e) => s + e.value, 0);
                    if (other > 0) top.push({ name: 'Other', value: other });
                    slices = top;
                }

                return (
                    <PieChart>
                        <Pie
                            data={slices}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius="70%"
                            isAnimationActive={enableAnimation}
                            label={({ percent }) => ((percent ?? 0) >= 0.03 ? `${((percent ?? 0) * 100).toFixed(0)}%` : '')}
                            labelLine={false}
                        >
                            {slices.map((s, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={s.name === 'Other' ? chartColors.stroke : pieColors[index % pieColors.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: chartColors.tooltipBg,
                                borderRadius: '8px',
                                border: `1px solid ${chartColors.tooltipBorder}`,
                                color: chartColors.text
                            }}
                            itemStyle={{ color: chartColors.text }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
                    </PieChart>
                );
            }
            default:
                return null;
        }
    };

    return (
        <div className="graph-scroll-wrapper" ref={chartRef}>
            <div
                className="graph-scroll-inner"
                style={{
                    minWidth: '100%',
                    width: isPie ? '100%' : `${dynamicWidth}px`,
                    height: '100%'
                }}
            >
                <ResponsiveContainer width="100%" height="100%">
                    {renderChartContent() as React.ReactElement}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default GraphChart;
