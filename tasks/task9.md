Read and understand below the description below of how to integrate these two libraries into the models of and mvvm architecture.

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

CachedRestfulApiViewModel should look similar to RestfulApiViewModel but you are free to suggest good approaches.

Write tests and run them for the two new classes

Add documentation to the mvvm core read me. on how to use the new classes.

Reading and resource materials
packages/query-core/src/QueryCore.ts
packages/query-core/README.md
