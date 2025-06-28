import { Component } from '@angular/core';
import { GreenhouseCardComponent } from '../greenhouse-card/greenhouse-card.component';
import { SensorCardComponent } from '../sensor-card/sensor-card.component';
import { SensorReadingCardComponent } from '../sensor-reading-card/sensor-reading-card.component';
import { ThresholdAlertCardComponent } from '../threshold-alert-card/threshold-alert-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [GreenhouseCardComponent, SensorCardComponent, SensorReadingCardComponent, ThresholdAlertCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {}
