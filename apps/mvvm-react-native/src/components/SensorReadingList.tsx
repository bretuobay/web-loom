import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SensorReadingViewModel } from '@repo/view-models';
import { useObservable } from '../hooks/useObservable';
import { SensorReadingCard } from './SensorReadingCard';

export const SensorReadingList = () => {
  const sensorReadingViewModel = new SensorReadingViewModel();
  const sensorReadings = useObservable(sensorReadingViewModel.sensorReadings$);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sensor Readings</Text>
      <FlatList
        data={sensorReadings}
        renderItem={({ item }) => <SensorReadingCard sensorReading={item} />}
        keyExtractor={(item) => item.id.toString()}
      />
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
