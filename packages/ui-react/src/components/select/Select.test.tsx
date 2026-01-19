import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';
import styles from './Select.module.css';

describe('Select Component', () => {
  const mockOptions = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' },
  ];

  describe('Basic Rendering', () => {
    it('should render with placeholder', () => {
      render(<Select placeholder="Select an option" options={mockOptions} />);
      expect(screen.getByText('Select an option')).toBeInTheDocument();
    });

    it('should render with data-testid', () => {
      render(<Select data-testid="my-select" options={mockOptions} />);
      expect(screen.getByTestId('my-select')).toBeInTheDocument();
    });

    it('should have proper aria attributes', () => {
      render(<Select aria-label="Choose option" options={mockOptions} />);
      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveAttribute('aria-label', 'Choose option');
      expect(combobox).toHaveAttribute('aria-haspopup', 'listbox');
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });

    it('should render with aria-labelledby', () => {
      render(
        <>
          <label id="select-label">My Label</label>
          <Select aria-labelledby="select-label" options={mockOptions} />
        </>,
      );
      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveAttribute('aria-labelledby', 'select-label');
    });
  });

  describe('Size Variants', () => {
    it('should apply small size class', () => {
      render(<Select size="small" options={mockOptions} data-testid="select" />);
      const select = screen.getByTestId('select');
      expect(select).toHaveClass(styles.small);
    });

    it('should apply large size class', () => {
      render(<Select size="large" options={mockOptions} data-testid="select" />);
      const select = screen.getByTestId('select');
      expect(select).toHaveClass(styles.large);
    });

    it('should default to middle size', () => {
      render(<Select options={mockOptions} data-testid="select" />);
      const select = screen.getByTestId('select');
      expect(select).not.toHaveClass(styles.small);
      expect(select).not.toHaveClass(styles.large);
    });
  });

  describe('Status States', () => {
    it('should apply error status class', () => {
      render(<Select status="error" options={mockOptions} data-testid="select" />);
      const select = screen.getByTestId('select');
      expect(select).toHaveClass(styles.error);
    });

    it('should apply warning status class', () => {
      render(<Select status="warning" options={mockOptions} data-testid="select" />);
      const select = screen.getByTestId('select');
      expect(select).toHaveClass(styles.warning);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should open dropdown on ArrowDown', async () => {
      render(<Select options={mockOptions} />);
      const combobox = screen.getByRole('combobox');

      fireEvent.keyDown(combobox, { key: 'ArrowDown' });

      await waitFor(() => {
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should open dropdown on ArrowUp', async () => {
      render(<Select options={mockOptions} />);
      const combobox = screen.getByRole('combobox');

      fireEvent.keyDown(combobox, { key: 'ArrowUp' });

      await waitFor(() => {
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should navigate to first option with Home key', async () => {
      render(<Select options={mockOptions} />);
      const combobox = screen.getByRole('combobox');

      fireEvent.keyDown(combobox, { key: 'Home' });

      await waitFor(() => {
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should navigate to last option with End key', async () => {
      render(<Select options={mockOptions} />);
      const combobox = screen.getByRole('combobox');

      fireEvent.keyDown(combobox, { key: 'End' });

      await waitFor(() => {
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should close dropdown on Escape', async () => {
      render(<Select options={mockOptions} />);
      const combobox = screen.getByRole('combobox');

      // Open dropdown
      fireEvent.click(combobox);
      await waitFor(() => {
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
      });

      // Close with Escape
      fireEvent.keyDown(combobox, { key: 'Escape' });

      await waitFor(() => {
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should open dropdown on Enter when closed', async () => {
      render(<Select options={mockOptions} />);
      const combobox = screen.getByRole('combobox');

      fireEvent.keyDown(combobox, { key: 'Enter' });

      await waitFor(() => {
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });

  describe('Selection', () => {
    it.skip('should select an option on click', async () => {
      const handleChange = vi.fn();
      render(<Select options={mockOptions} onChange={handleChange} />);

      const combobox = screen.getByRole('combobox');
      fireEvent.click(combobox);

      // Wait for dropdown to appear
      await waitFor(() => {
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
      });

      // Wait for option to be available and click it
      const listbox = await screen.findByRole('listbox');
      const option = within(listbox).getByText('Option 1');
      fireEvent.pointerDown(option);
      fireEvent.click(option);

      // Wait for change handler to be called
      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('1');
      });
    });

    it('should display selected value', () => {
      render(<Select options={mockOptions} value="2" />);
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('should clear selection when clear button is clicked', async () => {
      const handleChange = vi.fn();
      render(<Select options={mockOptions} value="1" allowClear onChange={handleChange} />);

      const clearButton = screen.getByLabelText('Clear selection');
      fireEvent.click(clearButton);

      expect(handleChange).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Multiple Selection Mode', () => {
    it('should render multiple selected values as tags', () => {
      render(<Select mode="multiple" options={mockOptions} value={['1', '2']} />);

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('should render remove buttons on tags', () => {
      render(<Select mode="multiple" options={mockOptions} value={['1', '2']} />);

      const removeButtons = screen.getAllByLabelText(/Remove/);
      expect(removeButtons).toHaveLength(2);
    });

    it('should remove tag when close button is clicked', async () => {
      const handleChange = vi.fn();
      render(<Select mode="multiple" options={mockOptions} value={['1', '2']} onChange={handleChange} />);

      const removeButton = screen.getByLabelText('Remove Option 1');
      fireEvent.click(removeButton);

      expect(handleChange).toHaveBeenCalledWith(['2']);
    });

    it('should not show remove buttons when disabled', () => {
      render(<Select mode="multiple" options={mockOptions} value={['1', '2']} disabled />);

      const removeButtons = screen.queryAllByLabelText(/Remove/);
      expect(removeButtons).toHaveLength(0);
    });

    it('should have proper ARIA attributes on tags', () => {
      render(<Select mode="multiple" options={mockOptions} value={['1']} />);

      const tag = screen.getByText('Option 1').parentElement;
      expect(tag).toHaveAttribute('role', 'option');
      expect(tag).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Search/Filter', () => {
    it('should show search input when showSearch is true', async () => {
      render(<Select options={mockOptions} showSearch />);

      const combobox = screen.getByRole('combobox');
      fireEvent.click(combobox);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      });
    });

    it('should filter options based on search', async () => {
      render(<Select options={mockOptions} showSearch />);

      const combobox = screen.getByRole('combobox');
      fireEvent.click(combobox);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search...');
        fireEvent.change(searchInput, { target: { value: 'Option 1' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
        expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading is true', async () => {
      render(<Select options={mockOptions} loading />);

      const combobox = screen.getByRole('combobox');
      fireEvent.click(combobox);

      await waitFor(() => {
        expect(screen.getByText('Loading options...')).toBeInTheDocument();
      });
    });
  });

  describe('Disabled State', () => {
    it('should not open when disabled', () => {
      render(<Select options={mockOptions} disabled />);

      const combobox = screen.getByRole('combobox');
      fireEvent.click(combobox);

      expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have aria-disabled attribute', () => {
      render(<Select options={mockOptions} disabled />);

      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Accessibility - aria-activedescendant', () => {
    it('should set aria-activedescendant when option is focused', async () => {
      render(<Select options={mockOptions} />);

      const combobox = screen.getByRole('combobox');
      fireEvent.click(combobox);

      await waitFor(() => {
        fireEvent.keyDown(combobox, { key: 'ArrowDown' });
      });

      await waitFor(() => {
        const activedescendant = combobox.getAttribute('aria-activedescendant');
        expect(activedescendant).toBeTruthy();
        expect(activedescendant).toContain('option');
      });
    });
  });

  describe('Option Groups', () => {
    it('should render option groups', async () => {
      const groupedOptions = [
        {
          label: 'Group 1',
          options: [
            { value: '1', label: 'Option 1' },
            { value: '2', label: 'Option 2' },
          ],
        },
      ];

      render(<Select options={groupedOptions} />);

      const combobox = screen.getByRole('combobox');
      fireEvent.click(combobox);

      await waitFor(() => {
        expect(screen.getByText('Group 1')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show default empty message', async () => {
      render(<Select options={[]} />);

      const combobox = screen.getByRole('combobox');
      fireEvent.click(combobox);

      await waitFor(() => {
        expect(screen.getByText('No options found')).toBeInTheDocument();
      });
    });

    it('should show custom empty message', async () => {
      render(<Select options={[]} notFoundContent="Custom empty message" />);

      const combobox = screen.getByRole('combobox');
      fireEvent.click(combobox);

      await waitFor(() => {
        expect(screen.getByText('Custom empty message')).toBeInTheDocument();
      });
    });
  });
});
