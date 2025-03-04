import React, {useState, useEffect, useCallback, useRef} from 'react';
import {View, Text, TouchableOpacity, Alert, Platform} from 'react-native';
import Slider from '@react-native-community/slider';
import {LineChart} from 'react-native-chart-kit';
import BN from 'bn.js';

import {
  CHART_WIDTH,
  BondingCurveConfiguratorStyles as defaultStyles,
} from './BondingCurveConfigurator.styles';

type CurveType = 'linear' | 'power' | 'exponential' | 'logarithmic';

interface BondingCurveConfiguratorProps {
  onCurveChange: (askPrices: BN[], bidPrices: BN[]) => void;
  /**
   * Optional style overrides to customize the UI
   */
  styleOverrides?: Partial<typeof defaultStyles>;
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

export default function BondingCurveConfigurator({
  onCurveChange,
  styleOverrides = {},
}: BondingCurveConfiguratorProps) {
  /************************************
   * Refs
   ************************************/
  // We store the parent callback in a ref to avoid infinite loop
  const onCurveChangeRef = useRef(onCurveChange);
  useEffect(() => {
    onCurveChangeRef.current = onCurveChange;
  }, [onCurveChange]);

  /************************************
   * State variables
   ************************************/
  // For iOS, we can start from empty; for Android, initialize with safe BN arrays:
  const [askBn, setAskBn] = useState<BN[]>(
    Platform.OS === 'android' ? initialAskBnAndroid : [],
  );
  const [bidBn, setBidBn] = useState<BN[]>(
    Platform.OS === 'android' ? initialBidBnAndroid : [],
  );

  // Curve type
  const [curveType, setCurveType] = useState<CurveType>('linear');

  // "Committed" slider values used to compute the final curve.
  // On iOS, we update them in real-time. On Android, we only commit on release.
  const [points, setPoints] = useState<number>(11);
  const [basePrice, setBasePrice] = useState<number>(10);
  const [topPrice, setTopPrice] = useState<number>(50000);
  const [power, setPower] = useState<number>(2.0);
  const [feePercent, setFeePercent] = useState<number>(2.0);

  /************************************
   * "Pending" slider values (Android)
   * - We store these so the slider can move smoothly without re-render.
   ************************************/
  const [pendingPoints, setPendingPoints] = useState(points);
  const [pendingBase, setPendingBase] = useState(basePrice);
  const [pendingTop, setPendingTop] = useState(topPrice);
  const [pendingPower, setPendingPower] = useState(power);
  const [pendingFee, setPendingFee] = useState(feePercent);

  /************************************
   * Bonding curve computation
   ************************************/
  const computeBondingCurve = useCallback(() => {
    const newAskBn: BN[] = [];
    const newBidBn: BN[] = [];

    // Make local copies
    const localPoints = points;
    const localBase = basePrice;
    const localTop = topPrice;
    const localPower = power;
    const localFee = feePercent;

    for (let i = 0; i < localPoints; i++) {
      const t = i / Math.max(localPoints - 1, 1);

      // Compute float price
      let price: number;
      switch (curveType) {
        case 'linear':
          price = localBase + t * (localTop - localBase);
          break;
        case 'power':
          price = localBase + (localTop - localBase) * Math.pow(t, localPower);
          break;
        case 'exponential': {
          const safeBase = localBase > 0 ? localBase : 1;
          price = safeBase * Math.pow(localTop / safeBase, t);
          break;
        }
        case 'logarithmic': {
          // log10(1 + 9t)
          const logInput = 1 + 9 * t;
          const safeLog = logInput > 0 ? Math.log10(logInput) : 0;
          price = localBase + (localTop - localBase) * safeLog;
          break;
        }
        default:
          price = localBase + t * (localTop - localBase);
      }

      if (!Number.isFinite(price)) {
        price = localBase; // fallback
      }
      if (price < 0) {
        price = 0;
      }
      if (price > 1e9) {
        price = 1e9;
      }

      const askVal = new BN(Math.floor(price));

      // Fee => bid = ask * (1 - fee/100)
      let rawBid = price * (1 - localFee / 100);
      if (!Number.isFinite(rawBid)) {
        rawBid = price;
      }
      if (rawBid < 0) {
        rawBid = 0;
      }
      if (rawBid > 1e9) {
        rawBid = 1e9;
      }

      const bidVal = new BN(Math.floor(rawBid));
      newAskBn.push(askVal);
      newBidBn.push(bidVal);
    }

    // Save final BN arrays
    setAskBn(newAskBn);
    setBidBn(newBidBn);

    // Notify parent
    onCurveChangeRef.current(newAskBn, newBidBn);
  }, [curveType, points, basePrice, topPrice, power, feePercent]);

  /************************************
   * Real-time updates only on iOS
   * On Android, we do final compute after user releases slider
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
   * Slider Handlers
   * iOS => immediate state updates
   * Android => only store pending values, commit on release
   ************************************/
  const handleCurveTypePress = (type: CurveType) => {
    setCurveType(type);
    if (Platform.OS === 'android') {
      // Recompute after user changes curve type on Android
      // (no "slidingComplete" event for pressing buttons, so do it now)
      computeBondingCurve();
    }
  };

  // Points
  const onPointsChange = (val: number) => {
    if (Platform.OS === 'ios') {
      setPoints(val);
    } else {
      setPendingPoints(val);
    }
  };
  const onPointsComplete = () => {
    if (Platform.OS === 'android') {
      setPoints(pendingPoints);
      computeBondingCurve();
    }
  };

  // Base Price
  const onBaseChange = (val: number) => {
    if (Platform.OS === 'ios') {
      setBasePrice(val);
    } else {
      setPendingBase(val);
    }
  };
  const onBaseComplete = () => {
    if (Platform.OS === 'android') {
      setBasePrice(pendingBase);
      computeBondingCurve();
    }
  };

  // Top Price
  const onTopChange = (val: number) => {
    if (Platform.OS === 'ios') {
      setTopPrice(val);
    } else {
      setPendingTop(val);
    }
  };
  const onTopComplete = () => {
    if (Platform.OS === 'android') {
      setTopPrice(pendingTop);
      computeBondingCurve();
    }
  };

  // Power
  const onPowerChange = (val: number) => {
    if (Platform.OS === 'ios') {
      setPower(val);
    } else {
      setPendingPower(val);
    }
  };
  const onPowerComplete = () => {
    if (Platform.OS === 'android') {
      setPower(pendingPower);
      computeBondingCurve();
    }
  };

  // Fee
  const onFeeChange = (val: number) => {
    if (Platform.OS === 'ios') {
      setFeePercent(val);
    } else {
      setPendingFee(val);
    }
  };
  const onFeeComplete = () => {
    if (Platform.OS === 'android') {
      setFeePercent(pendingFee);
      computeBondingCurve();
    }
  };

  /************************************
   * Convert BN => number for Chart
   ************************************/
  const askPricesNumber = askBn.map(bn => bn.toNumber());
  const bidPricesNumber = bidBn.map(bn => bn.toNumber());

  /************************************
   * Chart data
   ************************************/
  const chartData = {
    labels: askBn.map((_, idx) => String(idx + 1)),
    datasets: [
      {
        data: askPricesNumber,
        color: () => '#FF4F78',
        strokeWidth: 3,
      },
      {
        data: bidPricesNumber,
        color: () => '#5078FF',
        strokeWidth: 3,
      },
    ],
    legend: ['Ask Curve', 'Bid Curve'],
  };

  /************************************
   * Merge style overrides
   ************************************/
  const styles = {...defaultStyles, ...styleOverrides};

  /************************************
   * Render
   ************************************/
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Bonding Curve Config</Text>

      {/* Curve Type Selection */}
      <View style={styles.curveSelectionContainer}>
        {(['linear', 'power', 'exponential', 'logarithmic'] as CurveType[]).map(
          type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.curveTypeButton,
                curveType === type && styles.curveTypeButtonActive,
              ]}
              onPress={() => handleCurveTypePress(type)}>
              <Text
                style={[
                  styles.curveTypeButtonText,
                  curveType === type && styles.curveTypeButtonTextActive,
                ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ),
        )}
      </View>

      {/* Number of Points */}
      <View style={styles.sliderRow}>
        <Text style={styles.label}>Points</Text>
        <Text style={styles.valueText}>
          {Platform.OS === 'ios' ? points : pendingPoints}
        </Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={5}
        maximumValue={20}
        step={1}
        value={Platform.OS === 'ios' ? points : pendingPoints}
        onValueChange={onPointsChange}
        onSlidingComplete={onPointsComplete}
        thumbTintColor="#8884FF"
        minimumTrackTintColor="#8884FF"
      />

      {/* Base Price */}
      <View style={styles.sliderRow}>
        <Text style={styles.label}>Base Price</Text>
        <Text style={styles.valueText}>
          {Platform.OS === 'ios'
            ? basePrice.toFixed(0)
            : pendingBase.toFixed(0)}
        </Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={10}
        maximumValue={1000}
        step={5}
        value={Platform.OS === 'ios' ? basePrice : pendingBase}
        onValueChange={onBaseChange}
        onSlidingComplete={onBaseComplete}
        thumbTintColor="#FF4F78"
        minimumTrackTintColor="#FF4F78"
      />

      {/* Top Price */}
      <View style={styles.sliderRow}>
        <Text style={styles.label}>Top Price</Text>
        <Text style={styles.valueText}>
          {Platform.OS === 'ios' ? topPrice.toFixed(0) : pendingTop.toFixed(0)}
        </Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={50000}
        maximumValue={500000}
        step={10000}
        value={Platform.OS === 'ios' ? topPrice : pendingTop}
        onValueChange={onTopChange}
        onSlidingComplete={onTopComplete}
        thumbTintColor="#5078FF"
        minimumTrackTintColor="#5078FF"
      />

      {/* Power (only if curveType=power) */}
      {curveType === 'power' && (
        <>
          <View style={styles.sliderRow}>
            <Text style={styles.label}>Power</Text>
            <Text style={styles.valueText}>
              {Platform.OS === 'ios'
                ? power.toFixed(1)
                : pendingPower.toFixed(1)}
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={3.0}
            step={0.1}
            value={Platform.OS === 'ios' ? power : pendingPower}
            onValueChange={onPowerChange}
            onSlidingComplete={onPowerComplete}
            thumbTintColor="#FFD700"
            minimumTrackTintColor="#FFD700"
          />
        </>
      )}

      {/* Fee % */}
      <View style={styles.sliderRow}>
        <Text style={styles.label}>Fee %</Text>
        <Text style={styles.valueText}>
          {Platform.OS === 'ios'
            ? feePercent.toFixed(1)
            : pendingFee.toFixed(1)}
          %
        </Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={10}
        step={0.1}
        value={Platform.OS === 'ios' ? feePercent : pendingFee}
        onValueChange={onFeeChange}
        onSlidingComplete={onFeeComplete}
        thumbTintColor="#4FD1C5"
        minimumTrackTintColor="#4FD1C5"
      />

      {/* Chart */}
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
          style={{borderRadius: 10}}
          verticalLabelRotation={0}
          segments={5}
          formatYLabel={yValue => {
            const val = parseFloat(yValue);
            if (!Number.isFinite(val)) return '0';
            if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
            if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
            return yValue;
          }}
          onDataPointClick={({value}) => {
            Alert.alert('Data Point', `Price: ${value.toFixed(2)}`);
          }}
        />
      </View>

      {/* Display computed values */}
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
