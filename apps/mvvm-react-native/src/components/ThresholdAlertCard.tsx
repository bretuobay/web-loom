import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export const ThresholdAlertCard = ({ thresholdAlerts, navigation }: { thresholdAlerts: any[]; navigation: any }) => {
  if (!thresholdAlerts || thresholdAlerts.length === 0) return null;
  return (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ThresholdAlerts')}>
      <View style={styles.card}>
        <Text style={styles.title}>Total Threshold Alerts: {thresholdAlerts.length}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
