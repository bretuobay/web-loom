import { FakeTodoApi } from './api/FakeTodoApi'; // Adjust path
import { RestfulTodoListModel } from './models/RestfulTodoModel'; // Adjust path
import { RestfulTodoViewModel } from './viewmodels/RestfulTodoViewModel'; // Adjust path
import { RestfulTodoData, RestfulTodoListSchema } from './models/RestfulTodoSchema'; // Adjust path
import { take } from 'rxjs/operators';

async function runRestfulTodoExample() {
  console.log('--- Running RestfulTodo Example ---');

  // 1. Initialize the Fake API
  const initialTodos: RestfulTodoData[] = [
    {
      id: '1',
      text: 'Learn about RestfulApiModel',
      isCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      text: 'Implement Fake API',
      isCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      text: 'Create RestfulTodoViewModel',
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  const fakeApi = new FakeTodoApi(initialTodos);
  const fetcher = fakeApi.getFetcher();

  // 2. Instantiate the Model (for a list of todos)
  // The RestfulTodoListModel expects RestfulTodoListData (an array) as its TData.
  // The schema is RestfulTodoListSchema.
  const todoListModel = new RestfulTodoListModel({
    baseUrl: fakeApi.baseUrl, // Or any valid URL string, as FakeTodoApi overrides it
    endpoint: '/todos', // Standard todos endpoint
    fetcher: fetcher as any,
    schema: RestfulTodoListSchema, // Schema for validating an array of todos
    initialData: null, // Start with no data, will be fetched
  });

  // 3. Instantiate the ViewModel
  const todoViewModel = new RestfulTodoViewModel(todoListModel);

  // 4. Subscribe to ViewModel observables
  todoViewModel.todos$.subscribe((todos) => {
    console.log(
      'Todos Updated:',
      todos ? todos.map((t) => `[${t.isCompleted ? 'x' : ' '}] ${t.text} (ID: ${t.id})`).join('\n') : 'No todos',
    );
  });

  todoViewModel.isLoading$.subscribe((isLoading) => {
    console.log('Is Loading:', isLoading);
  });

  todoViewModel.error$.subscribe((error) => {
    if (error) {
      console.error('Error:', error);
    }
  });

  todoViewModel.selectedItem$.subscribe((selected) => {
    if (selected) {
      console.log('Selected Item:', selected);
    }
  });

  // 5. Demonstrate Usage
  try {
    // Fetch initial todos
    console.log('\n--- Fetching Todos ---');
    await todoViewModel.fetchCommand.execute();

    // Get current todos after fetch for operations
    let currentTodos = await todoViewModel.todos$.pipe(take(1)).toPromise();
    if (!currentTodos || currentTodos.length === 0) {
      console.log('No todos after fetch, cannot proceed with other operations as easily.');
      // If you want to ensure there are todos for the next steps:
      // You could add one here, or rely on the initialTodos in FakeTodoApi to be non-empty.
    }

    // Add a new todo
    console.log('\n--- Adding a New Todo ---');
    const newTodoPayload = { text: 'Test new todo', isCompleted: false };
    const addedTodo = await todoViewModel.addTodoCommand.execute(newTodoPayload);
    console.log('Added Todo Server Response:', addedTodo);

    currentTodos = await todoViewModel.todos$.pipe(take(1)).toPromise(); // refresh currentTodos

    // Update a todo (e.g., the one just added or an existing one)
    const todoToUpdateId = addedTodo
      ? addedTodo.id
      : currentTodos && currentTodos.length > 0
        ? currentTodos[0].id
        : null;
    if (todoToUpdateId) {
      console.log(`\n--- Updating Todo (ID: ${todoToUpdateId}) ---`);
      const updatedTodo = await todoViewModel.updateTodoCommand.execute({
        id: todoToUpdateId,
        payload: { text: 'Updated todo text!', isCompleted: true },
      });
      console.log('Updated Todo Server Response:', updatedTodo);
    } else {
      console.log('\n--- Skipping Update (no todo ID available) ---');
    }

    currentTodos = await todoViewModel.todos$.pipe(take(1)).toPromise(); // refresh

    // Toggle completion (using the specific ViewModel method)
    const todoToToggleId = currentTodos && currentTodos.length > 1 ? currentTodos[1].id : null;
    if (todoToToggleId) {
      console.log(`\n--- Toggling Completion for Todo (ID: ${todoToToggleId}) ---`);
      const todoBeforeToggle = currentTodos?.find((t) => t.id === todoToToggleId);
      console.log(`Before toggle: ${todoBeforeToggle?.text} - Completed: ${todoBeforeToggle?.isCompleted}`);
      await todoViewModel.toggleTodoCompletion(todoToToggleId);
      // Re-fetch or check local data to see the change
      const todosAfterToggle = await todoViewModel.todos$.pipe(take(1)).toPromise();
      const todoAfterToggle = todosAfterToggle?.find((t) => t.id === todoToToggleId);
      console.log(`After toggle: ${todoAfterToggle?.text} - Completed: ${todoAfterToggle?.isCompleted}`);
    } else {
      console.log('\n--- Skipping Toggle (no suitable todo ID available) ---');
    }

    currentTodos = await todoViewModel.todos$.pipe(take(1)).toPromise(); // refresh

    // Select an item
    const todoToSelectId = currentTodos && currentTodos.length > 0 ? currentTodos[0].id : null;
    if (todoToSelectId) {
      console.log(`\n--- Selecting Todo (ID: ${todoToSelectId}) ---`);
      todoViewModel.selectItem(todoToSelectId);
      // selectedItem$ subscription will log the selected item
      todoViewModel.selectItem(null); // Clear selection
    }

    // Delete a todo
    const todoToDeleteId = addedTodo
      ? addedTodo.id
      : currentTodos && currentTodos.length > 0
        ? currentTodos[currentTodos.length - 1].id
        : null;
    if (todoToDeleteId) {
      console.log(`\n--- Deleting Todo (ID: ${todoToDeleteId}) ---`);
      await todoViewModel.deleteCommand.execute(todoToDeleteId);
    } else {
      console.log('\n--- Skipping Delete (no todo ID available) ---');
    }

    // Fetch todos again to see final state
    console.log('\n--- Fetching Todos Again (final state) ---');
    await todoViewModel.fetchCommand.execute();
  } catch (error) {
    console.error('An error occurred during the example execution:', error);
  } finally {
    // 6. Dispose ViewModel and Model
    console.log('\n--- Disposing ViewModel ---');
    todoViewModel.dispose(); // This should also dispose the model if RestfulApiViewModel handles it.
    // RestfulApiViewModel.dispose() calls this.model.dispose().
    console.log('--- RestfulTodo Example Finished ---');
  }
}

// Run the example
runRestfulTodoExample();

// To make this file executable or easily runnable, you might need to:
// 1. Compile it with `tsc`.
// 2. Run the compiled JS file with Node.js.
// For now, it serves as a self-contained demonstration of the classes.
// It could also be imported and run from one of the example apps (React/Vue) if desired.
