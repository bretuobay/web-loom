import '@repo/shared/styles';
import './App.css';
import { BrowserRouter } from './router/Routing';
import { Header } from './layout/Header';
import Container from './layout/Container';
import Footer from './layout/Footer';
import { PluginHost, PluginHostProvider } from './host/PluginHost';

function App() {
  return (
    <BrowserRouter>
      <PluginHostProvider>
        <Header />
        <Container>
          <PluginHost />
        </Container>
        <Footer />
      </PluginHostProvider>
    </BrowserRouter>
  );
}

export default App;
