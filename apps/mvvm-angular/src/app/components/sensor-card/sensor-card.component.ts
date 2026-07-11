import { Component, OnInit, Inject, InjectionToken, Signal, DestroyRef, inject } from '@angular/core';
import { fromLoomSignal } from '../../utils/loom-signals';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { sensorViewModel, SensorListData } from '@repo/view-models/SensorViewModel';

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
  public data$!: Signal<SensorListData | null>;
  public loading$!: Signal<boolean>;
  public error$!: Signal<any>;

  private destroyRef = inject(DestroyRef);

  constructor(@Inject(SENSOR_VIEW_MODEL) vm: typeof sensorViewModel) {
    this.vm = vm;
  }

  ngOnInit(): void {
    this.data$ = fromLoomSignal(this.vm.data$, this.destroyRef);
    this.loading$ = fromLoomSignal(this.vm.isLoading$, this.destroyRef);
    this.error$ = fromLoomSignal(this.vm.error$, this.destroyRef);

    this.vm.fetchCommand.execute();
  }
}
