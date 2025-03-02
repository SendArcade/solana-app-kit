import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {setSelectedFeeTier} from '../state/transaction/reducer';
import {RootState} from '../state/store';

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
