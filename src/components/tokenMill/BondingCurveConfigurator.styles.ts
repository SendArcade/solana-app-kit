import {Dimensions, StyleSheet} from 'react-native';

const screenWidth = Dimensions.get('window').width;

// Export this separately as a constant, not as part of the styles
export const CHART_WIDTH = Math.min(screenWidth * 0.92, 600);

export const BondingCurveConfiguratorStyles = StyleSheet.create({
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
  // Removed chartWidth property
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
