import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { thresholdAlertViewModel, ThresholdAlertListData } from '@repo/view-models/ThresholdAlertViewModel';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-threshold-alert-card',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './threshold-alert-card.component.html',
  styleUrl: './threshold-alert-card.component.scss',
})
export class ThresholdAlertCardComponent {
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
}
