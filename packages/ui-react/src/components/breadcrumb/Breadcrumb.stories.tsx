import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumb } from './Breadcrumb';

const meta: Meta = {
  title: 'Navigation/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    layout: 'padded',
  },
};
export default meta;

export const Basic: StoryObj = {
  render: () => (
    <Breadcrumb>
      <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
      <Breadcrumb.Item href="/section">Section</Breadcrumb.Item>
      <Breadcrumb.Item>Current Page</Breadcrumb.Item>
    </Breadcrumb>
  ),
};

export const CustomSeparator: StoryObj = {
  render: () => (
    <Breadcrumb separator="·">
      <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
      <Breadcrumb.Item href="/section">Section</Breadcrumb.Item>
      <Breadcrumb.Item>Current Page</Breadcrumb.Item>
    </Breadcrumb>
  ),
};

export const RouteBased: StoryObj = {
  render: () => (
    <Breadcrumb
      routes={[
        { path: '/', breadcrumbName: 'Home' },
        { path: '/section', breadcrumbName: 'Section' },
        { path: '/section/current', breadcrumbName: 'Current Page' },
      ]}
    />
  ),
};

export const AriaCurrent: StoryObj = {
  render: () => (
    <Breadcrumb>
      <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
      <Breadcrumb.Item href="/section">Section</Breadcrumb.Item>
      <Breadcrumb.Item isCurrent>Current Page</Breadcrumb.Item>
    </Breadcrumb>
  ),
};
