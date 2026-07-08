import { Component, AfterViewInit, ElementRef, ViewChild, OnInit, Inject, InjectionToken, Signal, DestroyRef, inject } from '@angular/core';
import { fromLoomSignal } from '../../utils/loom-signals';
import { observe } from '@web-loom/signals-core';
import { CommonModule } from '@angular/common'; // Includes NgFor, DatePipe, NgIf, AsyncPipe
import { sensorReadingViewModel, SensorReadingListData } from '@repo/view-models/SensorReadingViewModel';
import { Chart } from 'chart.js/auto';
import { RouterLink } from '@angular/router';
import { BackIconComponent } from '../back-icon/back-icon.component';

export const SENSOR_READING_VIEW_MODEL = new InjectionToken<typeof sensorReadingViewModel>('SENSOR_READING_VIEW_MODEL');

@Component({
  selector: 'app-sensor-reading-list',
  standalone: true,
  imports: [CommonModule, BackIconComponent, RouterLink],
  templateUrl: './sensor-reading-list.component.html',
  styleUrl: './sensor-reading-list.component.scss',
  providers: [
    {
      provide: SENSOR_READING_VIEW_MODEL,
      useValue: sensorReadingViewModel,
    },
  ],
})
export class SensorReadingListComponent implements OnInit, AfterViewInit {
  public vm: typeof sensorReadingViewModel;
  public data$!: Signal<SensorReadingListData | null>;
  public loading$!: Signal<boolean>;
  public error$!: Signal<any>;

  @ViewChild('readingsListChart')
  readingsListChartRef?: ElementRef<HTMLCanvasElement>;
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
      if (data && data.length > 0 && this.readingsListChartRef) {
        this.initChart(data);
      }
      }),
    );
  }

  private initChart(data: SensorReadingListData): void {
    if (!this.readingsListChartRef) return;
    const canvas = this.readingsListChartRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Failed to get 2D context for list chart');
      return;
    }

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    // Example: Display all reading values for a specific sensor type (e.g., Temperature)
    // This is a simplified example; you might want to filter or aggregate data
    // const temperatureReadings = data.filter((r) => r.type === 'Temperature');
    const temperatureReadings = data;

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: temperatureReadings.map((r) => new Date(r.timestamp).toLocaleTimeString()),
        datasets: [
          {
            label: 'Temperature Readings',
            data: temperatureReadings.map((r) => r.value),
            borderColor: 'rgba(255, 99, 132, 1)',
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // Allow chart to fill container
        scales: {
          x: { title: { display: true, text: 'Time' } },
          y: { title: { display: true, text: 'Value' } },
        },
      },
    });
  }
}
