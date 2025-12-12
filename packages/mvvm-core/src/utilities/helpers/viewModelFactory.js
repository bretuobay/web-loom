export function createGenericViewModel(config) {
    const model = new config.modelConstructor(...config.modelConstructorParams);
    const viewModel = new config.viewModelConstructor(model);
    return viewModel;
}
