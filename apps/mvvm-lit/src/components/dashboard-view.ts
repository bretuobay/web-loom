// @ts-nocheck
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Subscription, combineLatest } from 'rxjs';

import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';

import './greenhouse-card';
import './sensor-card';
import './sensor-reading-card';
import './threshold-alert-card';

@customElement('dashboard-view')
export class DashboardView extends LitElement {
  @state() private isLoading = true;
  private subscriptions: Subscription[] = [];

  connectedCallback() {
    super.connectedCallback();
    this.subscriptions.push(
      combineLatest([
        greenHouseViewModel.isLoading$,
        sensorViewModel.isLoading$,
        sensorReadingViewModel.isLoading$,
        thresholdAlertViewModel.isLoading$,
      ]).subscribe(([gh, s, sr, ta]) => {
        this.isLoading = gh || s || sr || ta;
      }),
    );
    this.fetchData();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private async fetchData() {
    try {
      await Promise.all([
        greenHouseViewModel.fetchCommand.execute(),
        sensorViewModel.fetchCommand.execute(),
        sensorReadingViewModel.fetchCommand.execute(),
        thresholdAlertViewModel.fetchCommand.execute(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  render() {
    return html`
      <div class="dashboard-container">
        ${this.isLoading
          ? html`<p>Loading dashboard data...</p>`
          : html`
              <h2>Dashboard</h2>
              <div class="flex-container">
                <div class="flex-item">
                  <greenhouse-card></greenhouse-card>
                </div>
                <div class="flex-item">
                  <sensor-card></sensor-card>
                </div>
                <div class="flex-item">
                  <threshold-alert-card></threshold-alert-card>
                </div>
                <div class="flex-item">
                  <sensor-reading-card></sensor-reading-card>
                </div>
              </div>
            `}
      </div>
    `;
  }
}
