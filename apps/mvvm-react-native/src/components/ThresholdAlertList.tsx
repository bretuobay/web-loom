import React from 'react';
import { View, Text, FlatList, ScrollView } from 'react-native';
import { useObservable } from '../hooks/useObservable';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';
import { styles } from '@repo/shared/theme';

export const ThresholdAlertList = () => {
  const thresholdAlerts = useObservable(thresholdAlertViewModel.data$);

  return (
    <ScrollView style={{ flex: 1 }}>
      <Text style={styles.headerItem}>Threshold Alerts</Text>
      <FlatList
        data={thresholdAlerts}
        renderItem={({ item }) => <ThresholdAlertCard thresholdAlert={item} />}
        keyExtractor={(item) => item?.id?.toString() ?? 'unknown'}
      />
    </ScrollView>
  );
};

// component to render individual threshold alert
const ThresholdAlertCard = ({ thresholdAlert }: { thresholdAlert: any }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Alert: {thresholdAlert.name}</Text>
      <Text style={styles.cardContent}>Value: {thresholdAlert.value}</Text>
      <Text style={styles.cardContent}>Timestamp: {new Date(thresholdAlert.timestamp).toLocaleString()}</Text>
    </View>
  );
};
