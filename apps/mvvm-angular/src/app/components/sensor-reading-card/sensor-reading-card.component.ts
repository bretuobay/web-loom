import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { sensorReadingViewModel, SensorReadingListData } from '@repo/view-models/SensorReadingViewModel';
import { Observable } from 'rxjs';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-sensor-reading-card',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sensor-reading-card.component.html',
  styleUrl: './sensor-reading-card.component.scss',
})
export class SensorReadingCardComponent implements AfterViewInit {
  public vm = sensorReadingViewModel;
  public data$: Observable<SensorReadingListData | null>;
  public loading$: Observable<boolean>;
  public error$: Observable<any>;

  @ViewChild('readingsChart') readingsChartRef?: ElementRef<HTMLCanvasElement>;
  private chartInstance?: Chart;

  constructor() {
    this.data$ = this.vm.data$;
    this.loading$ = this.vm.isLoading$;
    this.error$ = this.vm.error$;

    this.vm.fetchCommand.execute();
  }

  ngAfterViewInit(): void {
    this.data$.subscribe((data) => {
      if (data && data.length > 0 && this.readingsChartRef) {
        this.initChart(data);
      }
    });
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
