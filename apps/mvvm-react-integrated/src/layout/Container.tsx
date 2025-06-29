const Container = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="flex-container flex-column flex-app" style={{ padding: '20px' }}>
      {children}
    </main>
  );
};
export default Container;
