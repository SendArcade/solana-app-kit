// FILE: src/components/CoinDetails/CoinDetailTopSection/LineGraph.tsx

import React, {useEffect, useRef} from 'react';
import {View, Dimensions, Animated} from 'react-native';
import {LineChart} from 'react-native-chart-kit';
import {Circle} from 'react-native-svg';

interface LineGraphProps {
  data: number[];
  width?: number;
}

const LineGraph: React.FC<LineGraphProps> = ({data, width}) => {
  const screenWidth = width || Dimensions.get('window').width - 32;
  const animatedData = useRef(new Animated.Value(0)).current;
  const currentData = useRef(data);
  const [displayData, setDisplayData] = React.useState(data);

  useEffect(() => {
    // Reset animation value
    animatedData.setValue(0);

    // Store the previous data
    const previousData = [...currentData.current];
    currentData.current = data;

    // Animate the transition
    Animated.timing(animatedData, {
      toValue: 1,
      duration: 300, // Adjust duration as needed
      useNativeDriver: false, // We must use false to animate the "data" array
    }).start();

    // Update display data during animation
    animatedData.addListener(({value}) => {
      const newData = data.map((target, index) => {
        const start = previousData[index] ?? target;
        return start + (target - start) * value;
      });
      setDisplayData(newData);
    });

    // Cleanup listener
    return () => {
      animatedData.removeAllListeners();
    };
  }, [data, animatedData]);

  return (
    <View>
      <LineChart
        data={{
          labels: ['', '', '', '', '', ''],
          datasets: [
            {
              data: displayData,
              strokeWidth: 4,
              color: () => '#318EF8',
            },
          ],
        }}
        width={screenWidth - 32}
        height={200}
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 2,
          color: () => '#318EF8',
          labelColor: () => '#666666',
          // Removed yAxisLabel property (it is not allowed in AbstractChartConfig)
          formatYLabel: (yValue: string) => `$${yValue}`, // Format each Y-axis label with a '$'
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '0',
          },
          propsForBackgroundLines: {
            strokeWidth: 0,
          },
          propsForLabels: {
            fontSize: 10,
          },
        }}
        bezier
        withDots={true}
        withHorizontalLines={true} // Show horizontal grid lines
        withVerticalLines={false} // Hide vertical grid lines
        withHorizontalLabels={true} // Show Y-axis labels for price scale
        withVerticalLabels={false} // Hide X-axis labels
        renderDotContent={({x, y, index}) => {
          // Show a larger dot at the last data point
          if (index === displayData.length - 1) {
            return (
              <Circle
                key={index}
                cx={x}
                cy={y}
                r={6}
                stroke="#318EF8"
                strokeWidth={4}
                fill="white"
              />
            );
          }
          return null;
        }}
        withShadow={false}
        style={{
          marginVertical: 8,
          borderRadius: 16,
          paddingRight: 4,
          paddingLeft: 8,
        }}
      />
    </View>
  );
};

export default LineGraph;
