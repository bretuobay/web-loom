import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Select } from './Select';

const meta: Meta<typeof Select> = {
  title: 'Data Entry/Select',
  component: Select,
};

export default meta;
type Story = StoryObj<typeof Select>;

const basicOptions = [
  { label: 'Orange', value: 'orange' },
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
];

export const Basic: Story = {
  render: () => {
    const [value, setValue] = useState<string | undefined>('orange');
    return (
      <Select
        value={value}
        onChange={(next) => setValue(typeof next === 'string' ? next : undefined)}
        options={basicOptions}
        notFoundContent="No fruits"
      />
    );
  },
};

export const MultiSelect: Story = {
  render: () => {
    const [values, setValues] = useState<string[]>(['apple']);
    return (
      <Select
        mode="multiple"
        value={values}
        onChange={(next) =>
          setValues(Array.isArray(next) ? next : typeof next === 'string' ? [next] : [])
        }
        options={basicOptions}
        allowClear
      />
    );
  },
};

export const Searchable: Story = {
  render: () => {
    const [value, setValue] = useState<string | undefined>();
    const manyOptions = useMemo(
      () =>
        Array.from({ length: 120 }, (_, index) => ({
          label: `Option ${index + 1}`,
          value: `option-${index + 1}`,
        })),
      []
    );

    return (
      <Select
        showSearch
        value={value}
        onChange={(next) => setValue(typeof next === 'string' ? next : undefined)}
        options={manyOptions}
        placeholder="Pick something"
      />
    );
  },
};

export const GroupedOptions: Story = {
  render: () => {
    const [value, setValue] = useState<string | undefined>('grapefruit');
    return (
      <Select value={value} onChange={(next) => setValue(typeof next === 'string' ? next : undefined)}>
        <Select.OptGroup label="Citrus">
          <Select.Option value="orange">Orange</Select.Option>
          <Select.Option value="grapefruit">Grapefruit</Select.Option>
        </Select.OptGroup>
        <Select.OptGroup label="Berries">
          <Select.Option value="strawberry">Strawberry</Select.Option>
          <Select.Option value="blueberry">Blueberry</Select.Option>
        </Select.OptGroup>
      </Select>
    );
  },
};

export const Loading: Story = {
  render: () => (
    <Select
      loading
      options={basicOptions}
      placeholder="Loading options"
      notFoundContent="Still loading"
    />
  ),
};

export const SizeVariants: Story = {
  render: () => {
    const [smallValue, setSmallValue] = useState<string | undefined>('apple');
    const [middleValue, setMiddleValue] = useState<string | undefined>('banana');
    const [largeValue, setLargeValue] = useState<string | undefined>('orange');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
            Small Size
          </label>
          <Select
            size="small"
            value={smallValue}
            onChange={(next) => setSmallValue(typeof next === 'string' ? next : undefined)}
            options={basicOptions}
            placeholder="Small select"
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
            Middle Size (Default)
          </label>
          <Select
            size="middle"
            value={middleValue}
            onChange={(next) => setMiddleValue(typeof next === 'string' ? next : undefined)}
            options={basicOptions}
            placeholder="Middle select"
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
            Large Size
          </label>
          <Select
            size="large"
            value={largeValue}
            onChange={(next) => setLargeValue(typeof next === 'string' ? next : undefined)}
            options={basicOptions}
            placeholder="Large select"
          />
        </div>
      </div>
    );
  },
};

export const StatusStates: Story = {
  render: () => {
    const [errorValue, setErrorValue] = useState<string | undefined>();
    const [warningValue, setWarningValue] = useState<string | undefined>('banana');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
            Error Status
          </label>
          <Select
            status="error"
            value={errorValue}
            onChange={(next) => setErrorValue(typeof next === 'string' ? next : undefined)}
            options={basicOptions}
            placeholder="This field has an error"
            allowClear
          />
          <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#ff4d4f' }}>
            Please select a value
          </span>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
            Warning Status
          </label>
          <Select
            status="warning"
            value={warningValue}
            onChange={(next) => setWarningValue(typeof next === 'string' ? next : undefined)}
            options={basicOptions}
            placeholder="This field has a warning"
            allowClear
          />
          <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#faad14' }}>
            This option may not be available in all regions
          </span>
        </div>
      </div>
    );
  },
};

export const MultipleWithTagRemoval: Story = {
  render: () => {
    const [values, setValues] = useState<string[]>(['apple', 'orange', 'banana']);

    return (
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
          Multiple Selection with Tag Removal
        </label>
        <Select
          mode="multiple"
          value={values}
          onChange={(next) =>
            setValues(Array.isArray(next) ? next : typeof next === 'string' ? [next] : [])
          }
          options={basicOptions}
          placeholder="Select fruits"
          allowClear
        />
        <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
          Click the × button on tags to remove individual items, or use the clear button to remove all
        </p>
      </div>
    );
  },
};

export const AccessibilityDemo: Story = {
  render: () => {
    const [value, setValue] = useState<string | undefined>();

    return (
      <div>
        <label id="fruit-label" style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
          Choose Your Favorite Fruit
        </label>
        <Select
          value={value}
          onChange={(next) => setValue(typeof next === 'string' ? next : undefined)}
          options={basicOptions}
          placeholder="Select a fruit"
          aria-labelledby="fruit-label"
          data-testid="fruit-select"
        />
        <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px' }}>
            Keyboard Navigation:
          </p>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px' }}>
            <li><kbd>Enter</kbd> - Open/close dropdown</li>
            <li><kbd>↑</kbd> / <kbd>↓</kbd> - Navigate options</li>
            <li><kbd>Home</kbd> - Jump to first option</li>
            <li><kbd>End</kbd> - Jump to last option</li>
            <li><kbd>Escape</kbd> - Close dropdown and clear search</li>
            <li><kbd>Enter</kbd> (when open) - Select highlighted option</li>
          </ul>
        </div>
      </div>
    );
  },
};

export const TagsMode: Story = {
  render: () => {
    const [tags, setTags] = useState<string[]>(['apple']);

    return (
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
          Tags Mode - Create Custom Tags
        </label>
        <Select
          mode="tags"
          value={tags}
          onChange={(next) =>
            setTags(Array.isArray(next) ? next : typeof next === 'string' ? [next] : [])
          }
          options={basicOptions}
          placeholder="Type to create new tags or select existing"
          allowClear
        />
        <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
          Type a new value and press Enter to create a custom tag
        </p>
      </div>
    );
  },
};

export const DisabledState: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
          Disabled (No Selection)
        </label>
        <Select
          disabled
          options={basicOptions}
          placeholder="Disabled select"
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
          Disabled (With Selection)
        </label>
        <Select
          disabled
          value="apple"
          options={basicOptions}
          placeholder="Disabled select"
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
          Disabled Multiple (With Tags)
        </label>
        <Select
          disabled
          mode="multiple"
          value={['apple', 'orange']}
          options={basicOptions}
          placeholder="Disabled multiple select"
        />
      </div>
    </div>
  ),
};

export const CustomFiltering: Story = {
  render: () => {
    const [value, setValue] = useState<string | undefined>();
    const options = [
      { label: 'JavaScript', value: 'js', title: 'Frontend scripting language' },
      { label: 'TypeScript', value: 'ts', title: 'Typed JavaScript superset' },
      { label: 'Python', value: 'py', title: 'General purpose language' },
      { label: 'Java', value: 'java', title: 'Object-oriented language' },
    ];

    return (
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
          Search by Name or Description
        </label>
        <Select
          showSearch
          value={value}
          onChange={(next) => setValue(typeof next === 'string' ? next : undefined)}
          options={options}
          placeholder="Search programming languages"
          filterOption={(input, option) => {
            const searchText = input.toLowerCase();
            const label = typeof option.label === 'string' ? option.label.toLowerCase() : '';
            const title = option.title?.toLowerCase() || '';
            return label.includes(searchText) || title.includes(searchText);
          }}
        />
        <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
          Try searching for "script" or "typed" to see filtering in action
        </p>
      </div>
    );
  },
};
