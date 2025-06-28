import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { sensorViewModel, SensorListData } from '@repo/view-models/SensorViewModel';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-sensor-card',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sensor-card.component.html',
  styleUrl: './sensor-card.component.scss',
})
export class SensorCardComponent {
  public vm = sensorViewModel;
  public data$: Observable<SensorListData | null>;
  public loading$: Observable<boolean>;
  public error$: Observable<any>;

  constructor() {
    this.data$ = this.vm.data$;
    this.loading$ = this.vm.isLoading$;
    this.error$ = this.vm.error$;

    this.vm.fetchCommand.execute();
  }
}
