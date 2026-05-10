import React from 'react';
import {
    BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { useTheme } from '../../hooks/useTheme';

interface GraphChartProps {
    data: any[];
    chartType: string;
    xAxis: string;
    yAxis: string;
    enableAnimation?: boolean;
}


const GraphChart: React.FC<GraphChartProps> = ({ data, chartType, yAxis, enableAnimation = true }) => {
    const { theme } = useTheme();

    if (!data || data.length === 0) {
        return <div className="graph-placeholder">No data to display</div>;
    }

    // Dynamic Colors based on theme
    const isDark = theme === 'dark';
    const chartColors = {
        stroke: isDark ? "#9ca3af" : "#64748b",
        grid: isDark ? "#374151" : "#e2e8f0",
        tooltipBg: isDark ? "#1f2937" : "#ffffff",
        tooltipBorder: isDark ? "#374151" : "#e2e8f0",
        text: isDark ? "#f8fafc" : "#0f172a",
        accent: isDark ? "#3b82f6" : "#2563eb",
        secondary: isDark ? "#10b981" : "#059669"
    };

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
            default:
                return null;
        }
    };

    return (
        <div className="graph-scroll-wrapper">
            <div 
                className="graph-scroll-inner" 
                style={{ 
                    minWidth: '100%', 
                    width: `${dynamicWidth}px`, 
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
