import React, { useState, useEffect } from 'react';
import { TodoListViewModel, TodoItem } from 'mvvm-core';
import { TodoListItem } from './TodoListItem';

interface TodoListProps {
  viewModel: TodoListViewModel;
}

export const TodoList: React.FC<TodoListProps> = ({ viewModel }) => {
  const [todos, setTodos] = useState<TodoItem[]>(viewModel.todos.toArray());

  useEffect(() => {
    const todosSubscription = viewModel.todos.items$.subscribe((updatedTodos) => {
      setTodos(updatedTodos);
    });

    return () => {
      todosSubscription.unsubscribe();
    };
  }, [viewModel]);

  return (
    <div>
      {todos.map((todo) => (
        <TodoListItem key={todo.id} todo={todo} viewModel={viewModel} />
      ))}
    </div>
  );
};
