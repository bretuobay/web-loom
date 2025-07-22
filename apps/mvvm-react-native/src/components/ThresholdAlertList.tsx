import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useObservable } from '../hooks/useObservable';
import { ThresholdAlertCard } from './ThresholdAlertCard';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';

export const ThresholdAlertList = () => {
  const thresholdAlerts = useObservable(thresholdAlertViewModel.data$);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Threshold Alerts</Text>
      <FlatList
        data={thresholdAlerts}
        renderItem={({ item }) => <ThresholdAlertCard thresholdAlert={item} />}
        keyExtractor={(item) => item?.id?.toString() ?? 'unknown'}
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
