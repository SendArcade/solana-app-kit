// FILE: src/components/CoinDetails/CoinDetailTopSection/LineGraph.tsx

import React, {useEffect, useRef} from 'react';
import {
  View,
  Dimensions,
  Animated,
  Text,
  ImageSourcePropType,
} from 'react-native';
import {LineChart} from 'react-native-chart-kit';
import {Circle, ClipPath, Defs, Image as SvgImage} from 'react-native-svg';

interface LineGraphProps {
  data: number[];
  width?: number;
  executionPrice?: number; // Add this new prop
  executionTimestamp?: number; // Add this new prop
  timestamps?: number[];
  executionColor?: string; // Optional color for the execution marker
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

  useEffect(() => {
    // Set initial display data to avoid null rendering
    if (data && data.length > 0 && (!displayData || displayData.length === 0)) {
      setDisplayData([...data]);
    }

    // Reset animation value
    animatedData.setValue(0);

    // Store the previous data for animation
    const previousData = [...currentData.current];
    currentData.current = data;

    const parsedExecTimestamp = getTimestampInMs(executionTimestamp);

    if (timestamps && timestamps.length > 0) {

      const sortOrder =
        timestamps[1] > timestamps[0] ? 'ascending' : 'descending';
    }

    // Animate to new data
    Animated.timing(animatedData, {
      toValue: 1,
      duration: 300,
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
  }, [data, timestamps, executionTimestamp, executionPrice, animatedData]);

  // console.log(executionTimestamp, "////////////");

  const getAvatarUri = () => {
    if (!userAvatar) return null;

    if (typeof userAvatar === 'string') {
      return userAvatar;
    } else if (userAvatar.uri) {
      return userAvatar.uri;
    }

    return null;
  };

  const avatarUri = getAvatarUri();

  // console.log('Avatar URI:', avatarUri);

  const findExecutionPointIndex = () => {
    if (!executionPrice) {
      console.log('No execution price provided, skipping marker');
      return -1;
    }

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

      // [ADDED NEW FALLBACK CHECK]
      // If for any reason the execution time is still beyond the lastTime, also place on the last data point
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

      console.log('Found time-based index:', closestIndex);
      return closestIndex;
    }

    console.log('Falling back to price-based positioning');
    return findNearestPriceIndex();

    // Price-based positioning helper (defined inside findExecutionPointIndex)
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

      console.log('Using price-based index:', closestIndex);
      return closestIndex;
    }
  };

  const findNearestPriceIndex = () => {
    if (!executionPrice || data.length === 0) return -1;

    // Find the index of the closest price point to the execution price
    let closestIndex = 0;
    let minDiff = Math.abs(data[0] - executionPrice);

    for (let i = 1; i < data.length; i++) {
      const diff = Math.abs(data[i] - executionPrice);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }

    return closestIndex;
  };

  const executionIndex = findExecutionPointIndex();

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
        withShadow={false}
        style={{
          marginVertical: 8,
          borderRadius: 16,
          paddingRight: 4,
          paddingLeft: 8,
        }}
        // ADJUSTED: We push circle(s) into an array so the user avatar is rendered last (on top).
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

          // If no conditions matched, elements is empty => no custom dot.
          return elements;
        }}
      />
    </View>
  );
};

export default LineGraph;
