Read and understand below the description below of how to integrate these two libraries into the models of and mvvm architecture.

Task:
Change directory into the package: packages/mvvm-core
Install dependencies.

Fix tests in which have been skipped
packages/mvvm-core/src/viewmodels/CachedRestfulApiViewModel.test.ts
Fix test in packages/mvvm-core/src/models/CachedRestfulApiModel.test.ts which has been skipped.

Fix typescript issue below for the query command in packages/mvvm-core/src/viewmodels/CachedRestfulApiViewModel.ts

Type 'Command<boolean | undefined, void>' is not assignable to type 'Command<boolean | void, void>'.
Type 'boolean | void' is not assignable to type 'boolean | undefined'.
Type 'void' is not assignable to type 'boolean | undefined'.

Further context. Below are original instructions to create these classes:
I want you to add a new model and view model in the package
packages/mvvm-core
so under packages/mvvm-core/src/models
and packages/mvvm-core/src/viewmodels
The new model is CachedRestfulApiModel and view model is CachedRestfulApiViewModel.
These are similar to the existing RestfulApiModel and view model is RestfulApiViewModel
but it takes in ( expects additional parameter in the model called query instead of fetcher )
read about example of query in packages/query-core/src/QueryCore.ts.
QueryCore is supposed to cache the api response.
Design it so that query is dependency injected in the model and can be swapped.
