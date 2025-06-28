The repository is and experimental mvvm library for building user interfaces.
The requirements are stored in Product Requirements Document.md and this has been implemented

Analyze the BaseModel (src/models/BaseModel.ts) and the BaseViewModel (src/viewmodels/BaseViewModel.ts)
Create a view model factory that can be used to create view models easily.

use the example of UI View model for managing navigation items.
Model stores a config const navigationItems = [
{ path: '/', label: 'Home' },
{ path: '/about', label: 'About' },
{ path: '/services', label: 'Services' },
{ path: '/blog', label: 'Blog' },
{ path: '/contact', label: 'Contact' }
];
view models exposes it to views etc ...

write test for the factory, and run and test
bump up package.json version to 0.4.5
create pull request.
