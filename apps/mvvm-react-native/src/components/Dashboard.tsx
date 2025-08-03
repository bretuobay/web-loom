import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useObservable } from '../hooks/useObservable';
import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { GreenhouseCard } from './GreenhouseCard';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { SensorCard } from './SensorCard';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';
import { SensorReadingCard } from './SensorReadingCard';
import { ThresholdAlertCard } from './ThresholdAlertCard';

const Dashboard = ({ navigation }: { navigation: any }) => {
  const greenHouses = useObservable(greenHouseViewModel.data$);
  const sensors = useObservable(sensorReadingViewModel.data$);
  const sensorReadings = useObservable(sensorReadingViewModel.data$);
  const thresholdAlerts = useObservable(thresholdAlertViewModel.data$);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await greenHouseViewModel.fetchCommand.execute();
        await sensorReadingViewModel.fetchCommand.execute();
        await sensorViewModel.fetchCommand.execute();
        await thresholdAlertViewModel.fetchCommand.execute();
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <GreenhouseCard greenHouses={greenHouses ?? []} navigation={navigation} />
      <SensorCard sensors={sensors ?? []} navigation={navigation} />
      <ThresholdAlertCard thresholdAlerts={thresholdAlerts ?? []} navigation={navigation} />
      <SensorReadingCard sensorReadings={sensorReadings ?? []} navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
});

export default Dashboard;
