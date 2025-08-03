import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useObservable } from '../hooks/useObservable';
import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { GreenhouseCard } from './GreenhouseCard';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { SensorCard } from './SensorCard';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';
import { SensorReadingCard } from './SensorReadingCard';
import { ThresholdAlertCard } from './ThresholdAlertCard';
import { styles } from '@repo/shared/theme';

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
    <ScrollView>
      <View
        style={[
          styles.flexApp,
          { minHeight: 'auto', width: 'auto', maxWidth: 1280, marginHorizontal: '20%', padding: 20 },
        ]}
      >
        <Text style={styles.headerItem}>Dashboard</Text>
        <View style={stylesLocal.row}>
          <GreenhouseCard greenHouses={greenHouses ?? []} navigation={navigation} />
          <SensorCard sensors={sensors ?? []} navigation={navigation} />
          <ThresholdAlertCard thresholdAlerts={thresholdAlerts ?? []} navigation={navigation} />
        </View>
        <View
          style={{
            maxWidth: 1280,
            marginHorizontal: 'auto',
            padding: 20,
            marginTop: 20,
            backgroundColor: '#f8f9fa',
            borderRadius: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            overflow: 'scroll',
          }}
        >
          <SensorReadingCard sensorReadings={sensorReadings ?? []} navigation={navigation} />
        </View>
      </View>
    </ScrollView>
  );
};

const stylesLocal = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default Dashboard;
