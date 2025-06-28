Pull the repository.
Remember you are in a turbo repo managed repository set up to demonstrate mvvm architecture
Your task is to duplicate the functionality of the apps/mvvm-react in apps/mvvm-angular.
And angular 19.2.12 project has already been set up.
Add a router for angular
Add chart.js ( version 4) for angular.
Install "@repo/view-models": "\*", so you can use the same view models in packages/view-models as used by the react app.

Create the equivalent components like in react for for angular. Use angular principles and best practices to inject the view models.

GreenhouseCard
SensorCard
SensorReadingCard
ThresholdAlertCard
Dashboard

GreenhouseList
SensorList
SensorReadingList
ThresholdAlertList

How to use the view models:
Study rhe react approach but use what is inline with angular patterns
A typical view model is a class like set up like:

export class GreenHouseViewModel extends RestfulApiViewModel<
GreenhouseListData,
typeof GreenhouseListSchema

> {
> constructor(model: GreenHouseModel) {

    super(model);
    this.model = model;

}
}

const greenHouseModel = new GreenHouseModel();
export const greenHouseViewModel = new GreenHouseViewModel(greenHouseModel);

export type { GreenhouseListData };

You should try and use the greenHouseModel( already instantiated version just like the react app). Else try injecting the
GreenHouseViewModel class.

Create routes to map to the following components.

Dashboard
GreenhouseList
SensorList
SensorReadingList
ThresholdAlertList

The cards are in the dashboard and present and overview whilst the list is a list of all the data fetched.
Link the card components in the dashboard

GreenhouseCard
SensorCard
SensorReadingCard
ThresholdAlertCard

To the list routes so that if I click on the card header. The card header should should be a link and clickable and have a nice bluish color.
I am navigated to the list under the route.

Create a Pull request of the changes.
