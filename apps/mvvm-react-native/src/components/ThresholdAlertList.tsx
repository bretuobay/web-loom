import React from 'react';
import { View, Text, FlatList, ScrollView } from 'react-native';
import { useObservable } from '../hooks/useObservable';
import { ThresholdAlertListData, thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';
import { styles } from '@repo/shared';

export const ThresholdAlertList = () => {
  const thresholdAlerts = useObservable(thresholdAlertViewModel.data$);

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={[styles.flexApp]}>
        <Text style={styles.headerItem}>Threshold Alerts</Text>
        <FlatList
          data={thresholdAlerts}
          renderItem={({ item }) => <ThresholdAlertCard thresholdAlert={item} />}
          keyExtractor={(item) => item?.id?.toString() ?? 'unknown'}
        />
      </View>
    </ScrollView>
  );
};

// component to render individual threshold alert
const ThresholdAlertCard = ({ thresholdAlert }: { thresholdAlert: ThresholdAlertListData[0] }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Alert: {thresholdAlert.sensorType}</Text>
      <Text style={styles.cardContent}>Min Value: {thresholdAlert.minValue}</Text>
      <Text style={styles.cardContent}>Max Value: {thresholdAlert.maxValue}</Text>
    </View>
  );
};
