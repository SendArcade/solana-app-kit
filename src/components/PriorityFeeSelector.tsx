import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {setSelectedFeeTier} from '../state/transaction/reducer';
import {RootState} from '../state/store';

/**
 * Interface for the fee tier options available in the selector
 */
type FeeTier = 'low' | 'medium' | 'high' | 'very-high';

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
 * transaction fee preference when a user selects a different tier.
 * 
 * @example
 * ```tsx
 * <PriorityFeeSelector />
 * ```
 */
const PriorityFeeSelector = () => {
  const dispatch = useDispatch();
  const selectedFeeTier = useSelector(
    (state: RootState) => state.transaction.selectedFeeTier,
  );
  const tiers: Array<'low' | 'medium' | 'high' | 'very-high'> = [
    'low',
    'medium',
    'high',
    'very-high',
  ];

  return (
    <View style={styles.container}>
      {tiers.map(tier => (
        <TouchableOpacity
          key={tier}
          style={[
            styles.button,
            selectedFeeTier === tier && styles.buttonSelected,
          ]}
          onPress={() => dispatch(setSelectedFeeTier(tier))}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  button: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  buttonSelected: {
    backgroundColor: '#1d9bf0',
    borderColor: '#1d9bf0',
  },
  text: {
    color: '#000',
  },
  textSelected: {
    color: '#fff',
  },
});

export default PriorityFeeSelector;
