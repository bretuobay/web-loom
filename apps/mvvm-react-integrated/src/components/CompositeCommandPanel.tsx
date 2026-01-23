import '../styles/CompositeCommandPanel.css';

import { Command, CompositeCommand } from '@web-loom/mvvm-core';
import { type FC, useEffect, useMemo, useState } from 'react';
import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';
import { useObservable } from '../hooks/useObservable';

const CompositeCommandPanel: FC = () => {
  const [statusMessage, setStatusMessage] = useState('Ready to orchestrate composite workflows.');
  const [lastRunSummary, setLastRunSummary] = useState('No operations executed yet.');

  const parallelRefreshCommand = useMemo(() => {
    const command = new CompositeCommand<void, void[]>({ executionMode: 'parallel' });
    command.register(greenHouseViewModel.fetchCommand);
    command.register(sensorViewModel.fetchCommand);
    command.register(sensorReadingViewModel.fetchCommand);
    command.register(thresholdAlertViewModel.fetchCommand);
    return command;
  }, []);

  const telemetryCheckCommand = useMemo(
    () =>
      new Command<void, string>(async () => {
        await new Promise((resolve) => setTimeout(resolve, 220));
        return 'Telemetry health checkpoints clean';
      }),
    [],
  );

  const diagnosticSequenceCommand = useMemo(() => {
    const command = new CompositeCommand<void, (void | string)[]>({ executionMode: 'sequential' });
    command.register(sensorReadingViewModel.fetchCommand);
    command.register(thresholdAlertViewModel.fetchCommand);
    command.register(telemetryCheckCommand);
    return command;
  }, [telemetryCheckCommand]);

  useEffect(() => {
    return () => {
      telemetryCheckCommand.dispose();
    };
  }, [telemetryCheckCommand]);

  useEffect(() => {
    return () => {
      parallelRefreshCommand.dispose();
      diagnosticSequenceCommand.dispose();
    };
  }, [diagnosticSequenceCommand, parallelRefreshCommand]);

  const parallelCanExecute = useObservable(parallelRefreshCommand.canExecute$, true);
  const parallelIsExecuting = useObservable(parallelRefreshCommand.isExecuting$, false);
  const sequentialCanExecute = useObservable(diagnosticSequenceCommand.canExecute$, true);
  const sequentialIsExecuting = useObservable(diagnosticSequenceCommand.isExecuting$, false);
  const parallelError = useObservable(parallelRefreshCommand.executeError$, null);
  const sequentialError = useObservable(diagnosticSequenceCommand.executeError$, null);

  const formatTimestamp = () => new Date().toLocaleTimeString();

  const runParallelRefresh = async () => {
    setStatusMessage('Refreshing all streams in parallel.');
    try {
      await parallelRefreshCommand.execute();
      setStatusMessage('Parallel refresh completed successfully.');
      setLastRunSummary(`Parallel refresh finished at ${formatTimestamp()}.`);
    } catch (error) {
      console.error('Parallel refresh failed', error);
      setStatusMessage('Parallel refresh failed – check logs for details.');
    }
  };

  const runDiagnosticSequence = async () => {
    setStatusMessage('Running sequential diagnostics squad.');
    try {
      const results = await diagnosticSequenceCommand.execute();
      const telemetryResult = results.find((value) => typeof value === 'string') as string | undefined;
      setStatusMessage('Sequential diagnostics completed.');
      setLastRunSummary(
        `Diagnostics sequence complete (${telemetryResult ?? 'no telemetry result'}) at ${formatTimestamp()}.`,
      );
    } catch (error) {
      console.error('Diagnostics sequence failed', error);
      setStatusMessage('Diagnostics run failed – inspect executionError$.');
    }
  };

  return (
    <div className="composite-command-panel">
      <div className="composite-command-panel__header">
        <p className="composite-command-panel__eyebrow">MVVM Core Pattern</p>
        <h3>Composite Command Control Center</h3>
        <p className="composite-command-panel__description">
          Coordinate multiple fetches and diagnostics from one place.
          CompositeCommand abstracts the orchestration so the UI only needs to toggle a single entry point.
        </p>
      </div>

      <div className="composite-command-panel__actions">
        <div className="composite-command-panel__action">
          <div className="composite-command-panel__action-header">
            <h4>Parallel refresh</h4>
            <span className="composite-command-panel__badge">
              {parallelIsExecuting ? 'Running' : 'Idle'}
            </span>
          </div>
          <p>
            Simultaneously trigger greenhouses, sensors, sensor readings, and threshold alerts so the dashboard stays
            coherent.
          </p>
          <button
            className="composite-command-panel__button"
            onClick={runParallelRefresh}
            disabled={!parallelCanExecute || parallelIsExecuting}
          >
            {parallelIsExecuting ? 'Refreshing...' : 'Refresh every stream'}
          </button>
          {parallelError && (
            <p className="composite-command-panel__error">
              Parallel error: {String(parallelError)}
            </p>
          )}
        </div>

        <div className="composite-command-panel__action">
          <div className="composite-command-panel__action-header">
            <h4>Sequential diagnostics</h4>
            <span className="composite-command-panel__badge">
              {sequentialIsExecuting ? 'Running' : 'Idle'}
            </span>
          </div>
          <p>
            Execute sensor readings, alerts, and telemetry health checks one after another so each step has the latest
            data before the next begins.
          </p>
          <button
            className="composite-command-panel__button composite-command-panel__button--secondary"
            onClick={runDiagnosticSequence}
            disabled={!sequentialCanExecute || sequentialIsExecuting}
          >
            {sequentialIsExecuting ? 'Running diagnostics...' : 'Run diagnostics sequence'}
          </button>
          {sequentialError && (
            <p className="composite-command-panel__error">
              Diagnostics error: {String(sequentialError)}
            </p>
          )}
        </div>
      </div>

      <div className="composite-command-panel__footer">
        <p className="composite-command-panel__status">{statusMessage}</p>
        <p className="composite-command-panel__summary">{lastRunSummary}</p>
      </div>
    </div>
  );
};

export default CompositeCommandPanel;
