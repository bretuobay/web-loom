import { TodoListViewModel } from 'mvvm-core';
import React, { useState, useEffect } from 'react';

interface AddTodoFormProps {
  viewModel: TodoListViewModel;
}

export const AddTodoForm: React.FC<AddTodoFormProps> = ({ viewModel }) => {
  const [inputText, setInputText] = useState(viewModel.newTodoText);
  const [canAddTodo, setCanAddTodo] = useState(false);

  useEffect(() => {
    const textSubscription = viewModel.newTodoText$.subscribe((text) => {
      setInputText(text);
    });

    const canExecuteSubscription = viewModel.addTodoCommand.canExecute$.subscribe((canExec) => {
      setCanAddTodo(canExec);
    });

    // Initialize canAddTodo with the current value from the BehaviorSubject
    // This is important because the BehaviorSubject emits its current value on subscription.
    // So, setCanAddTodo will be called with the initial state.

    return () => {
      textSubscription.unsubscribe();
      canExecuteSubscription.unsubscribe();
    };
  }, [viewModel]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    viewModel.setNewTodoText(event.target.value);
  };

  const handleAddClick = () => {
    viewModel.addTodoCommand.execute();
  };

  return (
    <div>
      <input
        type="text"
        value={inputText}
        onChange={handleInputChange}
        placeholder="Enter new todo"
        style={{ marginRight: '10px', padding: '0.5rem', width: '75%' }}
      />
      <button onClick={handleAddClick} disabled={!canAddTodo}>
        Add Todo
      </button>
    </div>
  );
};
