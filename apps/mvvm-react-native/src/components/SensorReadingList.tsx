import React from 'react';
import { View, Text, FlatList, ScrollView } from 'react-native';
import { useObservable } from '../hooks/useObservable';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { styles } from '@repo/shared/theme';

export const SensorReadingList = () => {
  const sensorReadings = useObservable(sensorReadingViewModel.data$);

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={[styles.flexApp]}>
        <Text style={styles.headerItem}>Sensor Readings</Text>
        <FlatList
          data={sensorReadings}
          renderItem={({ item }) => <SensorReadingCard sensorReading={item} />}
          keyExtractor={(item) => item?.id?.toString() ?? 'unknown'}
        />
      </View>
    </ScrollView>
  );
};

// component to render individual sensor reading
const SensorReadingCard = ({ sensorReading }: { sensorReading: any }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Reading: {sensorReading.value}</Text>
      <Text style={styles.cardContent}>Timestamp: {new Date(sensorReading.timestamp).toLocaleString()}</Text>
    </View>
  );
};
