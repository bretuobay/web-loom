/* eslint-disable react/display-name */
import {
  forwardRef,
  type Dispatch,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type MutableRefObject,
  type MouseEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefAttributes,
  type SetStateAction,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Button } from '../button';
import { cn } from '../../utils/cn';
import { useFocusTrap, useModal, useScrollLock } from '@web-loom/ui-core/modal';
import '../../styles/design-system.css';
import './modal.css';

const MODAL_ANIMATION_DURATION = 240;

export type ModalType = 'default' | 'info' | 'success' | 'warning' | 'error';

interface ModalFooterProps {
  okText?: ReactNode;
  cancelText?: ReactNode;
  confirmLoading?: boolean;
  onOk?: (event: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (event?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => void;
}

function DefaultFooter({
  okText = 'Confirm',
  cancelText = 'Cancel',
  confirmLoading,
  onOk,
  onCancel,
}: ModalFooterProps) {
  return (
    <div className="loom-modal-footer-actions">
      <Button variant="default" onClick={onCancel}>
        {cancelText}
      </Button>
      <Button variant="primary" onClick={onOk} loading={confirmLoading}>
        {okText}
      </Button>
    </div>
  );
}

export interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  open?: boolean;
  title?: ReactNode;
  closable?: boolean;
  onOk?: (event: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (event?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => void;
  width?: string | number;
  centered?: boolean;
  keyboard?: boolean;
  maskClosable?: boolean;
  confirmLoading?: boolean;
  destroyOnClose?: boolean;
  footer?: ReactNode;
  okText?: ReactNode;
  cancelText?: ReactNode;
  modalType?: ModalType;
  icon?: ReactNode;
  afterClose?: () => void;
  dialogClassName?: string;
  dialogStyle?: React.CSSProperties;
}

const TYPE_ICONS: Record<ModalType, ReactNode> = {
  default: null,
  info: (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M11 16h2" />
      <path d="M11 11h2v-3h-2z" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6 9 17l-4-4" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 4 4 20h16L12 4z" strokeLinecap="round" />
      <path d="M12 8v4" strokeLinecap="round" />
      <path d="M12 17h.01" strokeLinecap="round" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12" strokeLinecap="round" />
      <path d="M18 6 6 18" strokeLinecap="round" />
    </svg>
  ),
};

const usePortalElement = () => {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }
    const host = document.createElement('div');
    host.className = 'loom-modal-root';
    document.body.appendChild(host);
    setPortalElement(host);

    return () => {
      document.body.removeChild(host);
    };
  }, []);

  return portalElement;
};

const ModalBase = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      open = false,
      title,
      closable = true,
      onOk,
      onCancel,
      width,
      centered = false,
      keyboard = true,
      maskClosable = true,
      confirmLoading = false,
      destroyOnClose = false,
      footer,
      okText,
      cancelText,
      modalType = 'default',
      icon,
      afterClose,
      dialogClassName,
      dialogStyle,
      className,
      style,
      children,
      ...rest
    },
    forwardedRef,
  ) => {
    const portalElement = usePortalElement();
    const dialogRef = useRef<HTMLDivElement | null>(null);
    const [renderModal, setRenderModal] = useState(open);
    const [closing, setClosing] = useState(false);
    const afterCloseRef = useRef<(() => void) | undefined>(afterClose);

    useEffect(() => {
      afterCloseRef.current = afterClose;
    }, [afterClose]);

    useEffect(() => {
      let timer: number | undefined;

      if (open) {
        setRenderModal(true);
        setClosing(false);
        return undefined;
      }

      if (!renderModal) {
        return undefined;
      }

      setClosing(true);
      timer = window.setTimeout(() => {
        setClosing(false);
        if (destroyOnClose) {
          setRenderModal(false);
        }
        afterCloseRef.current?.();
      }, MODAL_ANIMATION_DURATION);

      return () => {
        if (timer) {
          window.clearTimeout(timer);
        }
      };
    }, [open, destroyOnClose, renderModal]);

    const isVisible = open || renderModal;
    const { handleBackdropClick, handleKeyDown, handleOk, handleCancel } = useModal({
      open,
      onOk,
      onCancel,
      maskClosable,
      keyboard,
    });

    useScrollLock(open || closing);
    useFocusTrap(dialogRef, open || closing);

    const handleRef = useCallback(
      (node: HTMLDivElement | null) => {
        dialogRef.current = node;
        if (!forwardedRef) {
          return;
        }
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else {
          (forwardedRef as MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [forwardedRef],
    );

    const dialogId = useId();
    const titleId = `${dialogId}-title`;
    const bodyId = `${dialogId}-body`;

    const resolvedIcon = icon ?? TYPE_ICONS[modalType];

    const overlayClasses = cn(
      'loom-modal-overlay',
      {
        'loom-modal-open': open && !closing,
        'loom-modal-closing': closing,
        'loom-modal-centered': centered,
      },
      className,
    );

    const dialogClasses = cn('loom-modal-dialog', dialogClassName, {
      [`loom-modal-type-${modalType}`]: modalType !== 'default',
    });

    const mergedDialogStyle = useMemo(() => {
      const baseStyle = { ...dialogStyle };

      if (width !== undefined) {
        baseStyle.width = typeof width === 'number' ? `${width}px` : width;
      }

      return baseStyle;
    }, [dialogStyle, width]);

    const defaultFooter = (
      <DefaultFooter
        okText={okText}
        cancelText={cancelText}
        confirmLoading={confirmLoading}
        onOk={handleOk}
        onCancel={handleCancel}
      />
    );
    const footerContent = footer === undefined ? defaultFooter : footer;

    if (!portalElement || !isVisible) {
      return null;
    }

    return createPortal(
      <div
        className={overlayClasses}
        style={style}
        onClick={handleBackdropClick}
        onKeyDown={handleKeyDown}
        role="presentation"
        aria-hidden={!open}
        {...rest}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={bodyId}
          tabIndex={-1}
          className={dialogClasses}
          style={mergedDialogStyle}
          data-modal-type={modalType}
          ref={handleRef}
        >
          <div className="loom-modal-live-region" role="status" aria-live="polite">
            {typeof title === 'string' ? title : 'Dialog opened'}
          </div>
          <header className="loom-modal-header">
            {resolvedIcon ? (
              <span className="loom-modal-icon-wrapper" aria-hidden="true">
                {resolvedIcon}
              </span>
            ) : null}
            {title ? (
              <h2 id={titleId} className="loom-modal-title">
                {title}
              </h2>
            ) : null}
            {closable && (
              <button type="button" className="loom-modal-close-btn" aria-label="Close modal" onClick={handleCancel}>
                ×
              </button>
            )}
          </header>
          <section id={bodyId} className="loom-modal-body">
            {children}
          </section>
          {footerContent ? <footer className="loom-modal-footer">{footerContent}</footer> : null}
        </div>
      </div>,
      portalElement,
    );
  },
);

export interface ModalStaticOptions {
  title?: ReactNode;
  content?: ReactNode;
  okText?: ReactNode;
  cancelText?: ReactNode;
  centered?: boolean;
  closable?: boolean;
  keyboard?: boolean;
  maskClosable?: boolean;
  width?: string | number;
  icon?: ReactNode;
  onOk?: (event: MouseEvent<HTMLButtonElement>) => void;
  onCancel?: (event?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => void;
}

export interface ModalInstance {
  destroy: () => void;
  close: () => void;
}

interface StaticModalRendererProps extends ModalStaticOptions {
  modalType: ModalType;
  registerVisibleSetter: (setter: Dispatch<SetStateAction<boolean>>) => void;
  onCleanup: () => void;
}

const StaticModalRenderer = ({
  modalType,
  registerVisibleSetter,
  onCleanup,
  content,
  onOk,
  onCancel,
  ...options
}: StaticModalRendererProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    registerVisibleSetter(setVisible);
  }, [registerVisibleSetter]);

  const handleOk = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onOk?.(event);
      setVisible(false);
    },
    [onOk],
  );

  const handleCancel = useCallback(
    (event?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => {
      onCancel?.(event);
      setVisible(false);
    },
    [onCancel],
  );

  return (
    <ModalBase
      open={visible}
      title={options.title}
      closable={options.closable}
      onOk={handleOk}
      onCancel={handleCancel}
      width={options.width}
      centered={options.centered}
      keyboard={options.keyboard}
      maskClosable={options.maskClosable}
      okText={options.okText}
      cancelText={options.cancelText}
      modalType={modalType}
      icon={options.icon}
      destroyOnClose
      afterClose={onCleanup}
    >
      {content}
    </ModalBase>
  );
};

const createStaticModal = (config: ModalStaticOptions & { modalType: ModalType }): ModalInstance => {
  if (typeof document === 'undefined') {
    return {
      destroy: () => undefined,
      close: () => undefined,
    };
  }

  const container = document.createElement('div');
  container.className = 'loom-modal-static';
  document.body.appendChild(container);
  const root = createRoot(container);

  let setter: Dispatch<SetStateAction<boolean>> | null = null;
  let cleaned = false;

  const cleanup = () => {
    if (cleaned) {
      return;
    }
    cleaned = true;
    root.unmount();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };

  const destroy = () => {
    if (cleaned) {
      return;
    }
    if (setter) {
      setter(false);
      return;
    }
    cleanup();
  };

  root.render(
    <StaticModalRenderer
      {...config}
      registerVisibleSetter={(node) => {
        setter = node;
      }}
      onCleanup={cleanup}
    />,
  );

  return {
    destroy,
    close: destroy,
  };
};

const modalDefaults: Partial<ModalStaticOptions> = {
  centered: true,
  closable: false,
  keyboard: true,
  maskClosable: false,
};

type ModalComponent = ForwardRefExoticComponent<ModalProps & RefAttributes<HTMLDivElement>> & {
  confirm: (options?: ModalStaticOptions) => ModalInstance;
  info: (options?: ModalStaticOptions) => ModalInstance;
  success: (options?: ModalStaticOptions) => ModalInstance;
  warning: (options?: ModalStaticOptions) => ModalInstance;
  error: (options?: ModalStaticOptions) => ModalInstance;
};

const withDefaults = (
  type: ModalType,
  options: ModalStaticOptions | undefined,
  okText: ReactNode,
  cancelText: ReactNode,
) =>
  createStaticModal({
    modalType: type,
    ...modalDefaults,
    ...options,
    okText: options?.okText ?? okText,
    cancelText: options?.cancelText ?? cancelText,
  });

const ModalWithStatics = ModalBase as ModalComponent;

ModalWithStatics.confirm = (options) => withDefaults('default', options, 'Confirm', 'Cancel');

ModalWithStatics.info = (options) => withDefaults('info', options, 'Got it', 'Cancel');

ModalWithStatics.success = (options) => withDefaults('success', options, 'Great', 'Cancel');

ModalWithStatics.warning = (options) => withDefaults('warning', options, 'Proceed', 'Cancel');

ModalWithStatics.error = (options) => withDefaults('error', options, 'Dismiss', 'Cancel');

export { ModalWithStatics as Modal };
