import '@repo/shared/styles';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import { GreenhouseList } from './components/GreenhouseList';
import { SensorList } from './components/SensorList';
import { SensorReadingList } from './components/SensorReadingList';
import { ThresholdAlertList } from './components/ThresholdAlertList';
import { Header } from './layout/Header';
import Container from './layout/Container';
import Footer from './layout/Footer';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Container>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/greenhouses" element={<GreenhouseList />} />
          <Route path="/sensors" element={<SensorList />} />
          <Route path="/sensor-readings" element={<SensorReadingList />} />
          <Route path="/threshold-alerts" element={<ThresholdAlertList />} />
        </Routes>
      </Container>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
