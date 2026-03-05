import { BrandFooter } from '@repo/docs-theme';
import Logo from './logo';

export default function Footer() {
  return <BrandFooter logo={<Logo />} copyrightOwner="Web Loom" githubHref="https://github.com/bretuobay/web-loom" />;
}
