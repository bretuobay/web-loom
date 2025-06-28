import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Includes NgFor, NgClass, DatePipe
import { thresholdAlertViewModel, ThresholdAlertListData } from '@repo/view-models/ThresholdAlertViewModel';
import { Observable } from 'rxjs';
import { RouterLink } from '@angular/router';
import { BackIconComponent } from '../back-icon/back-icon.component';

@Component({
  selector: 'app-threshold-alert-list',
  standalone: true,
  imports: [CommonModule, BackIconComponent, RouterLink],
  templateUrl: './threshold-alert-list.component.html',
  styleUrl: './threshold-alert-list.component.scss',
})
export class ThresholdAlertListComponent {
  public vm = thresholdAlertViewModel;
  public data$: Observable<ThresholdAlertListData | null>;
  public loading$: Observable<boolean>;
  public error$: Observable<any>;

  constructor() {
    this.data$ = this.vm.data$;
    this.loading$ = this.vm.isLoading$;
    this.error$ = this.vm.error$;

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
