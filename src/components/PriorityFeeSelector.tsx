import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {setSelectedFeeTier, setTransactionMode} from '../state/transaction/reducer';
import {RootState} from '../state/store';

/**
 * Interface for the fee tier options available in the selector
 */
type FeeTier = 'low' | 'medium' | 'high' | 'very-high';

/**
 * Properties for the PriorityFeeSelector component
 */
interface PriorityFeeSelectorProps {
  /**
   * Whether to show the mode selector (Priority/Jito)
   * If false, only shows the fee tier selector
   */
  showModeSelector?: boolean;
  /**
   * Callback when a fee tier is selected
   */
  onFeeTierSelected?: (tier: FeeTier) => void;
  /**
   * Callback when transaction mode is selected
   */
  onModeSelected?: (mode: 'priority' | 'jito') => void;
}

/**
 * A component that allows users to select transaction fee tiers for Solana transactions
 * 
 * @component
 * @description
 * PriorityFeeSelector provides a user interface for selecting different transaction fee tiers
 * on the Solana network. It offers four options: low, medium, high, and very-high, with
 * visual feedback for the selected option.
 * 
 * The component integrates with Redux for state management and updates the global
 * transaction fee preference when a user selects a different tier. This selection is then
 * automatically used by the TransactionService when sending transactions.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <PriorityFeeSelector />
 * 
 * // With mode selector
 * <PriorityFeeSelector showModeSelector={true} />
 * 
 * // With callbacks
 * <PriorityFeeSelector 
 *   onFeeTierSelected={(tier) => console.log(`Selected tier: ${tier}`)}
 *   onModeSelected={(mode) => console.log(`Selected mode: ${mode}`)}
 * />
 * ```
 */
const PriorityFeeSelector: React.FC<PriorityFeeSelectorProps> = ({
  showModeSelector = false,
  onFeeTierSelected,
  onModeSelected,
}) => {
  const dispatch = useDispatch();
  
  // Get current state from Redux
  const selectedFeeTier = useSelector(
    (state: RootState) => state.transaction.selectedFeeTier,
  );
  const transactionMode = useSelector(
    (state: RootState) => state.transaction.transactionMode,
  );
  
  // Available fee tiers
  const tiers: Array<FeeTier> = [
    'low',
    'medium',
    'high',
    'very-high',
  ];

  // Handler for fee tier selection
  const handleFeeTierSelected = (tier: FeeTier) => {
    dispatch(setSelectedFeeTier(tier));
    if (onFeeTierSelected) {
      onFeeTierSelected(tier);
    }
  };

  // Handler for transaction mode selection
  const handleModeSelected = (mode: 'priority' | 'jito') => {
    dispatch(setTransactionMode(mode));
    if (onModeSelected) {
      onModeSelected(mode);
    }
  };

  return (
    <View style={styles.container}>
      {/* Mode selector (Priority/Jito) */}
      {showModeSelector && (
        <View style={styles.modeContainer}>
          <Text style={styles.label}>Transaction Mode:</Text>
          <View style={styles.modeButtonRow}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                transactionMode === 'priority' && styles.buttonSelected,
              ]}
              onPress={() => handleModeSelected('priority')}>
              <Text
                style={[
                  styles.text,
                  transactionMode === 'priority' && styles.textSelected,
                ]}>
                PRIORITY
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                transactionMode === 'jito' && styles.buttonSelected,
              ]}
              onPress={() => handleModeSelected('jito')}>
              <Text
                style={[
                  styles.text,
                  transactionMode === 'jito' && styles.textSelected,
                ]}>
                JITO
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Fee tier selector (only show when in Priority mode) */}
      {(!showModeSelector || transactionMode === 'priority') && (
        <View>
          <Text style={styles.label}>Fee Tier:</Text>
          <View style={styles.tierButtonRow}>
            {tiers.map(tier => (
              <TouchableOpacity
                key={tier}
                style={[
                  styles.button,
                  selectedFeeTier === tier && styles.buttonSelected,
                ]}
                onPress={() => handleFeeTierSelected(tier)}>
                <Text
                  style={[
                    styles.text,
                    selectedFeeTier === tier && styles.textSelected,
                  ]}>
                  {tier.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  modeContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  modeButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  tierButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginRight: 10,
  },
  buttonSelected: {
    backgroundColor: '#1d9bf0',
    borderColor: '#1d9bf0',
  },
  text: {
    color: '#000',
    fontSize: 12,
  },
  textSelected: {
    color: '#fff',
  },
});

export default PriorityFeeSelector;
