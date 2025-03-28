import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { LineChart } from 'react-native-chart-kit';
import BN from 'bn.js';

import {
  CHART_WIDTH,
  BondingCurveConfiguratorStyles as defaultStyles,
} from './BondingCurveConfigurator.styles';

/**
 * Available curve types for the bonding curve configuration
 * @type {'linear' | 'power' | 'exponential' | 'logarithmic'}
 */
type CurveType = 'linear' | 'power' | 'exponential' | 'logarithmic';

/**
 * Props for the BondingCurveConfigurator component
 * @interface BondingCurveConfiguratorProps
 */
interface BondingCurveConfiguratorProps {
  /** Callback function that receives updated ask and bid prices */
  onCurveChange: (askPrices: BN[], bidPrices: BN[]) => void;
  /** Optional style overrides to customize the UI */
  styleOverrides?: Partial<typeof defaultStyles>;
  /** Whether the configurator is disabled */
  disabled?: boolean;
}

/** Initial default BN arrays for Android to avoid Infinity errors */
const initialAskBnAndroid = [
  new BN(28),
  new BN(29),
  new BN(32),
  new BN(47),
  new BN(110),
  new BN(380),
  new BN(1500),
  new BN(6400),
  new BN(27000),
  new BN(120000),
  new BN(500000),
];
const initialBidBnAndroid = initialAskBnAndroid.map(price =>
  // 99% of ask
  price.muln(99).divn(100),
);

/**
 * A component for configuring bonding curves with visual feedback
 *
 * @component
 * @description
 * BondingCurveConfigurator provides an interactive interface for configuring
 * bonding curves with real-time visual feedback. It supports multiple curve types
 * and allows users to adjust various parameters through sliders.
 *
 * Features:
 * - Multiple curve types (linear, power, exponential, logarithmic)
 * - Real-time curve visualization
 * - Adjustable parameters:
 *   - Number of points
 *   - Base price
 *   - Top price
 *   - Power (for power curves)
 *   - Fee percentage
 * - Platform-specific optimizations
 * - Loading states
 * - Customizable styling
 *
 * @example
 * ```tsx
 * <BondingCurveConfigurator
 *   onCurveChange={(askPrices, bidPrices) => {
 *     console.log('New curve prices:', {askPrices, bidPrices});
 *   }}
 * />
 * ```
 */
export default function BondingCurveConfigurator({
  onCurveChange,
  styleOverrides = {},
  disabled = false,
}: BondingCurveConfiguratorProps) {
  /************************************
   * Refs
   ************************************/
  const onCurveChangeRef = useRef(onCurveChange);
  useEffect(() => {
    onCurveChangeRef.current = onCurveChange;
  }, [onCurveChange]);

  /************************************
   * State variables
   ************************************/
  const [askBn, setAskBn] = useState<BN[]>(
    Platform.OS === 'android' ? initialAskBnAndroid : [],
  );
  const [bidBn, setBidBn] = useState<BN[]>(
    Platform.OS === 'android' ? initialBidBnAndroid : [],
  );

  const [curveType, setCurveType] = useState<CurveType>('linear');

  // Slider values (committed)
  const [points, setPoints] = useState<number>(11);
  const [basePrice, setBasePrice] = useState<number>(10);
  const [topPrice, setTopPrice] = useState<number>(50000);
  const [power, setPower] = useState<number>(2.0);
  const [feePercent, setFeePercent] = useState<number>(2.0);

  // Used on Android to indicate computation in progress.
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Computes the bonding curve based on current parameters.
   * An optional overrideCurveType can be provided to immediately use a new curve type.
   * @param {Object} overrides - Optional parameter overrides for computation
   * @param {CurveType} overrideCurveType - Optional override for curve type
   * @returns {void}
   */
  const computeBondingCurve = useCallback(
    (
      overrides?: {
        points?: number;
        basePrice?: number;
        topPrice?: number;
        power?: number;
        feePercent?: number;
      },
      overrideCurveType?: CurveType,
    ) => {
      const localPoints = overrides?.points ?? points;
      const localBase = overrides?.basePrice ?? basePrice;
      const localTop = overrides?.topPrice ?? topPrice;
      const localPower = overrides?.power ?? power;
      const localFee = overrides?.feePercent ?? feePercent;

      // Use the overrideCurveType if provided; otherwise, use the current state value.
      const currentCurveType = overrideCurveType ?? curveType;

      const newAskBn: BN[] = [];
      const newBidBn: BN[] = [];

      for (let i = 0; i < localPoints; i++) {
        const t = i / Math.max(localPoints - 1, 1);
        let price: number;
        switch (currentCurveType) {
          case 'linear':
            price = localBase + t * (localTop - localBase);
            break;
          case 'power':
            price =
              localBase + (localTop - localBase) * Math.pow(t, localPower);
            break;
          case 'exponential': {
            const safeBase = localBase > 0 ? localBase : 1;
            price = safeBase * Math.pow(localTop / safeBase, t);
            break;
          }
          case 'logarithmic': {
            const logInput = 1 + 9 * t;
            const safeLog = logInput > 0 ? Math.log10(logInput) : 0;
            price = localBase + (localTop - localBase) * safeLog;
            break;
          }
          default:
            price = localBase + t * (localTop - localBase);
        }
        if (!Number.isFinite(price)) price = localBase;
        if (price < 0) price = 0;
        if (price > 1e9) price = 1e9;

        const askVal = new BN(Math.floor(price));
        let rawBid = price * (1 - localFee / 100);
        if (!Number.isFinite(rawBid)) rawBid = price;
        if (rawBid < 0) rawBid = 0;
        if (rawBid > 1e9) rawBid = 1e9;
        const bidVal = new BN(Math.floor(rawBid));

        newAskBn.push(askVal);
        newBidBn.push(bidVal);
      }
      setAskBn(newAskBn);
      setBidBn(newBidBn);
      onCurveChangeRef.current(newAskBn, newBidBn);
    },
    [points, basePrice, topPrice, power, feePercent, curveType],
  );

  /************************************
   * iOS: Realtime computation via onValueChange
   ************************************/
  useEffect(() => {
    if (Platform.OS === 'ios') {
      computeBondingCurve();
    }
  }, [
    Platform.OS,
    curveType,
    points,
    basePrice,
    topPrice,
    power,
    feePercent,
    computeBondingCurve,
  ]);

  /************************************
   * Android: Curve Type change handler
   ************************************/
  /**
   * Handles curve type changes with platform-specific behavior
   * @param {CurveType} type - The new curve type to set
   */
  const handleCurveTypePress = (type: CurveType) => {
    // Don't allow type changes when disabled
    if (disabled) return;

    setCurveType(type);
    setIsLoading(true);
    setTimeout(() => {
      computeBondingCurve({}, type);
      setIsLoading(false);
    }, 0);
  };

  /************************************
   * Android: Slider Callbacks
   ************************************/
  /**
   * Handles the start of slider interaction on Android
   */
  const onSlidingStartAndroid = () => {
    setIsLoading(true);
  };

  /**
   * Handles the completion of slider interaction on Android
   * @param {string} sliderType - The type of slider being adjusted
   * @param {number} val - The new value from the slider
   */
  const onSlidingCompleteAndroid = (
    sliderType: 'points' | 'basePrice' | 'topPrice' | 'power' | 'feePercent',
    val: number,
  ) => {
    const overrides: {
      points?: number;
      basePrice?: number;
      topPrice?: number;
      power?: number;
      feePercent?: number;
    } = {};
    if (sliderType === 'points' && val !== points) {
      overrides.points = val;
      setPoints(val);
    } else if (sliderType === 'basePrice' && val !== basePrice) {
      overrides.basePrice = val;
      setBasePrice(val);
    } else if (sliderType === 'topPrice' && val !== topPrice) {
      overrides.topPrice = val;
      setTopPrice(val);
    } else if (sliderType === 'power' && val !== power) {
      overrides.power = val;
      setPower(val);
    } else if (sliderType === 'feePercent' && val !== feePercent) {
      overrides.feePercent = val;
      setFeePercent(val);
    }
    // Compute bonding curve with the new value(s)
    computeBondingCurve(overrides);
    setIsLoading(false);
  };

  /**
   * Handles value changes from sliders on iOS
   * @param {string} sliderType - The type of slider being adjusted
   * @param {number} val - The new value from the slider
   */
  const onValueChangeIOS = (
    sliderType: 'points' | 'basePrice' | 'topPrice' | 'power' | 'feePercent',
    val: number,
  ) => {
    if (sliderType === 'points') {
      setPoints(val);
    } else if (sliderType === 'basePrice') {
      setBasePrice(val);
    } else if (sliderType === 'topPrice') {
      setTopPrice(val);
    } else if (sliderType === 'power') {
      setPower(val);
    } else if (sliderType === 'feePercent') {
      setFeePercent(val);
    }
  };

  /************************************
   * Chart data and style merging
   ************************************/
  const askPricesNumber = askBn.map(bn => bn.toNumber());
  const bidPricesNumber = bidBn.map(bn => bn.toNumber());
  const chartData = {
    labels: askBn.map((_, idx) => String(idx + 1)),
    datasets: [
      { data: askPricesNumber, color: () => '#FF4F78', strokeWidth: 3 },
      { data: bidPricesNumber, color: () => '#5078FF', strokeWidth: 3 },
    ],
    legend: ['Ask Curve', 'Bid Curve'],
  };
  const styles = { ...defaultStyles, ...styleOverrides };

  /************************************
   * Render
   ************************************/
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Bonding Curve Config</Text>

      {/* Curve Type Selection */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            curveType === 'linear' && styles.selectedTab,
            disabled && styles.disabledTab,
          ]}
          onPress={() => handleCurveTypePress('linear')}
          disabled={disabled}>
          <Text
            style={[
              styles.tabText,
              curveType === 'linear' && styles.selectedTabText,
              disabled && styles.disabledText,
            ]}>
            Linear
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            curveType === 'power' && styles.selectedTab,
            disabled && styles.disabledTab,
          ]}
          onPress={() => handleCurveTypePress('power')}
          disabled={disabled}>
          <Text
            style={[
              styles.tabText,
              curveType === 'power' && styles.selectedTabText,
              disabled && styles.disabledText,
            ]}>
            Power
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            curveType === 'exponential' && styles.selectedTab,
            disabled && styles.disabledTab,
          ]}
          onPress={() => handleCurveTypePress('exponential')}
          disabled={disabled}>
          <Text
            style={[
              styles.tabText,
              curveType === 'exponential' && styles.selectedTabText,
              disabled && styles.disabledText,
            ]}>
            Exponential
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            curveType === 'logarithmic' && styles.selectedTab,
            disabled && styles.disabledTab,
          ]}
          onPress={() => handleCurveTypePress('logarithmic')}
          disabled={disabled}>
          <Text
            style={[
              styles.tabText,
              curveType === 'logarithmic' && styles.selectedTabText,
              disabled && styles.disabledText,
            ]}>
            Logarithmic
          </Text>
        </TouchableOpacity>
      </View>

      {/* Points Slider */}
      <View style={styles.slidersContainer}>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Points: {points}</Text>
          <Slider
            style={styles.slider}
            minimumValue={2}
            maximumValue={20}
            step={1}
            value={points}
            disabled={disabled || isLoading}
            onValueChange={val => {
              if (Platform.OS === 'ios') {
                onValueChangeIOS('points', val);
              } else {
                setPoints(val);
              }
            }}
            onSlidingStart={() => (Platform.OS === 'android' ? onSlidingStartAndroid() : null)}
            onSlidingComplete={val =>
              Platform.OS === 'android' ? onSlidingCompleteAndroid('points', val) : null
            }
          />
        </View>
      </View>

      {/* Base Price Slider */}
      <View style={styles.slidersContainer}>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Base Price: {basePrice.toFixed(0)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={10}
            maximumValue={1000}
            step={5}
            value={basePrice}
            disabled={disabled || isLoading}
            onValueChange={val => {
              if (Platform.OS === 'ios') {
                onValueChangeIOS('basePrice', val);
              } else {
                setBasePrice(val);
              }
            }}
            onSlidingStart={() => (Platform.OS === 'android' ? onSlidingStartAndroid() : null)}
            onSlidingComplete={val =>
              Platform.OS === 'android' ? onSlidingCompleteAndroid('basePrice', val) : null
            }
          />
        </View>
      </View>

      {/* Top Price Slider */}
      <View style={styles.slidersContainer}>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Top Price: {topPrice.toFixed(0)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={50000}
            maximumValue={500000}
            step={10000}
            value={topPrice}
            disabled={disabled || isLoading}
            onValueChange={val => {
              if (Platform.OS === 'ios') {
                onValueChangeIOS('topPrice', val);
              } else {
                setTopPrice(val);
              }
            }}
            onSlidingStart={() => (Platform.OS === 'android' ? onSlidingStartAndroid() : null)}
            onSlidingComplete={val =>
              Platform.OS === 'android' ? onSlidingCompleteAndroid('topPrice', val) : null
            }
          />
        </View>
      </View>

      {/* Power Slider (if curveType is 'power') */}
      {curveType === 'power' && (
        <View style={styles.slidersContainer}>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Power: {power.toFixed(1)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={3.0}
              step={0.1}
              value={power}
              disabled={disabled || isLoading}
              onValueChange={val => {
                if (Platform.OS === 'ios') {
                  onValueChangeIOS('power', val);
                } else {
                  setPower(val);
                }
              }}
              onSlidingStart={() => (Platform.OS === 'android' ? onSlidingStartAndroid() : null)}
              onSlidingComplete={val =>
                Platform.OS === 'android' ? onSlidingCompleteAndroid('power', val) : null
              }
            />
          </View>
        </View>
      )}

      {/* Fee % Slider */}
      <View style={styles.slidersContainer}>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Fee %: {feePercent.toFixed(1)}%</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={10}
            step={0.1}
            value={feePercent}
            disabled={disabled || isLoading}
            onValueChange={val => {
              if (Platform.OS === 'ios') {
                onValueChangeIOS('feePercent', val);
              } else {
                setFeePercent(val);
              }
            }}
            onSlidingStart={() => (Platform.OS === 'android' ? onSlidingStartAndroid() : null)}
            onSlidingComplete={val =>
              Platform.OS === 'android' ? onSlidingCompleteAndroid('feePercent', val) : null
            }
          />
        </View>
      </View>

      {/* Chart with Loader Overlay (Android only) */}
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={CHART_WIDTH}
          height={260}
          fromZero
          withDots
          withShadow
          withInnerLines
          withOuterLines
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            color: (opacity = 1) => `rgba(34, 34, 34, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(80, 80, 80, ${opacity})`,
            strokeWidth: 3,
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#fff',
            },
          }}
          style={{ borderRadius: 10 }}
          verticalLabelRotation={0}
          segments={5}
          formatYLabel={yValue => {
            const val = parseFloat(yValue);
            if (!Number.isFinite(val)) return '0';
            if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
            if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
            return yValue;
          }}
          onDataPointClick={({ value }) => {
            Alert.alert('Data Point', `Price: ${value.toFixed(2)}`);
          }}
        />
        {Platform.OS === 'android' && isLoading && (
          <View style={localStyles.chartOverlay}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}
      </View>

      {/* Data Points Display */}
      <View style={styles.readoutContainer}>
        <Text style={styles.readoutTitle}>Data Points</Text>
        <View style={styles.readoutTableHeader}>
          <Text style={[styles.readoutCell, styles.readoutHeaderText]}>#</Text>
          <Text style={[styles.readoutCell, styles.readoutHeaderText]}>
            Ask
          </Text>
          <Text style={[styles.readoutCell, styles.readoutHeaderText]}>
            Bid
          </Text>
        </View>
        {askBn.map((askVal, idx) => (
          <View key={idx} style={styles.readoutRow}>
            <Text style={styles.readoutCell}>{idx + 1}</Text>
            <Text style={styles.readoutCell}>{askVal.toString()}</Text>
            <Text style={styles.readoutCell}>{bidBn[idx].toString()}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  chartOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
});
