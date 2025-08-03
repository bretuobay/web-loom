import React from 'react';
import { View, Text, FlatList, ScrollView } from 'react-native';
import { useObservable } from '../hooks/useObservable';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { styles } from '@repo/shared/theme';

export const SensorList = () => {
  const sensors = useObservable(sensorViewModel.data$);

  return (
    <ScrollView style={{ flex: 1 }}>
      <Text style={styles.headerItem}>Sensors</Text>
      <FlatList
        data={sensors}
        renderItem={({ item }) => <SensorCard sensor={item} />}
        keyExtractor={(item) => item?.id?.toString() ?? 'unknown'}
      />
    </ScrollView>
  );
};

// component to render individual sensor
const SensorCard = ({ sensor }: { sensor: any }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{sensor.name}</Text>
      <Text style={styles.cardContent}>Type: {sensor.type}</Text>
      <Text style={styles.cardContent}>Location: {sensor.location}</Text>
    </View>
  );
};
