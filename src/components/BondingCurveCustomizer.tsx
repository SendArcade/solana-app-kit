import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {LineChart} from 'react-native-chart-kit';
import Slider from '@react-native-community/slider';

type CurveType = 'linear' | 'power' | 'exponential' | 'logistic';

interface Props {
  curveType: CurveType;
  setCurveType: (type: CurveType) => void;
  nPoints: number;
  setNPoints: (v: number) => void;
  minPrice: number;
  setMinPrice: (v: number) => void;
  maxPrice: number;
  setMaxPrice: (v: number) => void;
  exponent: number;
  setExponent: (v: number) => void;
  growthRate: number;
  setGrowthRate: (v: number) => void;
  midPoint: number;
  setMidPoint: (v: number) => void;
  steepness: number;
  setSteepness: (v: number) => void;
  askPrices: number[];      // raw ask data
  bidPrices: number[];      // raw bid data
  chartData: any;           // pre‑built chartData object
  screenWidth: number;
  handleSetCurve: () => void;
}

export default function BondingCurveCustomizer(props: Props) {
  const {
    curveType,
    setCurveType,
    nPoints,
    setNPoints,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    exponent,
    setExponent,
    growthRate,
    setGrowthRate,
    midPoint,
    setMidPoint,
    steepness,
    setSteepness,
    askPrices,
    bidPrices,
    chartData,
    screenWidth,
    handleSetCurve,
  } = props;

  // 1) Final clamp for the displayed arrays
  //    We convert negative or Infinity values => 0 (just for display).
  const safeAsks = askPrices.map((val, i) => {
    if (!Number.isFinite(val) || val < 0) {
      console.warn(
        `BondingCurveCustomizer: invalid askPrice at index=${i}, val=${val} => using 0`
      );
      return 0;
    }
    return val;
  });

  const safeBids = bidPrices.map((val, i) => {
    if (!Number.isFinite(val) || val < 0) {
      console.warn(
        `BondingCurveCustomizer: invalid bidPrice at index=${i}, val=${val} => using 0`
      );
      return 0;
    }
    return val;
  });

  // 2) If all data points are zero, we’ll skip the chart to avoid any weird path
  const hasNonZeroData = safeAsks.some((x) => x > 0) || safeBids.some((x) => x > 0);

  // 3) Build a final sanitized chart config
  const allValues = [...safeAsks, ...safeBids];
  const globalMax = Math.max(...allValues, 0);
  let scaleFactor = 1;
  let labelSuffix = '';
  if (globalMax >= 1_000_000) {
    scaleFactor = 1_000_000;
    labelSuffix = 'M';
  } else if (globalMax >= 1_000) {
    scaleFactor = 1_000;
    labelSuffix = 'K';
  }

  // Actually build the chart data for display
  const finalChartData = {
    labels: safeAsks.map((_, i) => i.toString()),
    datasets: [
      {
        data: safeAsks.map((n) => n / scaleFactor),
        color: () => '#f55',
        strokeWidth: 2,
      },
      {
        data: safeBids.map((n) => n / scaleFactor),
        color: () => '#55f',
        strokeWidth: 2,
      },
    ],
    legend: [`Ask (${labelSuffix})`, `Bid (${labelSuffix})`],
  };

  return (
    <View style={curveStyles.section}>
      <Text style={curveStyles.sectionTitle}>Bonding Curve Customization</Text>

      {/* Curve Type Picker */}
      <Text style={curveStyles.label}>Curve Type:</Text>
      <Picker
        selectedValue={curveType}
        onValueChange={(itemValue) => setCurveType(itemValue as CurveType)}
        style={curveStyles.picker}
      >
        <Picker.Item label="Linear" value="linear" />
        <Picker.Item label="Power" value="power" />
        <Picker.Item label="Exponential" value="exponential" />
        <Picker.Item label="Logistic" value="logistic" />
      </Picker>

      {/* Number of points */}
      <Text style={curveStyles.smallLabel}>Number of Points: {nPoints}</Text>
      <Slider
        style={curveStyles.slider}
        minimumValue={5}
        maximumValue={20}
        step={1}
        value={nPoints}
        onValueChange={(v) => setNPoints(Math.round(v))}
      />

      {/* minPrice / maxPrice */}
      {/* [CHANGED] => allow minPrice to go as low as 0.001, step=0.001 */}
      <Text style={curveStyles.smallLabel}>Min Price: {minPrice.toFixed(3)}</Text>
      <Slider
        style={curveStyles.slider}
        minimumValue={0.001}  // was 0 before
        maximumValue={100}
        step={0.001}
        value={minPrice}
        onValueChange={(val) => setMinPrice(val)}
      />

      <Text style={curveStyles.smallLabel}>Max Price: {maxPrice}</Text>
      <Slider
        style={curveStyles.slider}
        minimumValue={1000}
        maximumValue={1000000}
        step={1000}
        value={maxPrice}
        onValueChange={(val) => setMaxPrice(Math.round(val))}
      />

      {/* Power-specific */}
      {curveType === 'power' && (
        <>
          <Text style={curveStyles.smallLabel}>
            Exponent: {exponent.toFixed(2)}
          </Text>
          <Slider
            style={curveStyles.slider}
            minimumValue={0.5}
            maximumValue={3.5}
            step={0.1}
            value={exponent}
            onValueChange={(val) => setExponent(val)}
          />
        </>
      )}

      {/* Exponential-specific */}
      {curveType === 'exponential' && (
        <>
          <Text style={curveStyles.smallLabel}>
            Growth Rate: {growthRate.toFixed(2)}
          </Text>
          <Slider
            style={curveStyles.slider}
            minimumValue={1.0}
            maximumValue={3.0}
            step={0.05}
            value={growthRate}
            onValueChange={(val) => setGrowthRate(val)}
          />
        </>
      )}

      {/* Logistic-specific */}
      {curveType === 'logistic' && (
        <>
          <Text style={curveStyles.smallLabel}>Mid-Point: {midPoint.toFixed(2)}</Text>
          <Slider
            style={curveStyles.slider}
            minimumValue={0.0}
            maximumValue={1.0}
            step={0.01}
            value={midPoint}
            onValueChange={(val) => setMidPoint(val)}
          />
          <Text style={curveStyles.smallLabel}>Steepness: {steepness.toFixed(2)}</Text>
          <Slider
            style={curveStyles.slider}
            minimumValue={1}
            maximumValue={10}
            step={0.5}
            value={steepness}
            onValueChange={(val) => setSteepness(val)}
          />
        </>
      )}

      {/* Display final ask array */}
      <View style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: '600', marginBottom: 4 }}>Ask Prices (clamped):</Text>
        <Text style={{ fontSize: 12, color: '#666' }}>{safeAsks.join(', ')}</Text>
      </View>

      {/* Display final bid array */}
      <View style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: '600', marginBottom: 4 }}>Bid Prices (clamped):</Text>
        <Text style={{ fontSize: 12, color: '#666' }}>{safeBids.join(', ')}</Text>
      </View>

      {/* Chart or fallback */}
      {hasNonZeroData ? (
        <LineChart
          data={finalChartData}
          width={screenWidth * 0.9}
          height={220}
          chartConfig={{
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
            labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: '3', strokeWidth: '2' },
          }}
          withShadow
          withDots
          style={{ marginTop: 16, borderRadius: 16 }}
        />
      ) : (
        <View style={{ marginTop: 16 }}>
          <Text style={{ color: '#999', fontStyle: 'italic' }}>
            No valid data to plot. All values are zero or invalid.
          </Text>
        </View>
      )}

      {/* Button to set curve */}
      <TouchableOpacity style={curveStyles.button} onPress={handleSetCurve}>
        <Text style={curveStyles.buttonText}>Set Bonding Curve On-Chain</Text>
      </TouchableOpacity>
    </View>
  );
}

const curveStyles = StyleSheet.create({
  section: {
    width: '100%',
    backgroundColor: '#f2f2f2',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#2a2a2a',
  },
  label: {
    marginBottom: 4,
    fontWeight: '600',
    color: '#333',
  },
  smallLabel: {
    marginTop: 8,
    color: '#555',
  },
  picker: {
    width: '100%',
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  button: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
