import {Dimensions, StyleSheet} from 'react-native';

const screenWidth = Dimensions.get('window').width;

/**
 * The width of the chart component, calculated as the minimum of:
 * - 92% of the screen width
 * - 600 pixels
 * This ensures the chart is responsive while maintaining readability
 */
export const CHART_WIDTH = Math.min(screenWidth * 0.92, 600);

/**
 * Styles for the BondingCurveConfigurator component
 * 
 * @description
 * A comprehensive style object that defines the visual appearance of the
 * BondingCurveConfigurator component. Includes styles for:
 * - Container layout and appearance
 * - Curve type selection buttons
 * - Slider controls and labels
 * - Chart container and dimensions
 * - Price readout table
 * 
 * The styles use a clean, modern design with:
 * - Consistent spacing and padding
 * - Clear visual hierarchy
 * - Responsive layout
 * - Platform-agnostic measurements
 */
export const BondingCurveConfiguratorStyles = StyleSheet.create({
  /** Main container for the entire component */
  container: {
    width: '100%',
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 16,
  },
  /** Title text for each section */
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  /** Container for curve type selection buttons */
  curveSelectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
  },
  /** Base style for curve type selection buttons */
  curveTypeButton: {
    minWidth: 80,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#eee',
    margin: 4,
    alignItems: 'center',
  },
  /** Style for the active curve type button */
  curveTypeButtonActive: {
    backgroundColor: '#333',
  },
  /** Text style for curve type button labels */
  curveTypeButtonText: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
  /** Text style for active curve type button */
  curveTypeButtonTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  /** Container for slider controls and their labels */
  sliderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
    marginTop: 8,
  },
  /** Style for slider labels */
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  /** Style for slider value display */
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  /** Style for slider component */
  slider: {
    width: '100%',
    marginBottom: 12,
  },
  /** Container for the chart visualization */
  chartContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 12,
  },
  /** Container for price readout information */
  readoutContainer: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  /** Title for the price readout section */
  readoutTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    color: '#333',
    textAlign: 'center',
  },
  /** Header row for the price readout table */
  readoutTableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 6,
    paddingBottom: 4,
  },
  /** Text style for readout table headers */
  readoutHeaderText: {
    fontWeight: '700',
    color: '#333',
  },
  /** Style for each row in the price readout table */
  readoutRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    paddingVertical: 4,
  },
  /** Style for individual cells in the price readout table */
  readoutCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: '#444',
  },
});
