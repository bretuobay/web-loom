import { Component, OnInit, Inject, InjectionToken, Signal, DestroyRef, inject } from '@angular/core';
import { fromLoomSignal } from '../../utils/loom-signals';
import { CommonModule } from '@angular/common'; // Includes NgFor, NgClass, DatePipe
import { thresholdAlertViewModel, ThresholdAlertListData } from '@repo/view-models/ThresholdAlertViewModel'; // Changed import
import { RouterLink } from '@angular/router';
import { BackIconComponent } from '../back-icon/back-icon.component';

export const THRESHOLD_ALERT_VIEW_MODEL = new InjectionToken<typeof thresholdAlertViewModel>(
  'THRESHOLD_ALERT_VIEW_MODEL',
);

@Component({
  selector: 'app-threshold-alert-list',
  standalone: true,
  imports: [CommonModule, BackIconComponent, RouterLink],
  templateUrl: './threshold-alert-list.component.html',
  styleUrl: './threshold-alert-list.component.scss',
  providers: [
    {
      provide: THRESHOLD_ALERT_VIEW_MODEL,
      useValue: thresholdAlertViewModel,
    },
  ],
})
export class ThresholdAlertListComponent implements OnInit {
  public vm: typeof thresholdAlertViewModel; // Changed VM instance
  public data$!: Signal<ThresholdAlertListData | null>; // Changed data type
  public loading$!: Signal<boolean>;
  public error$!: Signal<any>;

  private destroyRef = inject(DestroyRef);

  constructor(@Inject(THRESHOLD_ALERT_VIEW_MODEL) vm: typeof thresholdAlertViewModel) {
    this.vm = vm;
  }

  ngOnInit(): void {
    // Initialize observables and execute commands in ngOnInit
    this.data$ = fromLoomSignal(this.vm.data$, this.destroyRef);
    this.loading$ = fromLoomSignal(this.vm.isLoading$, this.destroyRef);
    this.error$ = fromLoomSignal(this.vm.error$, this.destroyRef);

    this.vm.fetchCommand.execute();
  }

  getSeverityClass(severity: string | undefined): string {
    if (!severity) return '';
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'severity-critical';
      case 'high':
        return 'severity-high';
      case 'medium':
        return 'severity-medium'; // Assuming 'medium' is a possible severity
      case 'low':
        return 'severity-low';
      default:
        return '';
    }
  }
}
