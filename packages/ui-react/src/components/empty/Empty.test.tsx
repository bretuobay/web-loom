import React from 'react';
import { render, screen } from '@testing-library/react';
import { Empty } from './Empty';
import { Button } from '../button/Button';

describe('Empty', () => {
  it('renders default illustration and description', () => {
    render(<Empty />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('No Data')).toBeInTheDocument();
  });

  it('renders custom description', () => {
    render(<Empty description="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('renders custom image', () => {
    render(<Empty image={<img src="test.png" alt="custom" />} />);
    expect(screen.getByAltText('custom')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(
      <Empty>
        <Button>Action</Button>
      </Empty>,
    );
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });
});
