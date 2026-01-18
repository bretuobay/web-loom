/**
 * Layout Component Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Layout } from './index';

const meta: Meta = {
  title: 'Layout/Layout',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

// Basic Layout
export const Basic: StoryObj = {
  render: () => (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header style={{ backgroundColor: '#1677ff', color: 'white' }}>Header</Layout.Header>
      <Layout.Content>Content</Layout.Content>
      <Layout.Footer>Footer</Layout.Footer>
    </Layout>
  ),
};

// With Sider
export const WithSider: StoryObj = {
  render: () => (
    <Layout>
      <Layout.Header style={{ backgroundColor: '#1677ff', color: 'white' }}>Header</Layout.Header>
      <Layout>
        <Layout.Sider>
          <div style={{ padding: '16px', color: '#000' }}>
            <h4>Navigation</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ padding: '8px 0' }}>Menu Item 1</li>
              <li style={{ padding: '8px 0' }}>Menu Item 2</li>
              <li style={{ padding: '8px 0' }}>Menu Item 3</li>
            </ul>
          </div>
        </Layout.Sider>
        <Layout.Content style={{ minHeight: '280px' }}>
          <div style={{ padding: '24px', background: '#fff' }}>Content</div>
        </Layout.Content>
      </Layout>
      <Layout.Footer>Footer</Layout.Footer>
    </Layout>
  ),
};

// Collapsible Sider
export const CollapsibleSider: StoryObj = {
  render: () => (
    <Layout>
      <Layout.Header style={{ backgroundColor: '#1677ff', color: 'white' }}>Header</Layout.Header>
      <Layout>
        <Layout.Sider collapsible width={250} collapsedWidth={80}>
          <div style={{ padding: '16px', color: '#000' }}>
            <h4>Sidebar</h4>
            <p>Click the trigger button below to collapse</p>
          </div>
        </Layout.Sider>
        <Layout.Content>
          <div style={{ padding: '24px', background: '#fff', minHeight: '400px' }}>
            <h2>Main Content</h2>
            <p>The sidebar can be collapsed using the trigger button.</p>
          </div>
        </Layout.Content>
      </Layout>
      <Layout.Footer>Footer © 2025</Layout.Footer>
    </Layout>
  ),
};

// No Footer
export const NoFooter: StoryObj = {
  render: () => (
    <Layout>
      <Layout.Header style={{ backgroundColor: '#52c41a', color: 'white' }}>Header</Layout.Header>
      <Layout.Content style={{ minHeight: '400px' }}>
        <div style={{ padding: '24px', background: '#fff' }}>
          <h2>Content without Footer</h2>
          <p>This layout doesn't include a footer section.</p>
        </div>
      </Layout.Content>
    </Layout>
  ),
};

// Nested Layout
export const NestedLayout: StoryObj = {
  render: () => (
    <Layout>
      <Layout.Header style={{ backgroundColor: '#1677ff', color: 'white' }}>App Header</Layout.Header>
      <Layout.Content>
        <Layout style={{ padding: '24px 0', background: '#fff' }}>
          <Layout.Header style={{ backgroundColor: '#f0f0f0' }}>Content Header</Layout.Header>
          <Layout.Content style={{ padding: '0 24px', minHeight: '280px' }}>Inner Content</Layout.Content>
          <Layout.Footer style={{ background: '#f0f0f0' }}>Content Footer</Layout.Footer>
        </Layout>
      </Layout.Content>
      <Layout.Footer>App Footer</Layout.Footer>
    </Layout>
  ),
};
