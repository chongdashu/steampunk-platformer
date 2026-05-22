import './styles.css';

const root = document.querySelector<HTMLElement>('#app');

if (!root) {
  throw new Error('Missing #app root');
}

if (import.meta.env.PROD) {
  const { createReleaseApp } = await import('./releaseApp');
  createReleaseApp(root);
} else {
  const { createApp } = await import('./shell/appShell');
  createApp(root);
}
