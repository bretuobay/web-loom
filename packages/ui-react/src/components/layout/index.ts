/**
 * Layout Component Exports
 */

import { Layout as BaseLayout } from './Layout';
import { Header } from './Header';
import { Footer } from './Footer';
import { Content } from './Content';
import { Sider } from './Sider';

// Compound component pattern
export const Layout = Object.assign(BaseLayout, {
  Header,
  Footer,
  Content,
  Sider,
});

export { Header, Footer, Content, Sider };
export type { LayoutProps } from './Layout';
export type { HeaderProps } from './Header';
export type { FooterProps } from './Footer';
export type { ContentProps } from './Content';
export type { SiderProps } from './Sider';
export { useLayoutContext } from './LayoutContext';
export type { LayoutContextValue } from './LayoutContext';
