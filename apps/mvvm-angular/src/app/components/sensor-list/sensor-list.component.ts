import { Component, OnInit, Inject, InjectionToken } from '@angular/core';
import { CommonModule } from '@angular/common'; // Replaced NgFor, NgClass
import { sensorViewModel, SensorListData, SensorViewModel } from '@repo/view-models/SensorViewModel';
import { Observable } from 'rxjs';
import { RouterLink } from '@angular/router';
import { BackIconComponent } from '../back-icon/back-icon.component';

// Create an injection token for the sensor view model
export const SENSOR_VIEW_MODEL = new InjectionToken<SensorViewModel>('SensorViewModel');

@Component({
  selector: 'app-sensor-list',
  standalone: true,
  imports: [CommonModule, BackIconComponent, RouterLink],
  providers: [
    {
      provide: SENSOR_VIEW_MODEL,
      useValue: sensorViewModel,
    },
  ],
  templateUrl: './sensor-list.component.html',
  styleUrl: './sensor-list.component.scss',
})
export class SensorListComponent implements OnInit {
  public data$!: Observable<SensorListData | null>;
  public loading$!: Observable<boolean>;
  public error$!: Observable<any>;

  constructor(@Inject(SENSOR_VIEW_MODEL) public readonly vm: SensorViewModel) {
    // Constructor only for dependency injection
  }

  ngOnInit(): void {
    // Initialize observables in ngOnInit
    this.data$ = this.vm.data$;
    this.loading$ = this.vm.isLoading$;
    this.error$ = this.vm.error$;

    // Execute commands and side effects
    this.vm.fetchCommand.execute();
  }

  // Keep getStatusClass or adapt if status is directly on sensor items
  // This depends on the structure of items in SensorListData
  getStatusClass(status: string | undefined): string {
    if (!status) return '';
    switch (status.toLowerCase()) {
      case 'online':
        return 'status-online';
      case 'offline':
        return 'status-offline';
      case 'error':
        return 'status-error';
      default:
        return '';
    }
  }
}
