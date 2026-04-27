import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  Chart, ChartConfiguration,
  LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Legend, Filler,
} from 'chart.js';
import { SalesService, PredictionResponse, ProductsResponse } from '../services/sales.service';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('salesChart', { static: false }) chartRef!: ElementRef<HTMLCanvasElement>;

  products: string[] = [];
  selectedProduct = '';
  forecastMonths = 3;
  data: PredictionResponse | null = null;
  loading = false;
  error = '';
  skeletonBars = [1,2,3,4,5,6,7,8];

  private chart: Chart | null = null;
  private destroy$ = new Subject<void>();

  constructor(private salesService: SalesService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.salesService.getProducts().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: ProductsResponse) => {
        this.products = res.products;
        this.selectedProduct = res.products[0] ?? '';
        this.cdr.markForCheck();
        if (this.selectedProduct) this.loadData();
      },
      error: (err: Error) => { this.error = err.message; this.cdr.markForCheck(); },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(); this.destroy$.complete(); this.chart?.destroy();
  }

  loadData(): void {
    if (!this.selectedProduct) return;
    this.loading = true; this.error = ''; this.cdr.markForCheck();
    this.salesService.getPrediction(this.selectedProduct, this.forecastMonths)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => {
          this.data = res; this.loading = false; this.cdr.markForCheck();
          setTimeout(() => this.renderChart(res), 0);
        },
        error: (err: Error) => { this.error = err.message; this.loading = false; this.cdr.markForCheck(); },
      });
  }

  onProductChange(product: string): void { this.selectedProduct = product; this.loadData(); }
  onMonthsChange(months: number): void   { this.forecastMonths = months; this.loadData(); }

  get rSquaredPct(): string    { return this.data ? (this.data.model_stats.r_squared * 100).toFixed(1) + '%' : '—'; }
  get totalHistoricalQty(): number { return this.data?.historical.reduce((s,p) => s+p.quantity, 0) ?? 0; }
  get forecastedTotal(): number    { return Math.round(this.data?.forecast.reduce((s,p) => s+p.predicted_qty, 0) ?? 0); }
  get lastActualQty(): number      { const h = this.data?.historical; return h ? h[h.length-1].quantity : 0; }

  private renderChart(res: PredictionResponse): void {
    if (!this.chartRef) return;
    this.chart?.destroy();
    const histLabels   = res.historical.map(p => p.date);
    const forecastLbls = res.forecast.map(p => p.date);
    const allLabels    = [...histLabels, ...forecastLbls];
    const actualFull   = [...res.historical.map(p => p.quantity), ...new Array(forecastLbls.length).fill(null)];
    const fittedFull   = [...res.historical.map(p => p.fitted),   ...new Array(forecastLbls.length).fill(null)];
    const forecastLine = [
      ...new Array(histLabels.length - 1).fill(null),
      res.historical[res.historical.length - 1].fitted,
      ...res.forecast.map(p => p.predicted_qty),
    ];
    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: allLabels,
        datasets: [
          { label: 'Actual Sales', data: actualFull as number[], borderColor: '#6EE7B7',
            backgroundColor: 'rgba(110,231,183,0.1)', borderWidth: 2.5,
            pointRadius: 4, pointHoverRadius: 6, fill: true, tension: 0.35 },
          { label: 'Trend (Fitted)', data: fittedFull as number[], borderColor: '#93C5FD',
            borderWidth: 2, borderDash: [6,4], pointRadius: 0, fill: false, tension: 0.35 },
          { label: 'Forecast', data: forecastLine as number[], borderColor: '#F472B6',
            backgroundColor: 'rgba(244,114,182,0.08)', borderWidth: 2.5,
            pointRadius: 5, pointHoverRadius: 7, fill: false, tension: 0.35 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: '#CBD5E1', font: { family: 'IBM Plex Mono', size: 11 } } },
          tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', titleColor: '#F8FAFC',
            bodyColor: '#94A3B8', borderColor: '#334155', borderWidth: 1, padding: 12 },
        },
        scales: {
          x: { ticks: { color: '#64748B', font: { family: 'IBM Plex Mono', size: 10 } },
               grid: { color: 'rgba(100,116,139,0.12)' } },
          y: { ticks: { color: '#64748B', font: { family: 'IBM Plex Mono', size: 10 } },
               grid: { color: 'rgba(100,116,139,0.12)' } },
        },
      },
    };
    this.chart = new Chart(this.chartRef.nativeElement, config);
  }
}
