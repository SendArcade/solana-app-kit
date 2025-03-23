// FILE: src/components/CoinDetails/CoinDetailTopSection/LineGraph.tsx

import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Dimensions,
  Animated,
  Text,
  ImageSourcePropType,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Circle, ClipPath, Defs, Image as SvgImage } from 'react-native-svg';

interface LineGraphProps {
  data: number[];
  width?: number;
  executionPrice?: number;
  executionTimestamp?: number;
  timestamps?: number[];
  executionColor?: string;
  userAvatar?: any;
}

const LineGraph: React.FC<LineGraphProps> = ({
  data,
  width,
  executionPrice,
  executionTimestamp,
  timestamps,
  userAvatar,
  executionColor = '#FF5722',
}) => {
  const screenWidth = width || Dimensions.get('window').width - 32;
  const animatedData = useRef(new Animated.Value(0)).current;
  const currentData = useRef(data);
  const [displayData, setDisplayData] = React.useState(data);
  
  // Store the previous props to avoid unnecessary calculations
  const prevPropsRef = useRef({
    dataLength: data.length,
    executionPrice,
    executionTimestamp,
  });

  const getTimestampInMs = (
    timestamp: string | number | Date | undefined,
  ): number | undefined => {
    if (!timestamp) return undefined;

    if (typeof timestamp === 'number') {
      return timestamp; // Already a number
    }

    if (typeof timestamp === 'string') {
      return new Date(timestamp).getTime(); // Convert ISO string to milliseconds
    }

    if (timestamp instanceof Date) {
      return timestamp.getTime(); // Get milliseconds from Date object
    }

    return undefined;
  };

  // Only animate if data has actually changed
  useEffect(() => {
    // Check if data has changed
    const dataChanged = 
      data.length !== prevPropsRef.current.dataLength ||
      JSON.stringify(data) !== JSON.stringify(currentData.current);
      
    if (!dataChanged) return;
      
    // Set initial display data to avoid null rendering
    if (data && data.length > 0 && (!displayData || displayData.length === 0)) {
      setDisplayData([...data]);
    }

    // Store current values for next comparison
    prevPropsRef.current = {
      dataLength: data.length,
      executionPrice,
      executionTimestamp,
    };

    // Reset animation value
    animatedData.setValue(0);

    // Store the previous data for animation
    const previousData = [...currentData.current];
    currentData.current = data;

    // Animate to new data - make animation faster (200ms instead of 300ms)
    Animated.timing(animatedData, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();

    // Update display data during animation
    animatedData.addListener(({value}) => {
      const newData = data.map((target, index) => {
        const start = previousData[index] ?? target;
        return start + (target - start) * value;
      });
      setDisplayData(newData);
    });

    return () => {
      animatedData.removeAllListeners();
    };
  }, [data, animatedData]);

  const avatarUri = useMemo(() => {
    if (!userAvatar) return null;

    if (typeof userAvatar === 'string') {
      return userAvatar;
    } else if (userAvatar.uri) {
      return userAvatar.uri;
    }

    return null;
  }, [userAvatar]);

  // Memoize execution point calculation for performance
  const executionIndex = useMemo(() => {
    if (!executionPrice || data.length === 0) return -1;
    
    // Make sure we have all required data for time-based positioning
    if (
      timestamps &&
      timestamps.length > 0 &&
      data.length > 0 &&
      timestamps.length === data.length &&
      executionTimestamp
    ) {
      // Handle different timestamp formats
      const parsedExecTimestamp = getTimestampInMs(executionTimestamp);
      if (!parsedExecTimestamp) {
        return findNearestPriceIndex();
      }

      // Explicitly cast to numbers to ensure correct comparison
      const execTime = parsedExecTimestamp;
      const lastTime = Number(timestamps[timestamps.length - 1]);

      // IMPORTANT: Set a tolerance for "very close" timestamps
      // If execution is within 1 minute of the last data point, consider it at the end
      const ONE_MINUTE = 60 * 1000;
      if (Math.abs(execTime - lastTime) < ONE_MINUTE || execTime > lastTime) {
        return data.length - 1; // Last data point in the chart
      }

      // If execution time is beyond the lastTime, also place on the last data point
      if (execTime > lastTime) {
        return data.length - 1;
      }

      // If execution is BEFORE the chart range - place at start of chart
      const firstTime = Number(timestamps[0]);
      if (execTime < firstTime) {
        return 0; // First data point in the chart
      }

      // If execution time is within range, find closest time index
      let closestIndex = 0;
      let minTimeDiff = Math.abs(firstTime - execTime);

      for (let i = 1; i < timestamps.length; i++) {
        const timeDiff = Math.abs(Number(timestamps[i]) - execTime);
        if (timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff;
          closestIndex = i;
        }
      }

      return closestIndex;
    }

    return findNearestPriceIndex();
    
    // Price-based positioning helper
    function findNearestPriceIndex() {
      if (!data || data.length === 0) return -1;

      let closestIndex = 0;
      let minPriceDiff = Math.abs(data[0] - Number(executionPrice));

      for (let i = 1; i < data.length; i++) {
        const priceDiff = Math.abs(data[i] - Number(executionPrice));
        if (priceDiff < minPriceDiff) {
          minPriceDiff = priceDiff;
          closestIndex = i;
        }
      }

      return closestIndex;
    }
  }, [executionPrice, executionTimestamp, data, timestamps]);

  // Memoize chart config to prevent unnecessary recalculations
  const chartConfig = useMemo(() => ({
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2,
    color: () => '#318EF8',
    labelColor: () => '#666666',
    formatYLabel: (yValue: string) => `$${yValue}`,
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
  }), []);

  // Memoize chart data to prevent unnecessary recalculations
  const chartData = useMemo(() => ({
    labels: ['', '', '', '', '', ''],
    datasets: [
      {
        data: displayData,
        strokeWidth: 4,
        color: () => '#318EF8',
      },
    ],
  }), [displayData]);

  return (
    <View>
      <LineChart
        data={chartData}
        width={screenWidth - 32}
        height={200}
        chartConfig={chartConfig}
        bezier
        withDots={true}
        withHorizontalLines={true}
        withVerticalLines={false}
        withHorizontalLabels={true}
        withVerticalLabels={false}
        withShadow={false}
        style={{
          marginVertical: 8,
          borderRadius: 16,
          paddingRight: 4,
          paddingLeft: 8,
        }}
        renderDotContent={({x, y, index}) => {
          const elements = [];

          // If it's the last data point => draw its circle first.
          if (index === displayData.length - 1) {
            elements.push(
              <Circle
                key={`last-${index}`}
                cx={x}
                cy={y}
                r={6}
                stroke="#318EF8"
                strokeWidth={4}
                fill="white"
              />,
            );
          }

          // If execution marker belongs here, add it after => ensures avatar on top.
          if (executionPrice && index === executionIndex) {
            elements.push(
              <React.Fragment key={`execution-${index}`}>
                {avatarUri ? (
                  <>
                    <Defs>
                      <ClipPath id={`clip-${index}`}>
                        <Circle cx={x} cy={y} r={8} />
                      </ClipPath>
                    </Defs>

                    <Circle
                      cx={x}
                      cy={y}
                      r={9}
                      stroke={executionColor}
                      strokeWidth={1}
                      fill="white"
                    />

                    <SvgImage
                      x={x - 8}
                      y={y - 8}
                      width={20}
                      height={20}
                      href={{uri: avatarUri}}
                      clipPath={`url(#clip-${index})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </>
                ) : (
                  <>
                    <Circle
                      cx={x}
                      cy={y}
                      r={8}
                      stroke={executionColor}
                      strokeWidth={3}
                      fill="white"
                    />
                    <Circle cx={x} cy={y} r={4} fill={executionColor} />
                  </>
                )}
              </React.Fragment>,
            );
          }

          return elements;
        }}
      />
    </View>
  );
};

// Add memo to prevent unnecessary re-renders
export default React.memo(LineGraph, (prevProps, nextProps) => {
  // Only re-render if these important props change
  if (prevProps.data.length !== nextProps.data.length) return false;
  if (prevProps.executionPrice !== nextProps.executionPrice) return false;
  if (prevProps.executionTimestamp !== nextProps.executionTimestamp) return false;
  if (prevProps.width !== nextProps.width) return false;
  
  // If data arrays are different, we need to re-render
  if (JSON.stringify(prevProps.data) !== JSON.stringify(nextProps.data)) return false;
  
  // If timestamps arrays are different, we need to re-render
  if (
    (prevProps.timestamps && nextProps.timestamps) &&
    JSON.stringify(prevProps.timestamps) !== JSON.stringify(nextProps.timestamps)
  ) {
    return false;
  }
  
  // Otherwise, don't re-render
  return true;
});
