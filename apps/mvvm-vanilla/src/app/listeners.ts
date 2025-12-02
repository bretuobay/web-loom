import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';
import { navigationViewModel } from '@repo/shared/view-models/NavigationViewModel';

import { state } from './state';
import { renderLayout, renderCard, renderTemplate } from './ui';
import { renderSensorReadingsChart } from './chart';

const app = document.getElementById('app')!;
const greenHouseSizeOptions = ['25sqm', '50sqm', '100sqm'] as const;

export function subscribeToUpdates() {
  navigationViewModel.navigationList.items$.subscribe((navigation) => {
    console.log('Navigation data received:', navigation);
    state.navigation = navigation || [];
    renderLayout();
  });

  greenHouseViewModel.data$.subscribe((greenHouses) => {
    state.greenHouses = greenHouses || [];
    const path = window.location.pathname;
    if (path === '/' || path === '/dashboard') {
      renderCard('greenhouse-card-container', '/src/views/GreenhouseCard.ejs', { greenHouses });
    } else if (path === '/greenhouses') {
      renderTemplate('/src/views/GreenhouseList.ejs', { greenHouses }).then((html) => {
        app.innerHTML = html;
        attachGreenhouseFormListeners();
      });
    }
  });

  sensorViewModel.data$.subscribe((sensors) => {
    state.sensors = sensors || [];
    const path = window.location.pathname;
    if (path === '/' || path === '/dashboard') {
      renderCard('sensor-card-container', '/src/views/SensorCard.ejs', { sensors });
    } else if (path === '/sensors') {
      renderTemplate('/src/views/SensorList.ejs', { sensors }).then((html) => (app.innerHTML = html));
    }
  });

  sensorReadingViewModel.data$.subscribe((sensorReadings) => {
    state.sensorReadings = sensorReadings || [];
    const path = window.location.pathname;
    if (path === '/' || path === '/dashboard') {
      renderCard('sensor-reading-card-container', '/src/views/SensorReadingCard.ejs', { sensorReadings }).then(() => {
        renderSensorReadingsChart(sensorReadings || []);
      });
    } else if (path === '/sensor-readings') {
      renderTemplate('/src/views/SensorReadingList.ejs', { sensorReadings }).then((html) => (app.innerHTML = html));
    }
  });

  thresholdAlertViewModel.data$.subscribe((thresholdAlerts) => {
    state.thresholdAlerts = thresholdAlerts || [];
    const path = window.location.pathname;
    if (path === '/' || path === '/dashboard') {
      renderCard('threshold-alert-card-container', '/src/views/ThresholdAlertCard.ejs', { thresholdAlerts });
    } else if (path === '/threshold-alerts') {
      renderTemplate('/src/views/ThresholdAlertList.ejs', { thresholdAlerts }).then((html) => (app.innerHTML = html));
    }
  });
}

export function attachGreenhouseFormListeners() {
  const form = document.getElementById('greenhouse-form') as HTMLFormElement | null;
  if (!form) {
    return;
  }

  const nameInput = form.querySelector<HTMLInputElement>('#name');
  const locationInput = form.querySelector<HTMLTextAreaElement>('#location');
  const sizeSelect = form.querySelector<HTMLSelectElement>('#size');
  const cropTypeInput = form.querySelector<HTMLInputElement>('#cropType');

  if (!nameInput || !locationInput || !sizeSelect || !cropTypeInput) {
    console.error('Greenhouse form inputs are missing');
    return;
  }

  const resetFormState = () => {
    form.reset();
    delete form.dataset.editId;
  };

  const findGreenhouseById = (id?: string) => {
    if (!id) {
      return undefined;
    }
    return state.greenHouses?.find((gh) => (gh.id ?? '').toString() === id);
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const location = formData.get('location') as string;
    const size = formData.get('size') as string;
    const cropType = formData.get('cropType') as string;
    const data = { name, location, size, cropType };
    const editingId = form.dataset.editId;

    if (editingId) {
      const greenhouse = findGreenhouseById(editingId);
      greenHouseViewModel.updateCommand.execute({
        id: editingId,
        payload: {
          ...(greenhouse || { id: editingId }),
          name,
          location,
          size,
          cropType,
        },
      });
    } else {
      const duplicateByName = state.greenHouses?.find((gh) => gh.name === name);
      if (duplicateByName) {
        console.error('Greenhouse with this name already exists:', name);
        return;
      }
      greenHouseViewModel.createCommand.execute(data);
    }

    resetFormState();
  });

  document.querySelectorAll<HTMLButtonElement>('.button-tiny-delete').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const id = button.dataset.id;
      if (!id) {
        console.error('No ID provided for deletion');
        return;
      }
      greenHouseViewModel.deleteCommand.execute(id);
      if (form.dataset.editId === id) {
        resetFormState();
      }
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.button-tiny-edit').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const id = button.dataset.id;
      if (!id) {
        console.error('No ID provided for editing');
        return;
      }
      const greenhouse = findGreenhouseById(id);
      if (!greenhouse) {
        console.error('Greenhouse not found for update:', id);
        return;
      }
      nameInput.value = greenhouse.name;
      locationInput.value = greenhouse.location;
      if (greenHouseSizeOptions.includes(greenhouse.size as (typeof greenHouseSizeOptions)[number])) {
        sizeSelect.value = greenhouse.size;
      } else {
        sizeSelect.value = '100sqm';
      }
      cropTypeInput.value = greenhouse.cropType || '';
      form.dataset.editId = id;
      nameInput.focus();
    });
  });
}
