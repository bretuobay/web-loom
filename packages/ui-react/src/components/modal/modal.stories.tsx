/**
 * Modal Component Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../button';
import { Modal } from './Modal';

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Basic: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          Open Modal
        </Button>
        <Modal
          open={open}
          title="Themeable Modal"
          centered
          width={520}
          onOk={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        >
          <p>
            This modal is built with portal rendering, focus trapping, scroll locking, and smooth entrance animations.
            Clicking outside or pressing ESC closes the overlay.
          </p>
        </Modal>
      </>
    );
  },
};

export const ConfirmationModals: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <Button
        onClick={() =>
          Modal.confirm({
            title: 'Confirm navigation?',
            content: 'Leaving this page will discard your changes.',
          })
        }
      >
        Confirm
      </Button>
      <Button
        onClick={() =>
          Modal.info({
            title: 'Did you know?',
            content: 'Theme-aware modals are accessible and announce their state to screen readers.',
          })
        }
      >
        Info
      </Button>
      <Button
        onClick={() =>
          Modal.success({
            title: 'Saved',
            content: 'All of your changes were successfully persisted.',
          })
        }
      >
        Success
      </Button>
      <Button
        onClick={() =>
          Modal.warning({
            title: 'Warning',
            content: 'This action is irreversible. Please proceed with caution.',
          })
        }
      >
        Warning
      </Button>
      <Button
        onClick={() =>
          Modal.error({
            title: 'Error',
            content: 'We could not complete the request. Try again later.',
          })
        }
      >
        Error
      </Button>
    </div>
  ),
};

export const DifferentSizes: Story = {
  render: () => {
    const [small, setSmall] = useState(false);
    const [large, setLarge] = useState(false);

    return (
      <div style={{ display: 'flex', gap: '12px' }}>
        <Button onClick={() => setSmall(true)}>Small Modal</Button>
        <Button onClick={() => setLarge(true)}>Large Modal</Button>

        <Modal
          open={small}
          title="Pocket-friendly modal"
          width={360}
          onOk={() => setSmall(false)}
          onCancel={() => setSmall(false)}
        >
          <p>This modal stays compact on smaller viewports while remaining accessible.</p>
        </Modal>

        <Modal
          open={large}
          title="Wide modal example"
          width={760}
          onOk={() => setLarge(false)}
          onCancel={() => setLarge(false)}
        >
          <p>
            Wider panels are ideal for showcasing dense data or large forms. They still respect the centered alignment
            and animation contract.
          </p>
        </Modal>
      </div>
    );
  },
};

export const NestedModals: Story = {
  render: () => {
    const [outerOpen, setOuterOpen] = useState(false);
    const [innerOpen, setInnerOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setOuterOpen(true)}>Open parent modal</Button>

        <Modal
          open={outerOpen}
          title="Outer layer"
          centered
          onOk={() => setOuterOpen(false)}
          onCancel={() => setOuterOpen(false)}
        >
          <p>Even while this modal is open, you can layer another one on top.</p>
          <Button variant="primary" onClick={() => setInnerOpen(true)}>
            Show nested
          </Button>
          <Modal
            open={innerOpen}
            title="Nested layer"
            centered
            width={400}
            onOk={() => setInnerOpen(false)}
            onCancel={() => setInnerOpen(false)}
          >
            <p>The focus trap stays accurate even with nested portals.</p>
          </Modal>
        </Modal>
      </>
    );
  },
};

export const LoadingStates: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const timerRef = useRef<number | undefined>(undefined);

    useEffect(() => {
      return () => {
        window.clearTimeout(timerRef.current);
      };
    }, []);

    const handleOk = () => {
      setLoading(true);
      timerRef.current = window.setTimeout(() => {
        setLoading(false);
        setOpen(false);
      }, 1200);
    };

    return (
      <>
        <Button onClick={() => setOpen(true)}>Show loading modal</Button>
        <Modal
          open={open}
          title="Submit request"
          centered
          confirmLoading={loading}
          onOk={handleOk}
          onCancel={() => setOpen(false)}
        >
          <p>The confirm button displays a loading state while async actions run.</p>
        </Modal>
      </>
    );
  },
};
