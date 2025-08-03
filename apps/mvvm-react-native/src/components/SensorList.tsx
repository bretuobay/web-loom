import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useObservable } from '../hooks/useObservable';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';

export const SensorList = () => {
  const sensors = useObservable(sensorViewModel.data$);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sensors</Text>
      <FlatList
        data={sensors}
        renderItem={({ item }) => <SensorCard sensor={item} />}
        keyExtractor={(item) => item?.id?.toString() ?? 'unknown'}
      />
    </View>
  );
};

// component to render individual sensor
const SensorCard = ({ sensor }: { sensor: any }) => {
  return (
    <View style={styles.sensorCard}>
      <Text style={styles.sensorTitle}>{sensor.name}</Text>
      <Text>Type: {sensor.type}</Text>
      <Text>Location: {sensor.location}</Text>
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
  sensorCard: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sensorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
