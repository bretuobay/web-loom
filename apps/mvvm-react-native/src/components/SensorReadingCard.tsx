import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { styles } from '@repo/shared/theme';

export const SensorReadingCard = ({ sensorReadings, navigation }: { sensorReadings: any[]; navigation: any }) => {
  if (!sensorReadings || sensorReadings.length === 0) return null;

  // Show only the last 6 readings
  const lastReadings = sensorReadings;
  const labels = lastReadings.map((reading) => {
    const date = new Date(reading.timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });
  const data = lastReadings.map((reading) => reading.value);

  const chartData = {
    labels,
    datasets: [
      {
        data,
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // black line
        strokeWidth: 2,
      },
    ],
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('SensorReadings')}>
      <Text style={styles.cardTitle}>Sensor Readings</Text>
      <LineChart
        data={chartData}
        width={Dimensions.get('window').width - 90} // Adjusted for card padding
        height={180}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 2,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // black line
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // black labels
          style: { borderRadius: 5 },
          propsForDots: {
            r: '5',
            strokeWidth: '2',
            stroke: '#000000',
            fill: '#000000',
          },
        }}
        bezier
        style={{ marginVertical: 8, borderRadius: 5 }}
      />
      <Text style={styles.cardContent}>Total Readings: {sensorReadings.length}</Text>
    </TouchableOpacity>
  );
};
