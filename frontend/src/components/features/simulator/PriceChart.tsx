// src/components/simulator/PriceChart.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity } from "lucide-react";
import { getMarketData, MarketCandle } from "../../../api/marketData";

export interface PriceChartProps {
  // Aquí esperamos el símbolo tal cual está en assets.symbol (AAPL, TSLA, BTC/USD...)
  assetName: string;
  assetType: string;
  // Fechas de la simulación en formato "YYYY-MM-DD" (opcionales)
  simulationStart?: string;
  simulationEnd?: string;
}

interface PricePoint {
  date: string;
  originalDate?: string | number;
  price: number;
}

type TimeRange =
  | "1m"
  | "3m"
  | "6m"
  | "1y"
  | "3y"
  | "5y"
  | "10y"
  | "max";

function toDateString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function computeRange(
  range: TimeRange,
  _simulationStart?: string,
  _simulationEnd?: string
): { start: string; end: string } {
  const endDate = new Date();
  const startDate = new Date(endDate);

  // "max" -> pedimos todo el histórico posible.
  if (range === "max") {
    return { start: "1900-01-01", end: toDateString(endDate) };
  }

  switch (range) {
    case "1m":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "3m":
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case "6m":
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case "1y":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case "3y":
      startDate.setFullYear(startDate.getFullYear() - 3);
      break;
    case "5y":
      startDate.setFullYear(startDate.getFullYear() - 5);
      break;
    case "10y":
      startDate.setFullYear(startDate.getFullYear() - 10);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 3);
      break;
  }

  return {
    start: toDateString(startDate),
    end: toDateString(endDate),
  };
}

// === Downsample para que el gráfico no tenga 10k puntos ===
function getMaxPointsForRange(range: TimeRange): number {
  switch (range) {
    case "1m":
    case "3m":
      return 400;
    case "6m":
    case "1y":
      return 600;
    case "3y":
      return 800;
    case "5y":
      return 1000;
    case "10y":
    case "max":
      return 1200;
    default:
      return 800;
  }
}

function downsample(points: PricePoint[], maxPoints: number): PricePoint[] {
  if (points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  const result: PricePoint[] = [];
  for (let i = 0; i < points.length; i += step) {
    result.push(points[i]);
  }
  // Nos aseguramos de incluir siempre el último punto
  if (result[result.length - 1] !== points[points.length - 1]) {
    result.push(points[points.length - 1]);
  }
  return result;
}

// === Generador sintético de backup ===
function generateSyntheticPriceData(
  startDateStr: string,
  endDateStr: string,
  assetType: string
): PricePoint[] {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.max(2, Math.round(diffMs / (1000 * 60 * 60 * 24)));

  const data: PricePoint[] = [];
  let basePrice = 100 + Math.random() * 400;
  const volatility = assetType === "crypto" ? 0.03 : 0.015;

  for (let i = 0; i <= diffDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    const change = (Math.random() - 0.5) * volatility * basePrice;
    basePrice += change;

    data.push({
      date: d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      price: parseFloat(basePrice.toFixed(2)),
    });
  }

  return data;
}

export default function PriceChart({
  assetName,
  assetType,
}: PriceChartProps) {
  // Por defecto: 3 meses
  const [timeRange, setTimeRange] = useState<TimeRange>("3m");
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { startDate, endDate } = useMemo(() => {
    const { start, end } = computeRange(timeRange);
    return { startDate: start, endDate: end };
  }, [timeRange]);

  useEffect(() => {
    if (!assetName) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const candles: MarketCandle[] = await getMarketData({
          asset: assetName,
          start_date: startDate,
          end_date: endDate,
        });

        let data: PricePoint[];

        const showYear =
          timeRange === "3y" ||
          timeRange === "5y" ||
          timeRange === "10y" ||
          timeRange === "max";

        const dateFormatOptions: Intl.DateTimeFormatOptions = showYear
          ? { month: "short", year: "2-digit" }
          : { month: "short", day: "numeric" };

        if (!candles.length) {
          data = generateSyntheticPriceData(startDate, endDate, assetType);
        } else {
          data = candles.map((c) => {
            const d = new Date(c.ts);
            return {
              date: d.toLocaleDateString("en-US", dateFormatOptions),
              originalDate: c.ts, // Store original timestamp for tooltip formatting
              price: c.close,
            };
          });
        }

        if (!data.length) {
          setPriceData([]);
          setCurrentPrice(0);
          setPriceChange(0);
          return;
        }

        const firstPrice = data[0].price;
        const lastPrice = data[data.length - 1].price;
        setCurrentPrice(lastPrice);
        const changePct = ((lastPrice - firstPrice) / firstPrice) * 100;
        setPriceChange(changePct);

        const maxPoints = getMaxPointsForRange(timeRange);
        const decimated = downsample(data, maxPoints);
        setPriceData(decimated);
      } catch (e) {
        console.error(e);
        setError("Failed to load market data");
        setPriceData([]);
        setCurrentPrice(0);
        setPriceChange(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assetName, assetType, startDate, endDate, timeRange]);

  if (!assetName) return null;

  const isPositive = priceChange >= 0;

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: any[];
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card rounded-lg p-3 border border-border bg-popover">
          <p className="text-muted-foreground text-xs mb-1">
            {payload[0].payload.originalDate
              ? new Date(payload[0].payload.originalDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
              : payload[0].payload.date}
          </p>
          <p className="text-foreground font-semibold text-base">
            ${payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  const rangeLabels: Record<TimeRange, string> = {
    "1m": "1M",
    "3m": "3M",
    "6m": "6M",
    "1y": "1Y",
    "3y": "3Y",
    "5y": "5Y",
    "10y": "10Y",
    max: "All",
  };

  return (
    <Card className="glass-card border-border bg-card">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2 text-base font-semibold">
            <Activity className="w-4 h-4 text-primary" strokeWidth={2} />
            Price Chart
          </CardTitle>

          <div className="flex flex-wrap gap-1">
            {(Object.keys(rangeLabels) as TimeRange[]).map((r) => {
              const active = timeRange === r;
              return (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/20 text-muted-foreground border-border hover:border-primary/60"
                    }`}
                >
                  {rangeLabels[r]}
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-1">
            {assetName} • {startDate} → {endDate}
          </p>

          {loading ? (
            <p className="text-xs text-muted-foreground">Loading market data...</p>
          ) : error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : (
            <div className="flex items-baseline gap-3">
              <p className="text-3xl font-bold text-foreground">
                ${currentPrice.toFixed(2)}
              </p>
              <p
                className={`text-sm font-semibold ${isPositive ? "text-green-500" : "text-red-500"
                  }`}
              >
                {isPositive ? "+" : ""}
                {priceChange.toFixed(2)}%
              </p>
            </div>
          )}
        </div>

        {/* Aquí el truco: sacamos solo el gráfico hacia los lados */}
        <div className="-ml-6 -mr-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart
              data={priceData}
              margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isPositive ? "#10b981" : "#ef4444"}
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="95%"
                    stopColor={isPositive ? "#10b981" : "#ef4444"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickLine={false}
                minTickGap={16}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickFormatter={(value) => `$${(value as number).toFixed(0)}`}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? "#10b981" : "#ef4444"}
                strokeWidth={2}
                fill="url(#priceGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
