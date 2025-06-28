import { ObservableCollection } from 'mvvm-core';

export type NavigationListData = {
  id: string;
  label: string;
  icon: string;
};

export class NavigationViewModel {
  private _navigationList: ObservableCollection<NavigationListData>;

  constructor() {
    this._navigationList = new ObservableCollection([
      { id: 'greenhouses', label: 'Greenhouses', icon: 'greenhouse' },
      { id: 'sensors', label: 'Sensors', icon: 'sensor' },
      { id: 'sensor-readings', label: 'Readings', icon: 'reading' },
      { id: 'threshold-alerts', label: 'Alerts', icon: 'alert' },
    ]);
  }

  get navigationList(): ObservableCollection<NavigationListData> {
    return this._navigationList;
  }
  //  to array should be used in the view
  //  so that it can be used in the template
  //  this is to avoid using the observable collection directly in the template
  get navigationListArray(): NavigationListData[] {
    return this._navigationList.toArray();
  }
}

export const navigationViewModel = new NavigationViewModel();
