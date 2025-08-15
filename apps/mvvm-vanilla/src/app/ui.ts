import ejs from 'ejs';
import { state } from './state';

const header = document.getElementById('header')!;
const footer = document.getElementById('footer')!;

export async function renderTemplate(templatePath: string, data: object) {
  const template = await fetch(templatePath).then((res) => res.text());
  return ejs.render(template, data);
}

export async function renderCard(containerId: string, templatePath: string, data: object) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = await renderTemplate(templatePath, data);
  }
}

export async function renderLayout() {
  console.log('Rendering layout with navigation:', state.navigation);
  header.innerHTML = await renderTemplate('/src/views/layout/Header.ejs', { navigation: state.navigation });
  footer.innerHTML = await renderTemplate('/src/views/layout/Footer.ejs', {});
}
