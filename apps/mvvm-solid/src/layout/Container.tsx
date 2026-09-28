import type { ParentProps } from 'solid-js';

export default function Container(props: ParentProps) {
  return (
    <main class="flex-container flex-column flex-app" style={{ padding: '20px' }}>
      {props.children}
    </main>
  );
}
