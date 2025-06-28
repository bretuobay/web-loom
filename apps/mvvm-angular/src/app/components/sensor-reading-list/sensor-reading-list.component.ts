import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common'; // Includes NgFor, DatePipe, NgIf, AsyncPipe
import { sensorReadingViewModel, SensorReadingListData } from '@repo/view-models/SensorReadingViewModel';
import { Observable } from 'rxjs';
import { Chart } from 'chart.js/auto';
import { RouterLink } from '@angular/router';
import { BackIconComponent } from '../back-icon/back-icon.component';

@Component({
  selector: 'app-sensor-reading-list',
  standalone: true,
  imports: [CommonModule, BackIconComponent, RouterLink],
  templateUrl: './sensor-reading-list.component.html',
  styleUrl: './sensor-reading-list.component.scss',
})
export class SensorReadingListComponent implements AfterViewInit {
  public vm = sensorReadingViewModel;
  public data$: Observable<SensorReadingListData | null>;
  public loading$: Observable<boolean>;
  public error$: Observable<any>;

  @ViewChild('readingsListChart')
  readingsListChartRef?: ElementRef<HTMLCanvasElement>;
  private chartInstance?: Chart;

  constructor() {
    this.data$ = this.vm.data$;
    this.loading$ = this.vm.isLoading$;
    this.error$ = this.vm.error$;

    this.vm.fetchCommand.execute();
  }

  ngAfterViewInit(): void {
    this.data$.subscribe((data) => {
      if (data && data.length > 0 && this.readingsListChartRef) {
        this.initChart(data);
      }
    });
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
