import React, {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
  useLayoutEffect,
} from 'react';
import {View, Dimensions, Animated, Easing, PanResponder} from 'react-native';
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

  const [displayData, setDisplayData] = useState(data);
  const [tooltipPos, setTooltipPos] = useState<{
    x: number;
    y: number;
    index: number;
    price: number;
  } | null>(null);

  // We’ll store requestAnimationFrame IDs here so we can cancel on cleanup.
  const rafIdRef = useRef<number | null>(null);

  // For easy comparison of old vs new props
  const prevPropsRef = useRef({
    dataLength: data.length,
    executionPrice,
    executionTimestamp,
  });

  // Precompute min/max for quick usage
  const dataRange = useMemo(() => {
    if (!data || data.length === 0) return {min: 0, max: 0, range: 0};
    const min = Math.min(...data);
    const max = Math.max(...data);
    return {min, max, range: max - min};
  }, [data]);

  // Helper: convert timestamps (various forms) to ms
  const getTimestampInMs = (
    timestamp: string | number | Date | undefined,
  ): number | undefined => {
    if (!timestamp) return undefined;
    if (typeof timestamp === 'number') return timestamp;
    if (typeof timestamp === 'string') return new Date(timestamp).getTime();
    if (timestamp instanceof Date) return timestamp.getTime();
    return undefined;
  };

  // Interpolate the Y position for a given data point
  const interpolateY = useCallback(
    (dataPoint: number) => {
      const chartHeight = 200 - 20; // slight offset
      const ratio =
        (dataPoint - dataRange.min) /
        (dataRange.range === 0 ? 1 : dataRange.range);
      return chartHeight - ratio * chartHeight + 10;
    },
    [dataRange],
  );

  // Calculate tooltip position
  const calculateTooltipPosition = useCallback(
    (locationX: number) => {
      if (!data || data.length === 0) return;

      // chart width minus chart kit’s default padding
      const chartWidth = screenWidth - 40;
      const segmentWidth = chartWidth / (data.length - 1);

      let index = Math.round(locationX / segmentWidth);
      index = Math.max(0, Math.min(data.length - 1, index));

      const dataPoint = displayData[index];
      const y = interpolateY(dataPoint);

      setTooltipPos({x: locationX, y, index, price: dataPoint});
    },
    [data, displayData, screenWidth, interpolateY],
  );

  // For the pan responder, we now use requestAnimationFrame for super-smooth updates
  const handleTooltip = useCallback(
    (e: any) => {
      if (!data || data.length === 0) return;
      const locationX = e?.nativeEvent?.locationX;
      if (locationX == null) return;

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(() => {
        calculateTooltipPosition(locationX);
      });
    },
    [calculateTooltipPosition, data],
  );

  const clearTooltip = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setTooltipPos(null);
  }, []);

  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: handleTooltip,
      onPanResponderMove: handleTooltip,
      onPanResponderRelease: clearTooltip,
      onPanResponderTerminate: clearTooltip,
    });
  }, [handleTooltip, clearTooltip]);

  // Smoothly animate from old data to new data
  useEffect(() => {
    const dataChanged =
      data.length !== prevPropsRef.current.dataLength ||
      JSON.stringify(data) !== JSON.stringify(currentData.current);

    if (!dataChanged) return;

    prevPropsRef.current = {
      dataLength: data.length,
      executionPrice,
      executionTimestamp,
    };

    // Reset the animation value
    animatedData.setValue(0);

    const prevData = [...currentData.current];
    currentData.current = data;

    // Kick off a smooth animation
    Animated.timing(animatedData, {
      toValue: 1,
      duration: 400, // slightly longer for a smoother effect
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // During the animation, linearly interpolate between prevData and new data
    const animId = animatedData.addListener(({value}) => {
      const newData = data.map((target, i) => {
        const start = prevData[i] ?? target;
        return start + (target - start) * value;
      });
      setDisplayData(newData);
    });

    return () => {
      animatedData.removeListener(animId);
    };
  }, [data, animatedData, executionPrice, executionTimestamp]);

  // Clean up requestAnimationFrame on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // Format date/time
  const formatTimestamp = useCallback((ts: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleString(undefined, {
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

  // Avatar logic
  const avatarUri = useMemo(() => {
    if (!userAvatar) return null;
    if (typeof userAvatar === 'string') return userAvatar;
    if (userAvatar.uri) return userAvatar.uri;
    return null;
  }, [userAvatar]);

  // Figure out which index to place the “execution” marker
  const executionIndex = useMemo(() => {
    if (!executionPrice || data.length === 0) return -1;

    // if we have timestamps & data is time-based
    if (
      timestamps &&
      timestamps.length === data.length &&
      executionTimestamp != null
    ) {
      const parsedExecTs = getTimestampInMs(executionTimestamp);
      if (!parsedExecTs) return findClosestByPrice();

      const lastTime = Number(timestamps[timestamps.length - 1]);
      const firstTime = Number(timestamps[0]);

      // If it's beyond the chart range, clamp to edges
      if (parsedExecTs > lastTime) return data.length - 1;
      if (parsedExecTs < firstTime) return 0;

      let closest = 0;
      let minDiff = Math.abs(Number(timestamps[0]) - parsedExecTs);

      for (let i = 1; i < timestamps.length; i++) {
        const diff = Math.abs(Number(timestamps[i]) - parsedExecTs);
        if (diff < minDiff) {
          minDiff = diff;
          closest = i;
        }
      }
      return closest;
    }

    // otherwise do a simple price-based approach
    return findClosestByPrice();

    function findClosestByPrice() {
      let cIdx = 0;
      let best = Math.abs(data[0] - executionPrice);
      for (let i = 1; i < data.length; i++) {
        const diff = Math.abs(data[i] - executionPrice);
        if (diff < best) {
          best = diff;
          cIdx = i;
        }
      }
      return cIdx;
    }
  }, [executionPrice, data, timestamps, executionTimestamp]);

  // Config for the chart
  const chartConfig = useMemo(
    () => ({
      backgroundColor: '#ffffff',
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: 2,
      color: () => '#318EF8',
      labelColor: () => '#666666',
      formatYLabel: (yValue: string) => `$${yValue}`,
      style: {borderRadius: 16},
      propsForDots: {
        r: '0',
      },
      propsForBackgroundLines: {
        strokeWidth: 0,
      },
      propsForLabels: {
        fontSize: 10,
      },
    }),
    [],
  );

  // Data passed to the chart
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

  // We'll store each data point's (x, y) so we can build our hover fill
  const pointsRef = useRef<{x: number; y: number}[]>([]);

  // Renders the tooltip above the touched point
  const renderTooltip = useCallback(
    (x: number, y: number, idx: number, price: number) => {
      // We’ll shift the tooltip to avoid edges if needed
      const isNearLeft = x < 120;
      const isNearRight = x > screenWidth - 120;
      const tooltipW = 150;
      let tX = x;
      let anchor: 'start' | 'middle' | 'end' = 'middle';

      if (isNearLeft) {
        tX = tooltipW / 2 + 10;
        anchor = 'middle';
      } else if (isNearRight) {
        tX = screenWidth - 42 - tooltipW / 2;
        anchor = 'middle';
      }

      return (
        <React.Fragment key={`tooltip-${idx}`}>
          {/* vertical dash line */}
          <Line
            x1={x}
            y1={10}
            x2={x}
            y2={190}
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
          {/* actual tooltip box */}
          <G>
            <Defs>
              <LinearGradient id="tooltipBg" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
                <Stop offset="1" stopColor="#F8FCFF" stopOpacity={1} />
              </LinearGradient>
            </Defs>

            <Rect
              x={tX - tooltipW / 2}
              y={18}
              width={tooltipW}
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
              textAnchor={anchor}>
              {formatPrice(price)}
            </SvgText>

            {timestamps && timestamps.length > idx && (
              <SvgText
                x={tX}
                y={58}
                fill="#666"
                fontSize="12"
                textAnchor={anchor}>
                {formatTimestamp(timestamps[idx])}
              </SvgText>
            )}
          </G>
        </React.Fragment>
      );
    },
    [formatPrice, formatTimestamp, screenWidth, timestamps],
  );

  // Called by chart to place custom dot content
  const renderDotContent = useCallback(
    ({x, y, index}: {x: number; y: number; index: number}) => {
      pointsRef.current[index] = {x, y};

      const items = [];

      // If this is the last data point, draw a highlight ring
      if (index === displayData.length - 1) {
        items.push(
          <Circle
            key={`end-dot-${index}`}
            cx={x}
            cy={y}
            r={6}
            stroke="#318EF8"
            strokeWidth={4}
            fill="white"
          />,
        );
      }

      // If we have an execution marker on this index
      if (executionPrice && index === executionIndex) {
        items.push(
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

      // If user is hovering at this index, show the tooltip
      if (tooltipPos && index === tooltipPos.index) {
        items.push(renderTooltip(x, y, index, tooltipPos.price));
      }

      return items;
    },
    [
      displayData,
      executionPrice,
      executionIndex,
      avatarUri,
      executionColor,
      tooltipPos,
      renderTooltip,
    ],
  );

  // Renders the partial fill from left up to the hovered data point
  const renderHoverFill = useCallback(() => {
    if (!tooltipPos) return null;
    const hoveredIndex = tooltipPos.index;
    if (!pointsRef.current.length || hoveredIndex >= pointsRef.current.length) {
      return null;
    }

    // build polygon from [0..hoveredIndex], then straight down
    let fillPoints = '';
    for (let i = 0; i <= hoveredIndex; i++) {
      const {x, y} = pointsRef.current[i];
      fillPoints += `${x},${y} `;
    }
    const lastX = pointsRef.current[hoveredIndex].x;
    const firstX = pointsRef.current[0].x;

    // bottom edge
    fillPoints += `${lastX},190 ${firstX},190`;

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
    <View>
      <View {...panResponder.panHandlers}>
        <LineChart
          data={chartData}
          width={screenWidth - 32}
          height={200}
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
            paddingRight: 4,
            paddingLeft: 8,
          }}
          renderDotContent={renderDotContent}
          decorator={renderHoverFill}
        />
      </View>
    </View>
  );
};

export default React.memo(LineGraph, (prev, next) => {
  // If critical props changed, re-render
  if (prev.data.length !== next.data.length) return false;
  if (prev.executionPrice !== next.executionPrice) return false;
  if (prev.executionTimestamp !== next.executionTimestamp) return false;
  if (prev.width !== next.width) return false;
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
