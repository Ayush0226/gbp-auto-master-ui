export function metricTotal(data: any, metricName: string): number {
    const groups = Array.isArray(data?.multiDailyMetricTimeSeries) ? data.multiDailyMetricTimeSeries : [];
    return groups.flatMap((group: any) => group.dailyMetricTimeSeries || [])
        .filter((series: any) => series.dailyMetric === metricName)
        .flatMap((series: any) => series.timeSeries?.datedValues || [])
        .reduce((total: number, entry: any) => {
            const value = Number(entry.value ?? 0);
            return total + (Number.isFinite(value) ? value : 0);
        }, 0);
}
