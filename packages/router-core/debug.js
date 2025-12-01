// Debug script to understand route compilation
import { createRouteMatcher } from './src/matcher.ts';

const routes = [
  { path: '/', name: 'home' },
  {
    path: '/users',
    name: 'users',
    children: [
      { path: '/', name: 'user-list' },
      { path: '/:id(\\d+)', name: 'user-detail', meta: { auth: true } },
    ],
  },
  {
    path: '/files/*',
    name: 'file-catch',
  },
];

console.log('Testing route compilation...');

try {
  const matcher = createRouteMatcher(routes);
  console.log('Testing /users/42...');
  const result = matcher('/users/42');
  console.log('SUCCESS:', result);
} catch (e) {
  console.log('ERROR:', e.message);

  // Let's manually debug the compilation
  console.log('\nDebugging route compilation...');
  // We need to access the internal compileRoutes function
}
