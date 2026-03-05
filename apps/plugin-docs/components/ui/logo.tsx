import { BrandLogo } from '@repo/docs-theme';

export default function Logo() {
  return (
    <BrandLogo
      href="/book"
      imageSrc="/images/webloom.png"
      imageAlt="Web Loom logo"
      imageWidth={36}
      imageHeight={36}
      brandText="Web"
      accentText=".loom"
    />
  );
}
