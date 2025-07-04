Task:
refactor existing code

rename

packages/mvvm-core/src/models/CachedRestfulApiModel.ts
to
packages/mvvm-core/src/models/QueryStateModel.ts

rename
packages/mvvm-core/src/viewmodels/CachedRestfulApiViewModel.ts
to
packages/mvvm-core/src/viewmodels/QueryStateModelView.ts

Refactor associated test files to match name
Refactor packages/mvvm-core/README.md to reflect current use case.

The new model is CachedRestfulApiModel and view model is CachedRestfulApiViewModel.

Reading and resource materials
packages/query-core/src/QueryCore.ts
packages/query-core/README.md
