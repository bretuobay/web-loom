import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Avatar, AvatarGroup } from './Avatar';

describe('Avatar', () => {
  it('renders initials for text children', () => {
    render(<Avatar>Jane Doe</Avatar>);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders provided icon when no image source is available', () => {
    const Icon = () => <svg data-testid="icon" />;
    render(<Avatar icon={<Icon />} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders an image when src is provided', () => {
    render(<Avatar src="https://example.com/avatar.png" alt="Profile" />);
    expect(screen.getByAltText('Profile')).toBeInTheDocument();
  });

  it('falls back to initials when the image fails to load', () => {
    render(
      <Avatar src="broken.png" alt="Profile" draggable>
        Name
      </Avatar>,
    );
    const image = screen.getByAltText('Profile');
    fireEvent.error(image);
    expect(screen.queryByAltText('Profile')).not.toBeInTheDocument();
    expect(screen.getByText('NA')).toBeInTheDocument();
  });

  it('respects onError returning false and keeps the broken image', () => {
    const handleError = vi.fn(() => false);
    render(
      <Avatar src="broken.png" alt="Profile" onError={handleError}>
        Name
      </Avatar>,
    );
    const image = screen.getByAltText('Profile');
    fireEvent.error(image);
    expect(handleError).toHaveBeenCalled();
    expect(screen.getByAltText('Profile')).toBeInTheDocument();
    expect(screen.queryByText('NA')).not.toBeInTheDocument();
  });
});

describe('AvatarGroup', () => {
  it('renders a label and overflow indicator when maxCount is exceeded', () => {
    render(
      <AvatarGroup maxCount={3} description="Team">
        <Avatar>Alpha</Avatar>
        <Avatar>Beta</Avatar>
        <Avatar>Gamma</Avatar>
        <Avatar>Delta</Avatar>
      </AvatarGroup>,
    );

    expect(screen.getByRole('group', { name: /Team/ })).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('propagates size tokens to child avatars', () => {
    render(
      <AvatarGroup size="large">
        <Avatar data-testid="child" />
      </AvatarGroup>,
    );

    const child = screen.getByTestId('child');
    expect(child).toHaveStyle('--avatar-size: 56px');
  });
});
