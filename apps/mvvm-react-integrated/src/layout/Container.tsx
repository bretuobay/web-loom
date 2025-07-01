const Container = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="container-fluid" style={{ padding: 'var(--spacing-5)' }}>
      {children}
    </main>
  );
};
export default Container;
