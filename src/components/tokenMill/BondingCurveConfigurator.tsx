import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import {LineChart} from 'react-native-chart-kit';
import Slider from '@react-native-community/slider';

type CurveType = 'linear' | 'power' | 'exponential' | 'logarithmic';

interface BondingCurveConfiguratorProps {
  onCurveChange: (askPrices: number[], bidPrices: number[]) => void;
}

const screenWidth = Dimensions.get('window').width;

export default function BondingCurveConfigurator({
  onCurveChange,
}: BondingCurveConfiguratorProps) {
  /************************************
   * State variables
   ************************************/
  const [curveType, setCurveType] = useState<CurveType>('linear');

  // NEW: Let users control how many points to sample
  const [points, setPoints] = useState<number>(11); // range: 5..20
  const [basePrice, setBasePrice] = useState<number>(1);
  const [topPrice, setTopPrice] = useState<number>(300000);
  const [power, setPower] = useState<number>(2.0);
  const [feePercent, setFeePercent] = useState<number>(2.0);

  // Computed arrays
  const [askPrices, setAskPrices] = useState<number[]>([]);
  const [bidPrices, setBidPrices] = useState<number[]>([]);

  /************************************
   * Effects
   ************************************/
  useEffect(() => {
    const newAsk: number[] = [];
    const newBid: number[] = [];

    for (let i = 0; i < points; i++) {
      const t = i / (points - 1 || 1); // Avoid divide-by-zero
      let price: number;

      switch (curveType) {
        case 'linear':
          price = basePrice + t * (topPrice - basePrice);
          break;
        case 'power':
          // Raise t to the "power" factor
          price = basePrice + (topPrice - basePrice) * Math.pow(t, power);
          break;
        case 'exponential':
          // Exponential between basePrice and topPrice
          price = basePrice * Math.pow(topPrice / (basePrice || 1), t);
          break;
        case 'logarithmic':
          // Using log10(1 + 9t) to shift curve nicely
          price = basePrice + (topPrice - basePrice) * Math.log10(1 + 9 * t);
          break;
        default:
          price = basePrice + t * (topPrice - basePrice);
      }

      const ask = price;
      const bid = ask * (1 - feePercent / 100);

      newAsk.push(ask);
      newBid.push(bid);
    }

    setAskPrices(newAsk);
    setBidPrices(newBid);
    onCurveChange(newAsk, newBid);
  }, [curveType, points, basePrice, topPrice, power, feePercent]);

  /************************************
   * Chart data
   ************************************/
  const chartData = {
    labels: askPrices.map((_, idx) => String(idx + 1)),
    datasets: [
      {
        data: askPrices,
        color: () => '#FF4F78', // bright pink/red
        strokeWidth: 3,
      },
      {
        data: bidPrices,
        color: () => '#5078FF', // bright blue
        strokeWidth: 3,
      },
    ],
    legend: ['Ask Curve', 'Bid Curve'],
  };

  /************************************
   * Handlers
   ************************************/
  const handleCurveTypePress = (type: CurveType) => setCurveType(type);

  /************************************
   * Render
   ************************************/
  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.sectionTitle}>Bonding Curve Config</Text>

      {/* Curve Selection */}
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
        <Text style={styles.valueText}>{points}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={5}
        maximumValue={20}
        step={1}
        value={points}
        onValueChange={v => setPoints(v)}
        thumbTintColor="#8884FF"
        minimumTrackTintColor="#8884FF"
      />

      {/* Base Price */}
      <View style={styles.sliderRow}>
        <Text style={styles.label}>Base Price</Text>
        <Text style={styles.valueText}>{basePrice.toFixed(0)}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={10}
        maximumValue={1000}
        step={5}
        value={basePrice}
        onValueChange={v => setBasePrice(v)}
        thumbTintColor="#FF4F78"
        minimumTrackTintColor="#FF4F78"
      />

      {/* Top Price */}
      <View style={styles.sliderRow}>
        <Text style={styles.label}>Top Price</Text>
        <Text style={styles.valueText}>{topPrice.toFixed(0)}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={50000}
        maximumValue={500000}
        step={10000}
        value={topPrice}
        onValueChange={v => setTopPrice(v)}
        thumbTintColor="#5078FF"
        minimumTrackTintColor="#5078FF"
      />

      {/* Power (only if curveType=power) */}
      {curveType === 'power' && (
        <>
          <View style={styles.sliderRow}>
            <Text style={styles.label}>Power</Text>
            <Text style={styles.valueText}>{power.toFixed(1)}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={3.0}
            step={0.1}
            value={power}
            onValueChange={v => setPower(v)}
            thumbTintColor="#FFD700"
            minimumTrackTintColor="#FFD700"
          />
        </>
      )}

      {/* Fee % */}
      <View style={styles.sliderRow}>
        <Text style={styles.label}>Fee %</Text>
        <Text style={styles.valueText}>{feePercent.toFixed(1)}%</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={10}
        step={0.1}
        value={feePercent}
        onValueChange={v => setFeePercent(v)}
        thumbTintColor="#4FD1C5"
        minimumTrackTintColor="#4FD1C5"
      />

      {/* Chart */}
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          // We'll let this fill the parent minus some padding
          width={Math.min(screenWidth * 0.92, 600)}
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
          // No "bezier" => no spline overshoot
          style={{borderRadius: 10}}
          verticalLabelRotation={0}
          segments={5}
          formatYLabel={yValue => {
            const val = parseFloat(yValue);
            if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
            if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
            return yValue;
          }}
          onDataPointClick={({value}) => {
            // Provide quick feedback on the tapped data point
            Alert.alert('Data Point', `Price: ${value.toFixed(2)}`);
          }}
        />
      </View>

      {/* Display computed values in a table */}
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
        {askPrices.map((ask, idx) => (
          <View key={idx} style={styles.readoutRow}>
            <Text style={styles.readoutCell}>{idx + 1}</Text>
            <Text style={styles.readoutCell}>{ask.toFixed(2)}</Text>
            <Text style={styles.readoutCell}>{bidPrices[idx].toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  curveSelectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
  },
  curveTypeButton: {
    minWidth: 80,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#eee',
    margin: 4,
    alignItems: 'center',
  },
  curveTypeButtonActive: {
    backgroundColor: '#333',
  },
  curveTypeButtonText: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
  curveTypeButtonTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  sliderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  slider: {
    width: '100%',
    marginBottom: 12,
  },
  chartContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 12,
  },
  readoutContainer: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  readoutTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    color: '#333',
    textAlign: 'center',
  },
  readoutTableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 6,
    paddingBottom: 4,
  },
  readoutHeaderText: {
    fontWeight: '700',
    color: '#333',
  },
  readoutRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    paddingVertical: 4,
  },
  readoutCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: '#444',
  },
});
