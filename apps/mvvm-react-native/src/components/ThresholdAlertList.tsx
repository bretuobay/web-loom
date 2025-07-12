import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { ThresholdAlertViewModel } from '@repo/view-models';
import { useObservable } from '../hooks/useObservable';
import { ThresholdAlertCard } from './ThresholdAlertCard';

export const ThresholdAlertList = () => {
  const thresholdAlertViewModel = new ThresholdAlertViewModel();
  const thresholdAlerts = useObservable(thresholdAlertViewModel.thresholdAlerts$);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Threshold Alerts</Text>
      <FlatList
        data={thresholdAlerts}
        renderItem={({ item }) => <ThresholdAlertCard thresholdAlert={item} />}
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
