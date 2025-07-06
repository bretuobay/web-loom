import { Component, OnInit, Inject, InjectionToken } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { sensorViewModel, SensorListData } from '@repo/view-models/SensorViewModel';
import { Observable } from 'rxjs';

export const SENSOR_VIEW_MODEL = new InjectionToken<typeof sensorViewModel>('SENSOR_VIEW_MODEL');

@Component({
  selector: 'app-sensor-card',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sensor-card.component.html',
  styleUrl: './sensor-card.component.scss',
  providers: [
    {
      provide: SENSOR_VIEW_MODEL,
      useValue: sensorViewModel,
    },
  ],
})
export class SensorCardComponent implements OnInit {
  public vm: typeof sensorViewModel;
  public data$!: Observable<SensorListData | null>;
  public loading$!: Observable<boolean>;
  public error$!: Observable<any>;

  constructor(@Inject(SENSOR_VIEW_MODEL) vm: typeof sensorViewModel) {
    this.vm = vm;
  }

  ngOnInit(): void {
    this.data$ = this.vm.data$;
    this.loading$ = this.vm.isLoading$;
    this.error$ = this.vm.error$;

    this.vm.fetchCommand.execute();
  }
}
