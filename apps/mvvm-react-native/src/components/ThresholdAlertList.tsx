import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useObservable } from '../hooks/useObservable';
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

// component to render individual threshold alert
const ThresholdAlertCard = ({ thresholdAlert }: { thresholdAlert: any }) => {
  return (
    <View style={styles.alertCard}>
      <Text style={styles.alertTitle}>Alert: {thresholdAlert.name}</Text>
      <Text>Value: {thresholdAlert.value}</Text>
      <Text>Timestamp: {new Date(thresholdAlert.timestamp).toLocaleString()}</Text>
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
  alertCard: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
