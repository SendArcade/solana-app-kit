import React, {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
  useLayoutEffect,
} from 'react';
import {
  View,
  Dimensions,
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  Text,
  ActivityIndicator,
} from 'react-native';
import {LineChart} from 'react-native-chart-kit';
import {
  Circle,
  ClipPath,
  Defs,
  Image as SvgImage,
  Line,
  Rect,
  G,
  Text as SvgText,
  LinearGradient,
  Stop,
  Polygon,
} from 'react-native-svg';

interface LineGraphProps {
  data: number[];
  width?: number;
  executionPrice?: number;
  executionTimestamp?: number;
  timestamps?: number[];
  executionColor?: string;
  userAvatar?: any;
  isLoading?: boolean;
}

/**
 * A line chart that handles its own hover tooltip
 * without the chart's built-in touch events.
 */
const LineGraph: React.FC<LineGraphProps> = ({
  data,
  width,
  executionPrice,
  executionTimestamp,
  timestamps,
  userAvatar,
  executionColor = '#FF5722',
  isLoading = false,
}) => {
  // The chart itself is 220px tall
  const chartHeight = 220;

  // We'll assume the caller either passes a width or we do a default
  const containerWidth = width || Dimensions.get('window').width - 32;

  // Adjusted padding to ensure rightmost points are visible
  const HORIZONTAL_PADDING = 20; // Increased from 12 to ensure rightmost dot is visible
  const usableChartWidth = containerWidth - HORIZONTAL_PADDING;

  // We'll animate data changes
  const animatedData = useRef(new Animated.Value(0)).current;
  const currentData = useRef(data);
  const [displayData, setDisplayData] = useState(data);

  // Our tooltip state
  const [tooltipPos, setTooltipPos] = useState<{
    x: number;
    y: number;
    index: number;
    price: number;
  } | null>(null);

  // Keep track of old data length to see if the data truly changed
  const prevDataLengthRef = useRef(data.length);

  // Precompute min/max
  const dataRange = useMemo(() => {
    if (!data || data.length === 0) return {min: 0, max: 0, range: 0};
    const min = Math.min(...data);
    const max = Math.max(...data);
    return {min, max, range: max - min};
  }, [data]);

  // Convert potentially second-based timestamps to ms
  const convertTimestampToMs = (timestamp: number): number => {
    const year2000 = 946684800000;
    if (timestamp < year2000 / 1000) {
      return timestamp * 1000;
    }
    const now = Date.now();
    if (timestamp > 946684800 && timestamp < now / 100) {
      return timestamp * 1000;
    }
    return timestamp;
  };

  // Calculate the Y position for a dataPoint
  const interpolateY = useCallback(
    (dataPoint: number) => {
      const availableHeight = chartHeight - 20;
      const ratio =
        (dataPoint - dataRange.min) /
        (dataRange.range === 0 ? 1 : dataRange.range);
      return availableHeight - ratio * availableHeight + 10;
    },
    [dataRange],
  );

  // Called each time the user moves or presses
  const calculateTooltipPosition = useCallback(
    (rawX: number) => {
      if (data.length === 0) {
        return;
      }

      // Clamp the X so it doesn't go beyond the chart
      let clampedX = Math.max(0, Math.min(rawX, usableChartWidth));

      const segmentWidth = usableChartWidth / (data.length - 1);
      let index = Math.round(clampedX / segmentWidth);
      index = Math.max(0, Math.min(data.length - 1, index));

      const dataPoint = displayData[index];
      const y = interpolateY(dataPoint);

      setTooltipPos({x: clampedX, y, index, price: dataPoint});
    },
    [data, displayData, usableChartWidth, interpolateY],
  );

  // PanResponder to track finger movement across the overlay
  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: evt => {
        calculateTooltipPosition(evt.nativeEvent.locationX);
      },
      onPanResponderMove: evt => {
        calculateTooltipPosition(evt.nativeEvent.locationX);
      },
      onPanResponderRelease: () => {
        setTooltipPos(null);
      },
      onPanResponderTerminate: () => {
        setTooltipPos(null);
      },
    });
  }, [calculateTooltipPosition]);

  // Animate from old data to new data only if the array truly changed
  useLayoutEffect(() => {
    const dataChanged =
      data.length !== prevDataLengthRef.current ||
      JSON.stringify(data) !== JSON.stringify(currentData.current);

    if (!dataChanged) {
      return;
    }
    prevDataLengthRef.current = data.length;

    // Start animation
    animatedData.setValue(0);
    const prevData = [...currentData.current];
    currentData.current = data;

    Animated.timing(animatedData, {
      toValue: 1,
      duration: 400,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Linear interpolation for the displayed data
    const id = animatedData.addListener(({value}) => {
      const newData = data.map((target, i) => {
        const start = prevData[i] ?? target;
        return start + (target - start) * value;
      });
      setDisplayData(newData);
    });

    return () => {
      animatedData.removeListener(id);
    };
  }, [data, animatedData]);

  // Format date/time
  const formatTimestamp = useCallback((ts: number) => {
    if (!ts) return '';
    const inMs = ts < 10000000000 ? ts * 1000 : ts;
    const d = new Date(inMs);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Format price
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(price);
  }, []);

  // Convert userAvatar into a string URI if possible
  const avatarUri = useMemo(() => {
    if (!userAvatar) return null;
    if (typeof userAvatar === 'string') return userAvatar;
    if (userAvatar.uri) return userAvatar.uri;
    return null;
  }, [userAvatar]);

  // Figure out where to place the "execution" marker
  const executionIndex = useMemo(() => {
    if (!executionPrice || data.length === 0) return -1;

    // If we have timestamps
    if (timestamps && timestamps.length === data.length && executionTimestamp) {
      let parsedExecTs =
        typeof executionTimestamp === 'number'
          ? executionTimestamp
          : Date.parse(String(executionTimestamp));

      if (Number.isNaN(parsedExecTs)) {
        // fallback to price-based below if parse failed
      } else {
        parsedExecTs = convertTimestampToMs(parsedExecTs);

        const timeInMs = timestamps.map(t => (t < 10000000000 ? t * 1000 : t));
        const first = timeInMs[0];
        const last = timeInMs[timeInMs.length - 1];
        if (parsedExecTs < first) return 0;
        if (parsedExecTs > last) return data.length - 1;

        let closest = 0;
        let minDiff = Math.abs(timeInMs[0] - parsedExecTs);
        for (let i = 1; i < timeInMs.length; i++) {
          const diff = Math.abs(timeInMs[i] - parsedExecTs);
          if (diff < minDiff) {
            minDiff = diff;
            closest = i;
          }
        }
        return closest;
      }
    }

    // fallback: find by price
    let idx = 0;
    let best = Math.abs(data[0] - executionPrice);
    for (let i = 1; i < data.length; i++) {
      const diff = Math.abs(data[i] - executionPrice);
      if (diff < best) {
        best = diff;
        idx = i;
      }
    }
    return idx;
  }, [data, timestamps, executionPrice, executionTimestamp]);

  // Chart config
  const chartConfig = useMemo(
    () => ({
      backgroundColor: '#ffffff',
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: 2,
      color: () => '#318EF8',
      labelColor: () => '#666666',
      formatYLabel: (v: string) => `$${v}`,
      style: {borderRadius: 16},
      propsForDots: {r: '0'},
      propsForBackgroundLines: {strokeWidth: 0},
      propsForLabels: {fontSize: 10},
    }),
    [],
  );

  // Data to feed to the chart library
  const chartData = useMemo(
    () => ({
      labels: ['', '', '', '', '', ''],
      datasets: [
        {
          data: displayData,
          strokeWidth: 4,
          color: () => '#318EF8',
        },
      ],
    }),
    [displayData],
  );

  // Keep track of each data point's (x, y)
  const pointsRef = useRef<{x: number; y: number}[]>([]);

  // Build the tooltip's SVG elements
  const renderTooltip = useCallback(
    (x: number, y: number, idx: number, price: number) => {
      // Shift tooltip horizontally if near edges
      const tooltipWidth = 150;
      const isNearLeft = x < 120;
      const isNearRight = x > usableChartWidth - 120;

      let tX = x;
      let anchor: 'start' | 'middle' | 'end' = 'middle';

      if (isNearLeft) {
        tX = tooltipWidth / 2 + 10;
      } else if (isNearRight) {
        tX = usableChartWidth - tooltipWidth / 2 - 10;
      }

      return (
        <React.Fragment key={`tooltip-${idx}`}>
          {/* dashed line */}
          <Line
            x1={x}
            y1={10}
            x2={x}
            y2={chartHeight - 10}
            stroke="#318EF8"
            strokeWidth={1.5}
            strokeDasharray="3,3"
            strokeOpacity={0.8}
          />
          {/* highlight circle */}
          <Circle
            cx={x}
            cy={y}
            r={5}
            fill="#318EF8"
            stroke="white"
            strokeWidth={2}
          />
          {/* tooltip rect + text */}
          <G>
            <Defs>
              <LinearGradient id="tooltipBg" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
                <Stop offset="1" stopColor="#F8FCFF" stopOpacity={1} />
              </LinearGradient>
            </Defs>

            <Rect
              x={tX - tooltipWidth / 2}
              y={18}
              width={tooltipWidth}
              height={60}
              rx={12}
              fill="url(#tooltipBg)"
              stroke="#D0E8FF"
              strokeWidth={1.5}
            />

            <SvgText
              x={tX}
              y={40}
              fill="#1A73E8"
              fontSize="16"
              fontWeight="bold"
              textAnchor="middle">
              {formatPrice(price)}
            </SvgText>
            {timestamps && timestamps[idx] && (
              <SvgText
                x={tX}
                y={58}
                fill="#666"
                fontSize="12"
                textAnchor="middle">
                {formatTimestamp(timestamps[idx])}
              </SvgText>
            )}
          </G>
        </React.Fragment>
      );
    },
    [formatPrice, formatTimestamp, usableChartWidth, chartHeight, timestamps],
  );

  // Called by the chart for each data point
  const renderDotContent = useCallback(
    ({x, y, index}: {x: number; y: number; index: number}) => {
      pointsRef.current[index] = {x, y};

      const elements: JSX.Element[] = [];

      // If we have an execution marker
      if (executionPrice && index === executionIndex) {
        elements.push(
          <React.Fragment key={`exec-${index}`}>
            {avatarUri ? (
              <>
                <Defs>
                  <ClipPath id={`avatar-clip-${index}`}>
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
                  clipPath={`url(#avatar-clip-${index})`}
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

      // Make rightmost point visible
      if (index === data.length - 1) {
        elements.push(
          <Circle
            key={`last-point-${index}`}
            cx={x}
            cy={y}
            r={6}
            fill="#318EF8"
            stroke="white"
            strokeWidth={2}
          />
        );
      }

      // If user is hovering near this point
      if (tooltipPos && index === tooltipPos.index) {
        elements.push(renderTooltip(x, y, index, tooltipPos.price));
      }

      return elements;
    },
    [
      executionPrice,
      executionIndex,
      avatarUri,
      executionColor,
      tooltipPos,
      renderTooltip,
      data.length,
    ],
  );

  // Partial fill from left to hovered point
  const renderHoverFill = useCallback(() => {
    if (!tooltipPos) return null;
    const hoveredIndex = tooltipPos.index;
    if (!pointsRef.current[hoveredIndex]) {
      return null;
    }

    let fillPoints = '';
    for (let i = 0; i <= hoveredIndex; i++) {
      const {x, y} = pointsRef.current[i];
      fillPoints += `${x},${y} `;
    }

    const {x: lastX} = pointsRef.current[hoveredIndex];
    const {x: firstX} = pointsRef.current[0];

    // go down to bottom
    fillPoints += `${lastX},${chartHeight - 10} ${firstX},${chartHeight - 10}`;

    return (
      <G>
        <Defs>
          <LinearGradient id="hoverFillGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#318EF8" stopOpacity={0.2} />
            <Stop offset="1" stopColor="#318EF8" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Polygon fill="url(#hoverFillGradient)" points={fillPoints.trim()} />
      </G>
    );
  }, [tooltipPos]);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#1d9bf0" />
        </View>
      ) : (
        <>
          <LineChart
            data={chartData}
            width={containerWidth}
            height={chartHeight}
            chartConfig={chartConfig}
            bezier
            withDots
            withHorizontalLines
            withVerticalLines={false}
            withHorizontalLabels
            withVerticalLabels={false}
            withShadow={false}
            style={{
              marginVertical: 8,
              borderRadius: 16,
              paddingRight: 12, // Increased to ensure rightmost dot is visible
              paddingLeft: 8,
            }}
            renderDotContent={renderDotContent}
            decorator={renderHoverFill}
          />

          {/* Transparent overlay that captures all pointer events */}
          <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default React.memo(LineGraph, (prev, next) => {
  if (prev.data.length !== next.data.length) return false;
  if (prev.executionPrice !== next.executionPrice) return false;
  if (prev.executionTimestamp !== next.executionTimestamp) return false;
  if (prev.width !== next.width) return false;
  if (prev.isLoading !== next.isLoading) return false;
  if (JSON.stringify(prev.data) !== JSON.stringify(next.data)) return false;

  // Compare timestamps array
  if (
    prev.timestamps &&
    next.timestamps &&
    JSON.stringify(prev.timestamps) !== JSON.stringify(next.timestamps)
  ) {
    return false;
  }

  return true;
});
