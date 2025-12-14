import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { List } from './List';

describe('List component', () => {
  it('renders provided data and exposes the list role', () => {
    render(<List dataSource={['Alpha', 'Beta']} />);
    const list = screen.getByRole('list');
    expect(list).toHaveTextContent('Alpha');
    expect(list).toHaveTextContent('Beta');
  });

  it('shows loading skeleton and spinner when loading is true', () => {
    render(<List loading />);
    const list = screen.getByRole('list');
    expect(list).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  it('invokes pagination callbacks and switches pages', () => {
    const handleChange = vi.fn();
    const items = Array.from({ length: 12 }, (_, idx) => `Item ${idx + 1}`);
    render(
      <List
        dataSource={items}
        pagination={{
          pageSize: 5,
          total: items.length,
          onChange: handleChange,
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /next page/i }));
    expect(handleChange).toHaveBeenCalledWith(2, 5);
    expect(screen.getByText('Item 6')).toBeInTheDocument();
  });

  it('List.Item supports keyboard navigation and actions slot', () => {
    const onClick = vi.fn();
    render(
      <List>
        <List.Item actions={[<button key="edit">Edit</button>]}
          onClick={onClick}
        >
          Clickable
        </List.Item>
      </List>
    );

    const action = screen.getByRole('button', { name: /edit/i });
    expect(action).toBeInTheDocument();

    const item = screen.getByText('Clickable').closest('li');
    expect(item).toBeInTheDocument();
    fireEvent.keyDown(item!, { key: 'Enter' });
    expect(onClick).toHaveBeenCalled();
  });
});
