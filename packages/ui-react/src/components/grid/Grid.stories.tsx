/**
 * Grid System Stories (Row & Col)
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Row } from './Row';
import { Col } from './Col';

const meta: Meta = {
  title: 'Layout/Grid',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

// Demo box style
const DemoBox = ({
  children,
  bg = '#1677ff',
  style,
}: {
  children?: React.ReactNode;
  bg?: string;
  style?: React.CSSProperties;
}) => (
  <div
    style={{
      backgroundColor: bg,
      color: 'white',
      padding: '16px',
      textAlign: 'center',
      borderRadius: '4px',
      ...style,
    }}
  >
    {children}
  </div>
);

// Basic grid
export const BasicGrid: StoryObj = {
  render: () => (
    <div>
      <Row>
        <Col span={24}>
          <DemoBox>col-24</DemoBox>
        </Col>
      </Row>
      <br />
      <Row>
        <Col span={12}>
          <DemoBox>col-12</DemoBox>
        </Col>
        <Col span={12}>
          <DemoBox bg="#52c41a">col-12</DemoBox>
        </Col>
      </Row>
      <br />
      <Row>
        <Col span={8}>
          <DemoBox>col-8</DemoBox>
        </Col>
        <Col span={8}>
          <DemoBox bg="#52c41a">col-8</DemoBox>
        </Col>
        <Col span={8}>
          <DemoBox bg="#faad14">col-8</DemoBox>
        </Col>
      </Row>
      <br />
      <Row>
        <Col span={6}>
          <DemoBox>col-6</DemoBox>
        </Col>
        <Col span={6}>
          <DemoBox bg="#52c41a">col-6</DemoBox>
        </Col>
        <Col span={6}>
          <DemoBox bg="#faad14">col-6</DemoBox>
        </Col>
        <Col span={6}>
          <DemoBox bg="#ff4d4f">col-6</DemoBox>
        </Col>
      </Row>
    </div>
  ),
};

// Gutter
export const Gutter: StoryObj = {
  render: () => (
    <div>
      <h4>Horizontal Gutter: 16px</h4>
      <Row gutter={16}>
        <Col span={6}>
          <DemoBox>col-6</DemoBox>
        </Col>
        <Col span={6}>
          <DemoBox>col-6</DemoBox>
        </Col>
        <Col span={6}>
          <DemoBox>col-6</DemoBox>
        </Col>
        <Col span={6}>
          <DemoBox>col-6</DemoBox>
        </Col>
      </Row>
      <br />
      <h4>Horizontal & Vertical Gutter: [16, 16]</h4>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <DemoBox>col-6</DemoBox>
        </Col>
        <Col span={6}>
          <DemoBox>col-6</DemoBox>
        </Col>
        <Col span={6}>
          <DemoBox>col-6</DemoBox>
        </Col>
        <Col span={6}>
          <DemoBox>col-6</DemoBox>
        </Col>
        <Col span={6}>
          <DemoBox>col-6</DemoBox>
        </Col>
        <Col span={6}>
          <DemoBox>col-6</DemoBox>
        </Col>
        <Col span={6}>
          <DemoBox>col-6</DemoBox>
        </Col>
        <Col span={6}>
          <DemoBox>col-6</DemoBox>
        </Col>
      </Row>
    </div>
  ),
};

// Offset
export const Offset: StoryObj = {
  render: () => (
    <div>
      <Row>
        <Col span={8}>
          <DemoBox>col-8</DemoBox>
        </Col>
        <Col span={8} offset={8}>
          <DemoBox bg="#52c41a">col-8 offset-8</DemoBox>
        </Col>
      </Row>
      <br />
      <Row>
        <Col span={6} offset={6}>
          <DemoBox>col-6 offset-6</DemoBox>
        </Col>
        <Col span={6} offset={6}>
          <DemoBox bg="#52c41a">col-6 offset-6</DemoBox>
        </Col>
      </Row>
      <br />
      <Row>
        <Col span={12} offset={6}>
          <DemoBox>col-12 offset-6</DemoBox>
        </Col>
      </Row>
    </div>
  ),
};

// Responsive
export const Responsive: StoryObj = {
  render: () => (
    <div>
      <p>Resize your browser to see responsive behavior</p>
      <Row gutter={16}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <DemoBox>xs=24 sm=12 md=8 lg=6</DemoBox>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <DemoBox>xs=24 sm=12 md=8 lg=6</DemoBox>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <DemoBox>xs=24 sm=12 md=8 lg=6</DemoBox>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <DemoBox>xs=24 sm=12 md=8 lg=6</DemoBox>
        </Col>
      </Row>
    </div>
  ),
};

// Justify
export const Justify: StoryObj = {
  render: () => (
    <div>
      <p>start</p>
      <Row justify="start">
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
      </Row>
      <br />
      <p>center</p>
      <Row justify="center">
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
      </Row>
      <br />
      <p>end</p>
      <Row justify="end">
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
      </Row>
      <br />
      <p>space-between</p>
      <Row justify="space-between">
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
      </Row>
      <br />
      <p>space-around</p>
      <Row justify="space-around">
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
      </Row>
    </div>
  ),
};

// Align
export const Align: StoryObj = {
  render: () => (
    <div>
      <p>top</p>
      <Row align="top" style={{ minHeight: '100px', backgroundColor: '#f5f5f5' }}>
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
        <Col span={4}>
          <DemoBox style={{ padding: '32px 16px' }}>col-4</DemoBox>
        </Col>
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
      </Row>
      <br />
      <p>middle</p>
      <Row align="middle" style={{ minHeight: '100px', backgroundColor: '#f5f5f5' }}>
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
        <Col span={4}>
          <DemoBox style={{ padding: '32px 16px' }}>col-4</DemoBox>
        </Col>
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
      </Row>
      <br />
      <p>bottom</p>
      <Row align="bottom" style={{ minHeight: '100px', backgroundColor: '#f5f5f5' }}>
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
        <Col span={4}>
          <DemoBox style={{ padding: '32px 16px' }}>col-4</DemoBox>
        </Col>
        <Col span={4}>
          <DemoBox>col-4</DemoBox>
        </Col>
      </Row>
    </div>
  ),
};

// Nested Grids
export const NestedGrids: StoryObj = {
  render: () => (
    <div>
      <Row gutter={16}>
        <Col span={12}>
          <DemoBox bg="#722ed1">
            Level 1
            <br />
            <br />
            <Row gutter={8}>
              <Col span={8}>
                <DemoBox bg="#52c41a">Level 2</DemoBox>
              </Col>
              <Col span={8}>
                <DemoBox bg="#faad14">Level 2</DemoBox>
              </Col>
              <Col span={8}>
                <DemoBox bg="#ff4d4f">Level 2</DemoBox>
              </Col>
            </Row>
          </DemoBox>
        </Col>
        <Col span={12}>
          <DemoBox bg="#722ed1">
            Level 1
            <br />
            <br />
            <Row gutter={8}>
              <Col span={12}>
                <DemoBox bg="#52c41a">Level 2</DemoBox>
              </Col>
              <Col span={12}>
                <DemoBox bg="#faad14">Level 2</DemoBox>
              </Col>
            </Row>
          </DemoBox>
        </Col>
      </Row>
    </div>
  ),
};

// Responsive Object Syntax
export const ResponsiveObjects: StoryObj = {
  render: () => (
    <div>
      <p>Using object syntax for responsive props with span and offset</p>
      <Row gutter={16}>
        <Col xs={{ span: 24 }} sm={{ span: 12, offset: 0 }} md={{ span: 8, offset: 2 }} lg={{ span: 6, offset: 3 }}>
          <DemoBox>Responsive with objects</DemoBox>
        </Col>
        <Col xs={{ span: 24 }} sm={{ span: 12, offset: 0 }} md={{ span: 8, offset: 2 }} lg={{ span: 6, offset: 3 }}>
          <DemoBox>Responsive with objects</DemoBox>
        </Col>
        <Col xs={{ span: 24 }} sm={{ span: 12, offset: 0 }} md={{ span: 8, offset: 0 }} lg={{ span: 6, offset: 0 }}>
          <DemoBox>Responsive with objects</DemoBox>
        </Col>
      </Row>
    </div>
  ),
};

// Order
export const Order: StoryObj = {
  render: () => (
    <div>
      <p>Custom column ordering</p>
      <Row>
        <Col span={6} order={4}>
          <DemoBox>1st col, order-4</DemoBox>
        </Col>
        <Col span={6} order={3}>
          <DemoBox bg="#52c41a">2nd col, order-3</DemoBox>
        </Col>
        <Col span={6} order={2}>
          <DemoBox bg="#faad14">3rd col, order-2</DemoBox>
        </Col>
        <Col span={6} order={1}>
          <DemoBox bg="#ff4d4f">4th col, order-1</DemoBox>
        </Col>
      </Row>
    </div>
  ),
};

// All Breakpoints Demo
export const AllBreakpoints: StoryObj = {
  render: () => (
    <div>
      <p>
        Comprehensive breakpoints example (xs &lt; 576px, sm ≥ 576px, md ≥ 768px, lg ≥ 992px, xl ≥ 1200px, xxl ≥ 1600px)
      </p>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6} xl={4} xxl={3}>
          <DemoBox>All breakpoints</DemoBox>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={4} xxl={3}>
          <DemoBox>All breakpoints</DemoBox>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={4} xxl={3}>
          <DemoBox>All breakpoints</DemoBox>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={4} xxl={3}>
          <DemoBox>All breakpoints</DemoBox>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={4} xxl={3}>
          <DemoBox>All breakpoints</DemoBox>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={4} xxl={3}>
          <DemoBox>All breakpoints</DemoBox>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={4} xxl={3}>
          <DemoBox>All breakpoints</DemoBox>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6} xl={4} xxl={3}>
          <DemoBox>All breakpoints</DemoBox>
        </Col>
      </Row>
    </div>
  ),
};
