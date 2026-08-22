import { A } from '@solidjs/router';
import type { ThresholdAlertListData } from '@repo/view-models/ThresholdAlertViewModel';

interface ThresholdAlertCardProps {
  thresholdAlerts: ThresholdAlertListData;
}

export default function ThresholdAlertCard(props: ThresholdAlertCardProps) {
  return (
    <div class="card">
      <A href="/threshold-alerts" class="card-header-link">
        <h3 class="card-title">Alerts</h3>
      </A>
      <p class="card-content">Total Alerts: {props.thresholdAlerts.length}</p>
    </div>
  );
}
