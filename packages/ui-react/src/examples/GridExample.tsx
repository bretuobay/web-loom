/**
 * Grid Example Component
 *
 * This demonstrates basic usage of the Grid system
 */

import { Row, Col } from '../components/grid';

export function GridExample() {
  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <h2>Grid System Examples</h2>

      {/* Basic Grid */}
      <h3>Basic Grid</h3>
      <Row gutter={16}>
        <Col span={8}>
          <div
            style={{
              backgroundColor: '#1677ff',
              color: 'white',
              padding: '16px',
              textAlign: 'center',
              borderRadius: '4px',
            }}
          >
            col-8
          </div>
        </Col>
        <Col span={8}>
          <div
            style={{
              backgroundColor: '#52c41a',
              color: 'white',
              padding: '16px',
              textAlign: 'center',
              borderRadius: '4px',
            }}
          >
            col-8
          </div>
        </Col>
        <Col span={8}>
          <div
            style={{
              backgroundColor: '#faad14',
              color: 'white',
              padding: '16px',
              textAlign: 'center',
              borderRadius: '4px',
            }}
          >
            col-8
          </div>
        </Col>
      </Row>

      {/* Responsive Grid */}
      <h3>Responsive Grid</h3>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <div
            style={{
              backgroundColor: '#722ed1',
              color: 'white',
              padding: '16px',
              textAlign: 'center',
              borderRadius: '4px',
            }}
          >
            Responsive
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <div
            style={{
              backgroundColor: '#eb2f96',
              color: 'white',
              padding: '16px',
              textAlign: 'center',
              borderRadius: '4px',
            }}
          >
            Responsive
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <div
            style={{
              backgroundColor: '#13c2c2',
              color: 'white',
              padding: '16px',
              textAlign: 'center',
              borderRadius: '4px',
            }}
          >
            Responsive
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <div
            style={{
              backgroundColor: '#fa8c16',
              color: 'white',
              padding: '16px',
              textAlign: 'center',
              borderRadius: '4px',
            }}
          >
            Responsive
          </div>
        </Col>
      </Row>

      {/* Offset Grid */}
      <h3>Offset Grid</h3>
      <Row>
        <Col span={8} offset={8}>
          <div
            style={{
              backgroundColor: '#f5222d',
              color: 'white',
              padding: '16px',
              textAlign: 'center',
              borderRadius: '4px',
            }}
          >
            col-8 offset-8
          </div>
        </Col>
      </Row>
    </div>
  );
}
