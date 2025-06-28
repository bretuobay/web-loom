import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
// Removed './App.css' import, styles are now handled by shared-styles.css and index.css
import Dashboard from './components/Dashboard';
import PostsList from './components/PostsList';
import PostDetail from './components/PostDetail';

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav>
          {/* Use NavLink for active class styling, and apply .nav-link for shared styles */}
          <NavLink to="/" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Dashboard
          </NavLink>
          <NavLink to="/posts" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Posts
          </NavLink>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/posts" element={<PostsList />} />
            <Route path="/posts/:id" element={<PostDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
