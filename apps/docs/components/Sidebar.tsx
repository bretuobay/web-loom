export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r p-4 md:flex">
      <nav className="flex flex-col space-y-2">
        <h2 className="text-sm font-semibold uppercase text-gray-500">
          Getting Started
        </h2>
        <a href="#" className="rounded-md px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-800">
          Installation
        </a>
        <a href="#" className="rounded-md px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-800">
          Hello World
        </a>
        <h2 className="pt-4 text-sm font-semibold uppercase text-gray-500">
          Core Concepts
        </h2>
        <a href="#" className="rounded-md px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-800">
          MVVM Architecture
        </a>
        <a href="#" className="rounded-md px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-800">
          Data Binding
        </a>
      </nav>
    </aside>
  );
}
