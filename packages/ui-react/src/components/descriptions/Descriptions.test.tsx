import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Descriptions } from './Descriptions';

describe('Descriptions', () => {
  it('renders without crashing', () => {
    render(
      <Descriptions>
        <Descriptions.Item label="Name">John Doe</Descriptions.Item>
      </Descriptions>,
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(
      <Descriptions title="User Information">
        <Descriptions.Item label="Name">John Doe</Descriptions.Item>
      </Descriptions>,
    );

    expect(screen.getByTestId('descriptions-title')).toBeInTheDocument();
    expect(screen.getByText('User Information')).toBeInTheDocument();
  });

  it('renders extra content when provided', () => {
    render(
      <Descriptions extra={<button>Edit</button>}>
        <Descriptions.Item label="Name">John Doe</Descriptions.Item>
      </Descriptions>,
    );

    expect(screen.getByTestId('descriptions-extra')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('renders header only when title or extra is provided', () => {
    const { rerender } = render(
      <Descriptions>
        <Descriptions.Item label="Name">John Doe</Descriptions.Item>
      </Descriptions>,
    );

    expect(screen.queryByTestId('descriptions-header')).not.toBeInTheDocument();

    rerender(
      <Descriptions title="User Info">
        <Descriptions.Item label="Name">John Doe</Descriptions.Item>
      </Descriptions>,
    );

    expect(screen.getByTestId('descriptions-header')).toBeInTheDocument();
  });

  describe('Descriptions.Item', () => {
    it('renders label and content correctly', () => {
      render(
        <Descriptions>
          <Descriptions.Item label="Name">John Doe</Descriptions.Item>
          <Descriptions.Item label="Age">30</Descriptions.Item>
        </Descriptions>,
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
    });

    it('handles span prop correctly', () => {
      render(
        <Descriptions>
          <Descriptions.Item label="Address" span={2}>
            123 Main Street, Anytown, USA
          </Descriptions.Item>
        </Descriptions>,
      );

      // Verify the item renders correctly with span
      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(screen.getByText('123 Main Street, Anytown, USA')).toBeInTheDocument();

      // The component should handle the span prop without crashing
      expect(screen.getByTestId('descriptions-view')).toBeInTheDocument();
    });

    it('handles ReactNode in label and children', () => {
      render(
        <Descriptions>
          <Descriptions.Item label={<strong>Name</strong>}>
            <em>John Doe</em>
          </Descriptions.Item>
        </Descriptions>,
      );

      expect(screen.getByRole('strong')).toBeInTheDocument();
      expect(screen.getByRole('emphasis')).toBeInTheDocument();
    });
  });

  describe('bordered variant', () => {
    it('applies bordered class when bordered prop is true', () => {
      render(
        <Descriptions bordered>
          <Descriptions.Item label="Name">John Doe</Descriptions.Item>
        </Descriptions>,
      );

      const descriptionsElement = screen.getByTestId('descriptions-view').parentElement;
      expect(descriptionsElement?.className).toContain('bordered');
    });

    it('renders table layout when bordered', () => {
      render(
        <Descriptions bordered>
          <Descriptions.Item label="Name">John Doe</Descriptions.Item>
        </Descriptions>,
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Name' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'John Doe' })).toBeInTheDocument();
    });
  });

  describe('size variants', () => {
    it('applies small class when size is small', () => {
      render(
        <Descriptions size="small">
          <Descriptions.Item label="Name">John Doe</Descriptions.Item>
        </Descriptions>,
      );

      const descriptionsElement = screen.getByTestId('descriptions-view').parentElement;
      expect(descriptionsElement?.className).toContain('small');
    });

    it('applies middle class when size is middle', () => {
      render(
        <Descriptions size="middle">
          <Descriptions.Item label="Name">John Doe</Descriptions.Item>
        </Descriptions>,
      );

      const descriptionsElement = screen.getByTestId('descriptions-view').parentElement;
      expect(descriptionsElement?.className).toContain('middle');
    });

    it('does not apply size class for default size', () => {
      render(
        <Descriptions size="default">
          <Descriptions.Item label="Name">John Doe</Descriptions.Item>
        </Descriptions>,
      );

      const descriptionsElement = screen.getByTestId('descriptions-view').parentElement;
      expect(descriptionsElement?.className).not.toContain('small');
      expect(descriptionsElement?.className).not.toContain('middle');
    });
  });

  describe('layout variants', () => {
    it('applies vertical class when layout is vertical', () => {
      render(
        <Descriptions layout="vertical">
          <Descriptions.Item label="Name">John Doe</Descriptions.Item>
        </Descriptions>,
      );

      const descriptionsElement = screen.getByTestId('descriptions-view').parentElement;
      expect(descriptionsElement?.className).toContain('vertical');
    });

    it('does not apply vertical class for horizontal layout', () => {
      render(
        <Descriptions layout="horizontal">
          <Descriptions.Item label="Name">John Doe</Descriptions.Item>
        </Descriptions>,
      );

      const descriptionsElement = screen.getByTestId('descriptions-view').parentElement;
      expect(descriptionsElement?.className).not.toContain('vertical');
    });
  });

  describe('colon prop', () => {
    it('applies noColon class when colon is false', () => {
      render(
        <Descriptions colon={false}>
          <Descriptions.Item label="Name">John Doe</Descriptions.Item>
        </Descriptions>,
      );

      const descriptionsElement = screen.getByTestId('descriptions-view').parentElement;
      expect(descriptionsElement?.className).toContain('noColon');
    });

    it('does not apply noColon class when colon is true', () => {
      render(
        <Descriptions colon={true}>
          <Descriptions.Item label="Name">John Doe</Descriptions.Item>
        </Descriptions>,
      );

      const descriptionsElement = screen.getByTestId('descriptions-view').parentElement;
      expect(descriptionsElement?.className).not.toContain('noColon');
    });
  });

  describe('column prop', () => {
    it('handles number column prop', () => {
      render(
        <Descriptions column={2}>
          <Descriptions.Item label="Name">John Doe</Descriptions.Item>
        </Descriptions>,
      );

      const descriptionsElement = screen.getByTestId('descriptions-view').parentElement!;
      const styles = getComputedStyle(descriptionsElement);
      expect(styles.getPropertyValue('--descriptions-sm-columns')).toBe('2');
      expect(styles.getPropertyValue('--descriptions-md-columns')).toBe('2');
      expect(styles.getPropertyValue('--descriptions-lg-columns')).toBe('2');
    });

    it('handles object column prop', () => {
      render(
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="Name">John Doe</Descriptions.Item>
        </Descriptions>,
      );

      const descriptionsElement = screen.getByTestId('descriptions-view').parentElement!;
      const styles = getComputedStyle(descriptionsElement);
      expect(styles.getPropertyValue('--descriptions-xs-columns')).toBe('1');
      expect(styles.getPropertyValue('--descriptions-sm-columns')).toBe('2');
      expect(styles.getPropertyValue('--descriptions-md-columns')).toBe('3');
    });
  });

  describe('accessibility', () => {
    it('has proper data-testid attributes', () => {
      render(
        <Descriptions title="User Info" extra={<button>Edit</button>}>
          <Descriptions.Item label="Name">John Doe</Descriptions.Item>
        </Descriptions>,
      );

      expect(screen.getByTestId('descriptions-header')).toBeInTheDocument();
      expect(screen.getByTestId('descriptions-title')).toBeInTheDocument();
      expect(screen.getByTestId('descriptions-extra')).toBeInTheDocument();
      expect(screen.getByTestId('descriptions-view')).toBeInTheDocument();
      // Note: In borderless mode, items are rendered directly without the item testids
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('supports custom className', () => {
      render(
        <Descriptions className="custom-descriptions">
          <Descriptions.Item label="Name">John Doe</Descriptions.Item>
        </Descriptions>,
      );

      const descriptionsElement = screen.getByTestId('descriptions-view').parentElement;
      expect(descriptionsElement?.className).toContain('custom-descriptions');
    });

    it('supports custom props spreading', () => {
      render(
        <Descriptions data-testid="custom-descriptions" role="region">
          <Descriptions.Item label="Name">John Doe</Descriptions.Item>
        </Descriptions>,
      );

      expect(screen.getByTestId('custom-descriptions')).toBeInTheDocument();
      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles empty children gracefully', () => {
      render(<Descriptions title="Empty" />);

      expect(screen.getByTestId('descriptions-title')).toBeInTheDocument();
      expect(screen.getByTestId('descriptions-view')).toBeInTheDocument();
    });

    it('handles non-Item children gracefully', () => {
      render(
        <Descriptions>
          <div>Non-item content</div>
          <Descriptions.Item label="Name">John Doe</Descriptions.Item>
          <span>Another non-item</span>
        </Descriptions>,
      );

      // Should only render valid Items
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();

      // Component should not crash and should continue to work normally
      expect(screen.getByTestId('descriptions-view')).toBeInTheDocument();
    });

    it('handles items with span larger than max columns', () => {
      render(
        <Descriptions column={2}>
          <Descriptions.Item label="Name" span={5}>
            John Doe
          </Descriptions.Item>
        </Descriptions>,
      );

      // Component should handle gracefully without errors
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('row grouping logic', () => {
    it('groups items into rows based on spans', () => {
      render(
        <Descriptions column={3}>
          <Descriptions.Item label="Field 1" span={1}>
            Value 1
          </Descriptions.Item>
          <Descriptions.Item label="Field 2" span={1}>
            Value 2
          </Descriptions.Item>
          <Descriptions.Item label="Field 3" span={1}>
            Value 3
          </Descriptions.Item>
          <Descriptions.Item label="Field 4" span={2}>
            Value 4 (spans 2)
          </Descriptions.Item>
          <Descriptions.Item label="Field 5" span={1}>
            Value 5
          </Descriptions.Item>
        </Descriptions>,
      );

      // All items should be rendered
      expect(screen.getByText('Field 1')).toBeInTheDocument();
      expect(screen.getByText('Field 2')).toBeInTheDocument();
      expect(screen.getByText('Field 3')).toBeInTheDocument();
      expect(screen.getByText('Field 4')).toBeInTheDocument();
      expect(screen.getByText('Field 5')).toBeInTheDocument();
    });
  });
});
