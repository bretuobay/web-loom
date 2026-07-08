import { Component, OnInit, Inject, InjectionToken, Signal, DestroyRef, inject } from '@angular/core';
import { fromLoomSignal } from '../../utils/loom-signals';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { thresholdAlertViewModel, ThresholdAlertListData } from '@repo/view-models/ThresholdAlertViewModel';

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
  public data$!: Signal<ThresholdAlertListData | null>;
  public loading$!: Signal<boolean>;
  public error$!: Signal<any>;

  private destroyRef = inject(DestroyRef);

  constructor(@Inject(THRESHOLD_ALERT_VIEW_MODEL) vm: typeof thresholdAlertViewModel) {
    this.vm = vm;
  }

  ngOnInit(): void {
    this.data$ = fromLoomSignal(this.vm.data$, this.destroyRef);
    this.loading$ = fromLoomSignal(this.vm.isLoading$, this.destroyRef);
    this.error$ = fromLoomSignal(this.vm.error$, this.destroyRef);

    this.vm.fetchCommand.execute();
  }
}
