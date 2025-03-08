import React, { useEffect, useRef } from 'react';
import { View, Dimensions, Animated } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Circle } from 'react-native-svg';

interface LineGraphProps {
  data: number[];
  width?: number;
}

const LineGraph: React.FC<LineGraphProps> = ({ data, width }) => {
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
      useNativeDriver: true,
    }).start();

    // Update display data during animation
    animatedData.addListener(({ value }) => {
      const newData = data.map((target, index) => {
        const start = previousData[index] || target;
        return start + (target - start) * value;
      });
      setDisplayData(newData);
    });

    // Cleanup listener
    return () => {
      animatedData.removeAllListeners();
    };
  }, [data]);

  return (
    <LineChart
      data={{
        labels: ["", "", "", "", "", ""],
        datasets: [
          {
            data: displayData,
            strokeWidth: 4,
            color: () => '#318EF8'
          }
        ]
      }}
      width={screenWidth - 32}
      height={200}
      chartConfig={{
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 0,
        color: () => 'transparent',
        labelColor: () => 'transparent',
        style: {
          borderRadius: 16
        },
        propsForDots: {
          r: '0',
        },
        propsForBackgroundLines: {
          strokeWidth: 0
        },
        propsForLabels: {
          fontSize: 0
        }
      }}
      bezier
      withHorizontalLines={false}
      withVerticalLines={false}
      withDots={true}
      renderDotContent={({x, y, index}) => {
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
        paddingLeft: 8
      }}
    />
  );
};

export default LineGraph;