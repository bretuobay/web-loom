import React from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { styles as sharedStyles } from '@repo/shared/theme';

const MAX_CARD_WIDTH = 800;
const CHART_HORIZONTAL_PADDING = 20;
const chartWidth = Math.min(
  Dimensions.get('window').width - CHART_HORIZONTAL_PADDING * 2,
  MAX_CARD_WIDTH - CHART_HORIZONTAL_PADDING * 2,
);

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
    <View style={[localStyles.cardContainer, sharedStyles.card]}>
      <TouchableOpacity onPress={() => navigation.navigate('SensorReadings')} activeOpacity={0.8}>
        <Text style={sharedStyles.cardTitle}>Sensor Readings</Text>
        <LineChart
          data={chartData}
          width={chartWidth}
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
              r: '3',
              strokeWidth: '2',
              stroke: 'rgb(75, 192, 192)',
              fill: 'rgb(75, 192, 192)',
            },
          }}
          bezier
          style={{ marginVertical: 8, borderRadius: 5 }}
        />
        <Text style={sharedStyles.cardContent}>Total Readings: {sensorReadings.length}</Text>
      </TouchableOpacity>
    </View>
  );
};

const localStyles = StyleSheet.create({
  cardContainer: {
    maxWidth: MAX_CARD_WIDTH,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: CHART_HORIZONTAL_PADDING,
  },
});
