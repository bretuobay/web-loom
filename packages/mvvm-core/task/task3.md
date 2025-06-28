The repository is and experimental mvvm library for building user interfaces.
The requirements are stored in Product Requirements Document.md and this has been implemented

The following are typical examples of using restful api model and restful api view models.
Your task is to analyze them and come out with a utility that makes setting up the view models very easy by creating a view model factory that takes. The utility is like a reactive view model factory that takes in schema, model , datatype , config? for the model
and internally sets up the model and creates the view model ready for use in the views.
Write unit tests for it. All this should be in utilities / helpers folder under src.
And exposed for use.
Do not touch existing models & view models.

```typescript
import { RestfulApiModel } from 'mvvm-core';
import { GreenhouseListSchema, type GreenhouseListData } from './schemas';
import { nativeFetcher } from './utils/fetcher';
import { apiRegistry } from './services/services';
import { API_BASE_URL } from './config';

const { path } = apiRegistry.greenhouse.list;

const CONFIG = {
  baseUrl: API_BASE_URL,
  endpoint: path,
  fetcher: nativeFetcher,
  schema: GreenhouseListSchema,
  initialData: [],
  validateSchema: false,
};

export class GreenHouseModel extends RestfulApiModel<GreenhouseListData, typeof GreenhouseListSchema> {
  constructor() {
    super(CONFIG);
  }
}
```

```typescript
import { RestfulApiViewModel } from 'mvvm-core';
import { GreenHouseModel } from '../../models/src/GreenHouseModel';

import { type GreenhouseListData, GreenhouseListSchema } from '../../models';

export class GreenHouseViewModel extends RestfulApiViewModel<GreenhouseListData, typeof GreenhouseListSchema> {
  constructor(model: GreenHouseModel) {
    super(model);
    this.model = model;
  }
}

const greenHouseModel = new GreenHouseModel();
export const greenHouseViewModel = new GreenHouseViewModel(greenHouseModel);

export type { GreenhouseListData };
```
