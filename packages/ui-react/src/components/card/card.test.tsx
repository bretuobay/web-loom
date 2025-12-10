import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from './card';

describe('Card', () => {
  it('renders semantic article when href is not provided', () => {
    render(
      <Card title="Design language" description="Unified typography scale">
        Scale content
      </Card>,
    );

    const article = screen.getByRole('article');
    expect(article).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /design language/i })).toBeInTheDocument();
    expect(article).toHaveTextContent(/unified typography scale/i);
  });

  it('renders anchor card when href is provided', () => {
    render(
      <Card title="Tokens explorer" href="https://example.com/design">
        Inspect every primitive
      </Card>,
    );

    const anchor = screen.getByRole('link', { name: /tokens explorer/i });
    expect(anchor).toHaveAttribute('href', 'https://example.com/design');
    expect(anchor).toHaveAttribute('rel', 'noreferrer noopener');
    expect(anchor).toHaveAttribute('target', '_blank');
  });

  it('supports badge and footer content', () => {
    render(
      <Card title="Release notes" badge="beta" footer={<span>Read more</span>}>
        Latest drop
      </Card>,
    );

    expect(screen.getByText(/beta/i)).toBeInTheDocument();
    expect(screen.getByText(/read more/i)).toBeInTheDocument();
  });

  it('renders extra content in header', () => {
    render(<Card title="Card title" extra={<button>Settings</button>} />);

    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  it('applies bordered class by default', () => {
    render(<Card title="Bordered card" />);

    const article = screen.getByRole('article');
    expect(article).toHaveClass('loom-card-bordered');
  });

  it('does not apply bordered class when bordered is false', () => {
    render(<Card title="Non-bordered card" bordered={false} />);

    const article = screen.getByRole('article');
    expect(article).not.toHaveClass('loom-card-bordered');
  });

  it('applies hoverable class by default', () => {
    render(<Card title="Hoverable card" />);

    const article = screen.getByRole('article');
    expect(article).toHaveClass('loom-card-hoverable');
  });

  it('does not apply hoverable class when hoverable is false', () => {
    render(<Card title="Non-hoverable card" hoverable={false} />);

    const article = screen.getByRole('article');
    expect(article).not.toHaveClass('loom-card-hoverable');
  });

  it('renders loading skeleton when loading is true', () => {
    render(<Card title="Loading card" loading={true} />);

    const article = screen.getByRole('article');
    expect(article).toHaveClass('loom-card-loading');
    expect(screen.queryByText(/loading card/i)).not.toBeInTheDocument();
  });

  it('applies small size class', () => {
    render(<Card title="Small card" size="small" />);

    const article = screen.getByRole('article');
    expect(article).toHaveClass('loom-card-small');
  });

  it('renders cover content', () => {
    render(
      <Card
        title="Card with cover"
        cover={<img src="test.jpg" alt="Test cover" />}
      />,
    );

    const img = screen.getByAltText(/test cover/i);
    expect(img).toBeInTheDocument();
  });

  it('renders actions array', () => {
    render(
      <Card
        title="Card with actions"
        actions={[
          <button key="edit">Edit</button>,
          <button key="delete">Delete</button>,
        ]}
      />,
    );

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('renders without title', () => {
    render(<Card description="Card without title" />);

    const article = screen.getByRole('article');
    expect(article).toHaveTextContent(/card without title/i);
  });

  it('renders title as ReactNode', () => {
    render(
      <Card
        title={
          <div>
            <span>Custom</span> Title
          </div>
        }
      />,
    );

    expect(screen.getByText(/custom/i)).toBeInTheDocument();
    expect(screen.getByText(/title/i)).toBeInTheDocument();
  });
});

