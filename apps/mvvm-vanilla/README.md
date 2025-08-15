# MVVM Vanilla

This project is a vanilla JavaScript implementation of the MVVM (Model-View-ViewModel) architectural pattern. It demonstrates how to structure a frontend application using MVVM principles without relying on frameworks like React, Angular, or Vue.

## Using EJS in MVVM Vanilla

EJS (Embedded JavaScript Templates) is used in this project to render dynamic HTML views. EJS templates allow you to embed JavaScript logic directly within your HTML, making it easy to bind data from the ViewModel to the View.

- **Template Rendering:** EJS templates are processed to generate HTML based on the current state of the ViewModel.
- **Data Binding:** The ViewModel provides data to the EJS templates, which are then rendered and injected into the DOM.
- **Separation:** EJS helps maintain a clear separation between the view structure and the business logic, aligning with MVVM principles.

Example usage:

```js
// In your ViewModel or controller
const html = ejs.render(templateString, { data: viewModel });
document.getElementById('app').innerHTML = html;
```

EJS templates are typically stored in the `public/` or `src/` directories and loaded as needed.

## Features

- **Separation of Concerns:** Clear distinction between Model, View, and ViewModel layers.
- **Reactive UI:** Updates to the model automatically reflect in the view via the view-model.
- **Lightweight:** No external dependencies or frameworks required.
- **Educational:** Designed for learning and understanding MVVM in a simple environment.

## Project Structure

- `src/` — Source code for the MVVM implementation.
- `public/` — Static assets and HTML entry point.
- `index.html` — Main HTML file to launch the app.
- `task/` — Example tasks or exercises for learning MVVM.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Run the app:**
   ```bash
   npm start
   ```
3. Open `index.html` in your browser to view the app.

## How MVVM Works in This Project

- **Model:** Represents the data and business logic.
- **View:** The UI, defined in HTML and updated via DOM manipulation.
- **ViewModel:** Connects the model and view, handling user input and updating the view when the model changes.

## How MVVM Is Applied

The MVVM pattern in this project is implemented as follows:

- **Model:** Contains the application's data and logic. Changes to the model trigger updates in the ViewModel.
- **ViewModel:** Acts as an intermediary between the Model and the View. It exposes observable properties and methods that the View can bind to. The ViewModel listens for changes in the Model and updates the View accordingly.
- **View:** Uses EJS templates to render the UI. The View listens for user interactions and delegates them to the ViewModel, which updates the Model as needed.

This approach ensures a reactive and maintainable codebase, where UI updates are automatically handled through the ViewModel, and business logic remains separated from presentation.

## Contributing

Contributions and suggestions are welcome! Please open issues or submit pull requests for improvements.

## License

MIT
