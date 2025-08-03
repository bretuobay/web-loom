import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useObservable } from '../hooks/useObservable';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';

export const SensorReadingList = () => {
  const sensorReadings = useObservable(sensorReadingViewModel.data$);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sensor Readings</Text>
      <FlatList
        data={sensorReadings}
        renderItem={({ item }) => <SensorReadingCard sensorReading={item} />}
        keyExtractor={(item) => item?.id?.toString() ?? 'unknown'}
      />
    </View>
  );
};

// component to render individual sensor reading
const SensorReadingCard = ({ sensorReading }: { sensorReading: any }) => {
  return (
    <View style={styles.sensorReadingCard}>
      <Text style={styles.sensorReadingTitle}>Reading: {sensorReading.value}</Text>
      <Text>Timestamp: {new Date(sensorReading.timestamp).toLocaleString()}</Text>
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
  sensorReadingCard: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sensorReadingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
