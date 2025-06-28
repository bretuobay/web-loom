import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Replaced NgFor, NgClass
import { sensorViewModel, SensorListData } from '@repo/view-models/SensorViewModel';
import { Observable } from 'rxjs';
import { RouterLink } from '@angular/router';
import { BackIconComponent } from '../back-icon/back-icon.component';

@Component({
  selector: 'app-sensor-list',
  standalone: true,
  imports: [CommonModule, BackIconComponent, RouterLink],
  templateUrl: './sensor-list.component.html',
  styleUrl: './sensor-list.component.scss',
})
export class SensorListComponent {
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
