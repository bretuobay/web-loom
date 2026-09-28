import React, { useEffect } from 'react';
import { View, Text, Pressable, Dimensions, StyleSheet, Platform } from 'react-native';
import Svg, { Circle, G, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { styles as sharedStyles } from '@repo/shared';

const LineChart = Platform.OS === 'web' ? null : require('react-native-chart-kit').LineChart;

// Suppress React Native Web warnings for chart components
const useWebWarningSuppress = () => {
  useEffect(() => {
    if (Platform.OS === 'web') {
      const originalConsoleWarn = console.warn;

      console.warn = (...args) => {
        const message = args[0];
        if (
          typeof message === 'string' &&
          (message.includes('onResponder') || message.includes('Unknown event handler'))
        ) {
          // Suppress these specific warnings
          return;
        }
        originalConsoleWarn.apply(console, args);
      };

      // Cleanup function to restore original console.warn
      return () => {
        console.warn = originalConsoleWarn;
      };
    }
  }, []);
};

const MAX_CARD_WIDTH = 800;
const CHART_HORIZONTAL_PADDING = 20;
const chartWidth = Math.min(
  Dimensions.get('window').width - CHART_HORIZONTAL_PADDING * 2,
  MAX_CARD_WIDTH - CHART_HORIZONTAL_PADDING * 2,
);

const GRID_COLOR = 'rgba(0, 0, 0, 0.1)';
const LABEL_COLOR = 'rgba(0, 0, 0, 0.8)';
const Y_SEGMENTS = 4;

const WebLineChart = ({
  data,
  labels,
  width,
  height,
}: {
  data: number[];
  labels: string[];
  width: number;
  height: number;
}) => {
  const padding = { top: 16, right: 16, bottom: 28, left: 44 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const rawMin = Math.min(...data);
  const rawMax = Math.max(...data);
  const rawRange = rawMax - rawMin || 1;
  const min = rawMin - rawRange * 0.05;
  const max = rawMax + rawRange * 0.05;
  const range = max - min;
  const step = data.length > 1 ? chartW / (data.length - 1) : 0;

  const valueToY = (value: number) => padding.top + chartH - ((value - min) / range) * chartH;

  const points = data
    .map((value, index) => {
      const x = padding.left + step * index;
      return `${x},${valueToY(value)}`;
    })
    .join(' ');

  const gridLines = Array.from({ length: Y_SEGMENTS + 1 }, (_, index) => {
    const ratio = index / Y_SEGMENTS;
    return {
      y: padding.top + chartH * (1 - ratio),
      value: min + range * ratio,
    };
  });

  return (
    <Svg width={width} height={height} style={{ marginVertical: 8, borderRadius: 5 }}>
      {gridLines.map(({ y, value }, index) => (
        <G key={`grid-${index}`}>
          <Line x1={padding.left} y1={y} x2={padding.left + chartW} y2={y} stroke={GRID_COLOR} strokeWidth={1} />
          <SvgText x={padding.left - 6} y={y + 4} fontSize={10} fill={LABEL_COLOR} textAnchor="end">
            {value.toFixed(2)}
          </SvgText>
        </G>
      ))}

      {labels.map((label, index) => (
        <SvgText
          key={`x-label-${index}`}
          x={padding.left + step * index}
          y={height - 8}
          fontSize={10}
          fill={LABEL_COLOR}
          textAnchor="middle"
        >
          {label}
        </SvgText>
      ))}

      <Polyline points={points} fill="none" stroke="rgb(75, 192, 192)" strokeWidth={2} />
      {data.map((value, index) => {
        const x = padding.left + step * index;
        return (
          <Circle
            key={`dot-${index}`}
            cx={x}
            cy={valueToY(value)}
            r={3}
            stroke="rgb(75, 192, 192)"
            strokeWidth={2}
            fill="rgb(75, 192, 192)"
          />
        );
      })}
    </Svg>
  );
};

export const SensorReadingCard = ({ sensorReadings, navigation }: { sensorReadings: any[]; navigation: any }) => {
  // Suppress React Native Web warnings for chart components
  useWebWarningSuppress();

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
      <Pressable onPress={() => navigation.navigate('SensorReadings')}>
        <Text style={sharedStyles.cardTitle}>Sensor Readings</Text>
        {Platform.OS === 'web' ? (
          <WebLineChart data={data} labels={labels} width={chartWidth} height={180} />
        ) : (
          LineChart && (
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
          )
        )}
        <Text style={sharedStyles.cardContent}>Total Readings: {sensorReadings.length}</Text>
      </Pressable>
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
