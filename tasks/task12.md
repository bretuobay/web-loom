Task:
refactor existing code

rename

Modify QueryStateModel so that it takes in a generic instance of a store.
and just exposes it to the view model ( public )
packages/mvvm-core/src/models/QueryStateModel.ts

An example of a store is in

packages/store-core/src/index.ts

But we don't want it coupled to QueryStateModel.
So it can be any store that is injected into the model.
