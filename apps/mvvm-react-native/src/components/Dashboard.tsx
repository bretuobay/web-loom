import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';
import React, { useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const Dashboard = ({ navigation }: { navigation: any }) => {
  useEffect(() => {
    const fetchData = async () => {
      try {
        await greenHouseViewModel.fetchCommand.execute();
        await sensorViewModel.fetchCommand.execute();
        await sensorReadingViewModel.fetchCommand.execute();
        await thresholdAlertViewModel.fetchCommand.execute();
      } catch (error) {
        console.error('Error fetching data:', error);
        // Optionally, set an error state here to display to the user
      }
    };

    fetchData();
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Button title="Greenhouses" onPress={() => navigation.navigate('Greenhouses')} />
      <Button title="Sensors" onPress={() => navigation.navigate('Sensors')} />
      <Button title="Sensor Readings" onPress={() => navigation.navigate('SensorReadings')} />
      <Button title="Threshold Alerts" onPress={() => navigation.navigate('ThresholdAlerts')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});

export default Dashboard;
