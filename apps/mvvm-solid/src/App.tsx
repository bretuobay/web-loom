import type { ParentProps } from 'solid-js';
import { Header } from './layout/Header';
import Container from './layout/Container';
import Footer from './layout/Footer';
import Dashboard from './components/Dashboard';
import { GreenhouseList } from './components/GreenhouseList';
import { SensorList } from './components/SensorList';
import { SensorReadingList } from './components/SensorReadingList';
import { ThresholdAlertList } from './components/ThresholdAlertList';

export function AppLayout(props: ParentProps) {
  return (
    <>
      <Header />
      <Container>{props.children}</Container>
      <Footer />
    </>
  );
}

export { Dashboard, GreenhouseList, SensorList, SensorReadingList, ThresholdAlertList };
