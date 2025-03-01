import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {LineChart} from 'react-native-chart-kit';
import {Dimensions} from 'react-native';
import Slider from '@react-native-community/slider';

type CurveType = 'linear' | 'power' | 'exponential' | 'logarithmic';

interface BondingCurveConfiguratorProps {
  onCurveChange: (askPrices: number[], bidPrices: number[]) => void;
}

const screenWidth = Dimensions.get('window').width;

export default function BondingCurveConfigurator({
  onCurveChange,
}: BondingCurveConfiguratorProps) {
  const [curveType, setCurveType] = useState<CurveType>('linear');

  // Common states for controlling curve shape
  const [points, setPoints] = useState<number>(11);
  const [basePrice, setBasePrice] = useState<number>(1);
  const [topPrice, setTopPrice] = useState<number>(300000);
  const [power, setPower] = useState<number>(2.0);
  const [feePercent, setFeePercent] = useState<number>(2.0);

  // Computed arrays
  const [askPrices, setAskPrices] = useState<number[]>([]);
  const [bidPrices, setBidPrices] = useState<number[]>([]);

  useEffect(() => {
    const newAsk: number[] = [];
    const newBid: number[] = [];
    const count = 11; // forced
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      let price: number;

      switch (curveType) {
        case 'linear':
          price = basePrice + t * (topPrice - basePrice);
          break;
        case 'power':
          price = basePrice + (topPrice - basePrice) * Math.pow(t, power);
          break;
        case 'exponential':
          price = basePrice * Math.pow(topPrice / (basePrice || 1), t);
          break;
        case 'logarithmic':
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
  }, [curveType, basePrice, topPrice, power, feePercent]);

  const chartData = {
    labels: askPrices.map((_, idx) => String(idx + 1)),
    datasets: [
      {
        data: askPrices,
        color: () => '#E91E63',
        strokeWidth: 2,
      },
      {
        data: bidPrices,
        color: () => '#2196F3',
        strokeWidth: 2,
      },
    ],
    legend: ['Ask Curve', 'Bid Curve'],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Bonding Curve Config</Text>

      {/* CURVE TYPE BUTTONS */}
      <View style={styles.row}>
        {(['linear', 'power', 'exponential', 'logarithmic'] as CurveType[]).map(
          type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.curveBtn,
                curveType === type && styles.curveBtnActive,
              ]}
              onPress={() => setCurveType(type)}>
              <Text
                style={[
                  styles.curveBtnText,
                  curveType === type && styles.curveBtnTextActive,
                ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ),
        )}
      </View>

      <Text style={styles.label}>Base Price: {basePrice.toFixed(0)}</Text>
      <Slider
        style={styles.slider}
        minimumValue={10}
        maximumValue={1000}
        step={5}
        value={basePrice}
        onValueChange={v => setBasePrice(v)}
      />

      <Text style={styles.label}>Top Price: {topPrice.toFixed(0)}</Text>
      <Slider
        style={styles.slider}
        minimumValue={50000}
        maximumValue={500000}
        step={10000}
        value={topPrice}
        onValueChange={v => setTopPrice(v)}
      />

      {curveType === 'power' && (
        <>
          <Text style={styles.label}>Power: {power.toFixed(1)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={3.0}
            step={0.1}
            value={power}
            onValueChange={v => setPower(v)}
          />
        </>
      )}

      <Text style={styles.label}>Fee %: {feePercent.toFixed(1)}%</Text>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={10}
        step={0.1}
        value={feePercent}
        onValueChange={v => setFeePercent(v)}
      />

      {/* RENDER CHART */}
      <LineChart
        data={chartData}
        width={screenWidth * 0.9}
        height={220}
        fromZero
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#f5f5f5',
          backgroundGradientTo: '#e5e5e5',
          color: (opacity = 1) => `rgba(34, 34, 34, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(85, 85, 85, ${opacity})`,
          strokeWidth: 2,
          barPercentage: 0.5,
        }}
        bezier
        style={{marginVertical: 10}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fafafa',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: '#2a2a2a',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  curveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#eee',
    borderRadius: 6,
    marginHorizontal: 2,
  },
  curveBtnActive: {
    backgroundColor: '#2a2a2a',
  },
  curveBtnText: {
    color: '#2a2a2a',
    fontWeight: '600',
  },
  curveBtnTextActive: {
    color: '#fff',
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
  },
  slider: {
    marginBottom: 12,
  },
});
