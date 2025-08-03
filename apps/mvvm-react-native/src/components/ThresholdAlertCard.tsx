import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { styles } from '@repo/shared/theme';

export const ThresholdAlertCard = ({ thresholdAlerts, navigation }: { thresholdAlerts: any[]; navigation: any }) => {
  if (!thresholdAlerts || thresholdAlerts.length === 0) return null;
  return (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ThresholdAlerts')}>
      <Text style={styles.cardTitle}>Total Threshold Alerts</Text>
      <Text style={styles.cardContent}>{thresholdAlerts.length}</Text>
    </TouchableOpacity>
  );
};
