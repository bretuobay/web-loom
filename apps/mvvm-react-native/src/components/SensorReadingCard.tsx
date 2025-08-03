import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

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
        color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`, // teal line
        strokeWidth: 2,
      },
    ],
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('SensorReadings')}>
      <View style={styles.cardContent}>
        <Text style={styles.title}>Sensor Readings</Text>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 40}
          height={180}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`, // teal line
            labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`, // dark labels
            style: { borderRadius: 16 },
            propsForDots: {
              r: '5',
              strokeWidth: '2',
              stroke: 'rgb(75, 192, 192)',
              fill: 'rgb(75, 192, 192)',
            },
          }}
          bezier
          style={{ marginVertical: 8, borderRadius: 16 }}
        />
        <Text style={styles.total}>Total Readings: {sensorReadings.length}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cardContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  total: {
    marginTop: 8,
    fontSize: 16,
    color: '#333',
  },
});
