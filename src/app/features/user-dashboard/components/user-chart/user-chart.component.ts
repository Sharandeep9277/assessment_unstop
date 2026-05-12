import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import { RoleDistribution } from '../../../../core/models/user.model';
import { ChartLoaderService } from '../../../../core/services/chart-loader.service';
import type { ChartType } from '../../../../core/types/chart.types';

/**
 * Renders the pie chart of user role distribution.
 *
 * Chart.js itself is fetched at runtime by `ChartLoaderService.load()`, so the
 * (~70KB) library lives in its own webpack chunk and is downloaded only when
 * this component mounts. While the chunk is loading, a small spinner is shown
 * inside the chart card to provide visible feedback.
 *
 * The chart instance is reused across updates: whenever `distribution` changes
 * we mutate the dataset's `data` array in place and call `chart.update()` —
 * this is dramatically smoother than tearing down and re-creating the chart
 * for every user added.
 */
@Component({
  selector: 'app-user-chart',
  templateUrl: './user-chart.component.html',
  styleUrl: './user-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() distribution: RoleDistribution = { Admin: 0, Editor: 0, Viewer: 0 };

  @ViewChild('chartCanvas', { static: false })
  private chartCanvas?: ElementRef<HTMLCanvasElement>;

  isLoading = true;
  hasError = false;
  total = 0;

  private chart?: ChartType;

  private static readonly LABELS = ['Admin', 'Editor', 'Viewer'];
  private static readonly COLORS = ['#1c4980', '#2e7d32', '#ed6c02'];

  constructor(
    private readonly chartLoader: ChartLoaderService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    this.initChart().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Failed to load Chart.js', err);
      this.hasError = true;
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['distribution']) {
      this.total =
        this.distribution.Admin + this.distribution.Editor + this.distribution.Viewer;
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = undefined;
  }

  private async initChart(): Promise<void> {
    const ChartCtor = await this.chartLoader.load();

    // Defensive: the view might have been torn down between awaits.
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;

    this.chart = new ChartCtor(canvas, {
      type: 'pie',
      data: {
        labels: UserChartComponent.LABELS,
        datasets: [
          {
            data: [
              this.distribution.Admin,
              this.distribution.Editor,
              this.distribution.Viewer,
            ],
            backgroundColor: UserChartComponent.COLORS,
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600, easing: 'easeOutQuart' },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              padding: 14,
              color: '#383838',
              font: {
                family: "'Inter', system-ui, sans-serif",
                size: 13,
                weight: '500',
              },
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          tooltip: {
            backgroundColor: '#383838',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 10,
            cornerRadius: 6,
            titleFont: { weight: '600' },
            callbacks: {
              label: (ctx: {
                label?: string;
                parsed?: number;
                dataset?: { data: number[] };
              }) => {
                const value = ctx.parsed ?? 0;
                const sum =
                  ctx.dataset?.data?.reduce((a: number, b: number) => a + b, 0) ?? 0;
                const pct = sum === 0 ? 0 : Math.round((value / sum) * 100);
                return ` ${ctx.label ?? ''}: ${value} (${pct}%)`;
              },
            },
          },
        },
      },
    });

    this.isLoading = false;
    this.cdr.markForCheck();
  }

  private updateChart(): void {
    if (!this.chart) return;
    const dataset = this.chart.data.datasets[0];
    dataset.data = [
      this.distribution.Admin,
      this.distribution.Editor,
      this.distribution.Viewer,
    ];
    this.chart.update();
  }
}
