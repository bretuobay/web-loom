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
