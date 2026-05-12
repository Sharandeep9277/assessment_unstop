/**
 * Minimal, structurally-typed proxies for the Chart.js public surface we use.
 *
 * Re-using the real `chart.js` types via `import type` is the ideal approach,
 * but that forces TypeScript to keep the type-only graph reachable from the
 * main bundle's compilation context. To keep the lazy chunk surface clean and
 * to remain decoupled from any specific Chart.js version, we declare just the
 * subset of the API we actually call.
 *
 * If you want full IntelliSense for Chart.js APIs, switch these aliases to
 *   import type { Chart, ChartConfiguration } from 'chart.js';
 */
export interface ChartType {
  data: {
    datasets: Array<{ data: number[]; backgroundColor?: string[] | string }>;
    labels?: string[];
  };
  update(mode?: 'none' | 'show' | 'hide' | 'resize' | 'reset' | 'active' | 'normal'): void;
  destroy(): void;
  resize(): void;
}

export interface ChartConfiguration {
  type: 'pie' | 'doughnut' | 'bar' | 'line';
  data: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor?: string[] | string;
      borderColor?: string[] | string;
      borderWidth?: number;
      hoverOffset?: number;
    }>;
  };
  options?: Record<string, unknown>;
}

export type ChartConstructor = new (
  ctx: HTMLCanvasElement | CanvasRenderingContext2D,
  cfg: ChartConfiguration,
) => ChartType;
