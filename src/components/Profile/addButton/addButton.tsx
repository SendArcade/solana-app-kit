import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {styles} from './addButton.style';
import Icons from '../../../assets/svgs/index';

/**
 * Props to manage the buttons displayed
 */
export interface AddButtonProps {
  onFollowBack?: () => void;
  onSendToWallet?: () => void;
  // Additional actions if you want them
  // onBuyTime?: () => void;
  // onAdd?: () => void;
}

const AddButton: React.FC<AddButtonProps> = ({
  onFollowBack,
  onSendToWallet,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btn} onPress={onFollowBack}>
        <Text style={styles.text}>Follow Back</Text>
        {/* <Icons.AddBtnIcon style={styles.icon}/> */}
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={onSendToWallet}>
        <Text style={styles.text}>Send to Wallet</Text>
        {/* <Icons.AddBtnIcon style={styles.icon}/> */}
      </TouchableOpacity>

      {/*
        Example to re-enable:
        <TouchableOpacity style={styles.btn}>
          <Text style={styles.text}>Buy Time</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.lastBtn]}>
          <Text style={styles.lastBtnText}>+</Text>
        </TouchableOpacity>
      */}
    </View>
  );
};

export default AddButton;
