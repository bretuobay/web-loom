export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer class="footer">
      <p>&copy; {currentYear} Dashboard Demo. All rights reserved.</p>
    </footer>
  );
}
