import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const Dashboard = ({ navigation }: { navigation: any }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Button
        title="Greenhouses"
        onPress={() => navigation.navigate('Greenhouses')}
      />
      <Button
        title="Sensors"
        onPress={() => navigation.navigate('Sensors')}
      />
      <Button
        title="Sensor Readings"
        onPress={() => navigation.navigate('SensorReadings')}
      />
      <Button
        title="Threshold Alerts"
        onPress={() => navigation.navigate('ThresholdAlerts')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});

export default Dashboard;
