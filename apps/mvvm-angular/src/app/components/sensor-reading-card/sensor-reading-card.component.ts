import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  OnInit,
  Inject,
  InjectionToken,
  Signal,
  DestroyRef,
  inject,
} from '@angular/core';
import { fromLoomSignal } from '../../utils/loom-signals';
import { observe } from '@web-loom/signals-core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { sensorReadingViewModel, SensorReadingListData } from '@repo/view-models/SensorReadingViewModel';
import { Chart } from 'chart.js/auto';

export const SENSOR_READING_VIEW_MODEL = new InjectionToken<typeof sensorReadingViewModel>('SENSOR_READING_VIEW_MODEL');

@Component({
  selector: 'app-sensor-reading-card',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sensor-reading-card.component.html',
  styleUrl: './sensor-reading-card.component.scss',
  providers: [
    {
      provide: SENSOR_READING_VIEW_MODEL,
      useValue: sensorReadingViewModel,
    },
  ],
})
export class SensorReadingCardComponent implements OnInit, AfterViewInit {
  public vm: typeof sensorReadingViewModel;
  public data$!: Signal<SensorReadingListData | null>;
  public loading$!: Signal<boolean>;
  public error$!: Signal<any>;

  @ViewChild('readingsChart') readingsChartRef?: ElementRef<HTMLCanvasElement>;
  private chartInstance?: Chart;

  private destroyRef = inject(DestroyRef);

  constructor(@Inject(SENSOR_READING_VIEW_MODEL) vm: typeof sensorReadingViewModel) {
    this.vm = vm;
  }

  ngOnInit(): void {
    this.data$ = fromLoomSignal(this.vm.data$, this.destroyRef);
    this.loading$ = fromLoomSignal(this.vm.isLoading$, this.destroyRef);
    this.error$ = fromLoomSignal(this.vm.error$, this.destroyRef);

    this.vm.fetchCommand.execute();
  }

  ngAfterViewInit(): void {
    this.destroyRef.onDestroy(
      observe(this.vm.data$, (data) => {
        if (data && data.length > 0 && this.readingsChartRef) {
          this.initChart(data);
        }
      }),
    );
  }

  private initChart(data: SensorReadingListData): void {
    if (!this.readingsChartRef) return;
    const canvas = this.readingsChartRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Failed to get 2D context for chart');
      return;
    }

    if (this.chartInstance) {
      this.chartInstance.destroy(); // Destroy previous chart instance
    }

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map((r) => new Date(r.timestamp).toLocaleTimeString()),
        datasets: [
          {
            label: 'Latest Readings',
            data: data.map((r) => r.value),
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }
}
