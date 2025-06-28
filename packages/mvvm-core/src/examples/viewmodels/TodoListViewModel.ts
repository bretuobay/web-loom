import { TodoItem } from '../models/TodoItem';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ObservableCollection } from '../../collections/ObservableCollection';
import { Command } from '../../commands/Command';
import { BaseModel } from '../../models/BaseModel';
import { BaseViewModel } from '../../viewmodels/BaseViewModel';

// Create a dummy BaseModel for the ViewModel since BaseViewModel expects one.
class DummyModel extends BaseModel<null, any> {
  constructor() {
    super({
      initialData: null,
      schema: null, // No schema needed for this dummy model
    });
  }
}

export class TodoListViewModel extends BaseViewModel<DummyModel> {
  public todos: ObservableCollection<TodoItem>;

  private _newTodoText$ = new BehaviorSubject<string>('');
  public newTodoText$: Observable<string> = this._newTodoText$.asObservable();

  public addTodoCommand: Command<void, void>;
  public toggleTodoCommand: Command<string, void>;

  constructor() {
    super(new DummyModel());

    this.todos = new ObservableCollection<TodoItem>([]);

    this.addTodoCommand = new Command<void, void>(
      async () => this.addTodo(),
      this._newTodoText$.pipe(map((text) => text.trim().length > 0)),
    );

    this.toggleTodoCommand = new Command<string, void>(async (todoId) => this.toggleTodo(todoId));
  }

  private addTodo(): void {
    const text = this._newTodoText$.value.trim();
    if (text) {
      const newTodo = new TodoItem({
        initialData: {
          id: crypto.randomUUID(), // Generate a unique ID
          text: text,
          isCompleted: false,
        },
        schema: {}, // No schema needed for TodoItem
      });

      this.todos.add(newTodo);
      this._newTodoText$.next('');
    }
  }

  private toggleTodo(todoId: string): void {
    const todo = this.todos.toArray().find((t) => t.id === todoId);
    if (todo) {
      todo.toggleCompletion();
      const items = this.todos.toArray();
      this.todos.setItems([...items]);
    }
  }

  public dispose(): void {
    super.dispose();
    this._newTodoText$.complete();
    this.todos.toArray().forEach((todo) => todo.dispose());
    this.addTodoCommand.dispose();
    this.toggleTodoCommand.dispose();
  }

  public get newTodoText(): string {
    return this._newTodoText$.value;
  }

  public setNewTodoText(text: string): void {
    this._newTodoText$.next(text);
  }
}
