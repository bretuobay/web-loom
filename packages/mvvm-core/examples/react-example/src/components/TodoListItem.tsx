import React, { useState, useEffect } from 'react';
import { TodoListViewModel, TodoItem, TodoItemData } from 'mvvm-core';

interface TodoListItemProps {
  todo: TodoItem;
  viewModel: TodoListViewModel;
}

export const TodoListItem: React.FC<TodoListItemProps> = ({ todo, viewModel }) => {
  const [itemData, setItemData] = useState<TodoItemData | null>(null);

  useEffect(() => {
    const dataSubscription = todo.data$.subscribe((data) => {
      setItemData(data);
    });

    return () => {
      dataSubscription.unsubscribe();
    };
  }, [todo]);

  const handleToggle = () => {
    if (itemData) {
      viewModel.toggleTodoCommand.execute(itemData.id);
    }
  };

  if (!itemData) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        margin: '1em',
        padding: '0.5em 0',
        borderBottom: '1px solid #eee',
        borderRadius: '4px',
      }}
    >
      <input type="checkbox" checked={itemData.isCompleted} onChange={handleToggle} style={{ marginRight: '10px' }} />
      <span
        style={{
          textDecoration: itemData.isCompleted ? 'line-through' : 'none',
          color: itemData.isCompleted ? '#aaa' : '#213547',
        }}
      >
        {itemData.text}
      </span>
    </div>
  );
};
