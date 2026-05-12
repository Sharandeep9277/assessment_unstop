import { Injectable } from '@angular/core';

import type { ChartType, ChartConstructor } from '../types/chart.types';

/**
 * Loads Chart.js as a separate webpack chunk on demand.
 *
 * The dynamic `import('chart.js/auto')` ensures the (~70KB minified) library is
 * NOT part of the initial main bundle — it is fetched only when the dashboard
 * mounts and asks for it. The loader caches the resolved promise so subsequent
 * callers reuse the same Chart constructor reference.
 */
@Injectable({ providedIn: 'root' })
export class ChartLoaderService {
  private chartCtor?: Promise<ChartConstructor>;

  /**
   * Returns the Chart.js constructor.
   *
   * On the first call, dynamically imports `chart.js/auto` (which auto-registers
   * all the controllers, scales, elements, etc. needed for the pie chart).
   * Subsequent calls return the cached promise immediately.
   */
  load(): Promise<ChartConstructor> {
    if (!this.chartCtor) {
      this.chartCtor = import('chart.js/auto').then(
        (mod) => mod.default as unknown as ChartConstructor,
      );
    }
    return this.chartCtor;
  }
}

export type { ChartType };
