import { Component, OnInit, Inject, InjectionToken } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { thresholdAlertViewModel, ThresholdAlertListData } from '@repo/view-models/ThresholdAlertViewModel';
import { Observable } from 'rxjs';

export const THRESHOLD_ALERT_VIEW_MODEL = new InjectionToken<typeof thresholdAlertViewModel>(
  'THRESHOLD_ALERT_VIEW_MODEL',
);

@Component({
  selector: 'app-threshold-alert-card',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './threshold-alert-card.component.html',
  styleUrl: './threshold-alert-card.component.scss',
  providers: [
    {
      provide: THRESHOLD_ALERT_VIEW_MODEL,
      useValue: thresholdAlertViewModel,
    },
  ],
})
export class ThresholdAlertCardComponent implements OnInit {
  public vm: typeof thresholdAlertViewModel;
  public data$!: Observable<ThresholdAlertListData | null>;
  public loading$!: Observable<boolean>;
  public error$!: Observable<any>;

  constructor(@Inject(THRESHOLD_ALERT_VIEW_MODEL) vm: typeof thresholdAlertViewModel) {
    this.vm = vm;
  }

  ngOnInit(): void {
    this.data$ = this.vm.data$;
    this.loading$ = this.vm.isLoading$;
    this.error$ = this.vm.error$;

    this.vm.fetchCommand.execute();
  }
}
