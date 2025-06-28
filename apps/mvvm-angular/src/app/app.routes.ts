import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { GreenhouseListComponent } from './components/greenhouse-list/greenhouse-list.component';
import { SensorListComponent } from './components/sensor-list/sensor-list.component';
import { SensorReadingListComponent } from './components/sensor-reading-list/sensor-reading-list.component';
import { ThresholdAlertListComponent } from './components/threshold-alert-list/threshold-alert-list.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'greenhouses', component: GreenhouseListComponent },
  { path: 'sensors', component: SensorListComponent },
  { path: 'sensor-readings', component: SensorReadingListComponent },
  { path: 'threshold-alerts', component: ThresholdAlertListComponent },
];
