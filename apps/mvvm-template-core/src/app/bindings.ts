import { computed, signal, type ReadonlySignal, type WritableSignal } from '@web-loom/signals-core';
import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';
import { navigationViewModel } from '@repo/shared/view-models/NavigationViewModel';
import type { GreenhouseData } from '@repo/view-models/GreenHouseViewModel';
import type { GreenhouseAppViewModel } from './view-model';
import { createSensorReadingsChartAction } from './chart';

const GREENHOUSE_SIZE_OPTIONS = [
  { value: '25sqm', label: '25sqm / Small' },
  { value: '50sqm', label: '50sqm / Medium' },
  { value: '100sqm', label: '100sqm / Large' },
] as const;

export type GreenhouseSizeOption = (typeof GREENHOUSE_SIZE_OPTIONS)[number];

export interface GreenhouseFormState {
  name$: WritableSignal<string>;
  location$: WritableSignal<string>;
  size$: WritableSignal<string>;
  cropType$: WritableSignal<string>;
  editingId$: WritableSignal<string>;
}

/**
 * Adapts template-core DOM events to the shared greenhouse ViewModels.
 * Event and element knowledge belongs at the View boundary, not in the VM.
 */
export class GreenhouseAppBindings {
  readonly greenHouses = greenHouseViewModel;
  readonly sensors = sensorViewModel;
  readonly sensorReadings = sensorReadingViewModel;
  readonly thresholdAlerts = thresholdAlertViewModel;
  readonly navigationItems$ = navigationViewModel.navigationList.items$;
  readonly currentYear = new Date().getFullYear();
  readonly sizeOptions: readonly GreenhouseSizeOption[] = GREENHOUSE_SIZE_OPTIONS;
  readonly dashboardLoading$: ReadonlySignal<boolean>;
  readonly form: GreenhouseFormState = {
    name$: signal(''),
    location$: signal(''),
    size$: signal(''),
    cropType$: signal(''),
    editingId$: signal(''),
  };

  readonly renderSensorReadingsChart = createSensorReadingsChartAction(() => this.sensorReadings.data$);

  readonly loadCurrentRouteData = (): void => {
    void this.viewModel.loadRouteData(this.viewModel.route$.get());
  };

  constructor(private readonly viewModel: GreenhouseAppViewModel) {
    this.dashboardLoading$ = computed(
      () =>
        Boolean(this.greenHouses.isLoading$.get()) ||
        Boolean(this.sensors.isLoading$.get()) ||
        Boolean(this.sensorReadings.isLoading$.get()) ||
        Boolean(this.thresholdAlerts.isLoading$.get()),
    );
  }

  navigateFromClick(event: Event): void {
    const anchor = event.currentTarget;
    if (!(anchor instanceof HTMLAnchorElement)) return;
    void this.viewModel.navigate(anchor.getAttribute('href') ?? '/');
  }

  formatTimestamp(value: unknown): string {
    if (typeof value !== 'string' && typeof value !== 'number') return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  }

  submitGreenhouse(): void {
    const name = this.form.name$.get().trim();
    const location = this.form.location$.get().trim();
    const size = this.form.size$.get();
    const cropType = this.form.cropType$.get().trim();
    const data = { name, location, size, cropType };
    const editingId = this.form.editingId$.get();
    const greenHouses = this.greenHouses.data$.get() ?? [];

    if (editingId) {
      const existing = greenHouses.find((gh) => gh.id === editingId);
      void this.greenHouses.updateCommand.execute({
        id: editingId,
        payload: {
          ...(existing ?? { id: editingId }),
          name,
          location,
          size,
          cropType,
        },
      });
      this.resetForm();
      return;
    }

    const existingByName = greenHouses.find((gh) => gh.name === name);
    if (existingByName) {
      void this.greenHouses.updateCommand.execute({
        id: existingByName.id || '',
        payload: {
          ...existingByName,
          name,
          location,
          size,
          cropType,
        },
      });
      this.resetForm();
      return;
    }

    void this.greenHouses.createCommand.execute(data);
    this.resetForm();
  }

  deleteGreenhouse(greenhouse: GreenhouseData): void {
    if (!greenhouse.id) {
      console.error('No ID provided for deletion');
      return;
    }
    void this.greenHouses.deleteCommand.execute(greenhouse.id);
    if (this.form.editingId$.get() === greenhouse.id) {
      this.resetForm();
    }
  }

  editGreenhouse(greenhouse: GreenhouseData): void {
    if (!greenhouse.id) {
      console.error('Greenhouse not found for update');
      return;
    }
    this.form.name$.set(greenhouse.name);
    this.form.location$.set(greenhouse.location);
    this.form.size$.set(
      GREENHOUSE_SIZE_OPTIONS.some((option) => option.value === greenhouse.size) ? greenhouse.size : '100sqm',
    );
    this.form.cropType$.set(greenhouse.cropType || '');
    this.form.editingId$.set(greenhouse.id);
  }

  private resetForm(): void {
    this.form.name$.set('');
    this.form.location$.set('');
    this.form.size$.set('');
    this.form.cropType$.set('');
    this.form.editingId$.set('');
  }
}
