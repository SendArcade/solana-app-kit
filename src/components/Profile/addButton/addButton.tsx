import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {styles} from './addButton.style';
import Icons from '../../../assets/svgs/index';

/**
 * Props controlling the follow-unfollow logic and additional actions.
 */
export interface AddButtonProps {
  /**
   * If `true`, we currently follow this user.
   */
  amIFollowing: boolean;
  /**
   * If `true`, this user follows me. Helps determine "Follow Back".
   */
  areTheyFollowingMe: boolean;
  /**
   * Called when we tap the “Follow” or “Follow Back” button.
   */
  onPressFollow: () => void;
  /**
   * Called when we tap the “Unfollow” or “Following” button.
   */
  onPressUnfollow: () => void;

  /**
   * Optional: callback for “Send to Wallet” button if you want to keep it.
   */
  onSendToWallet?: () => void;
}

/**
 * A small action row for following or sending a wallet transaction.
 * 
 * It supports logic for "Follow", "Follow Back", or "Following" states:
 * - If `amIFollowing === true`: show “Following” => pressing it calls onPressUnfollow
 * - Else if `areTheyFollowingMe === true`: show “Follow Back”
 * - Otherwise: show “Follow”
 */
const AddButton: React.FC<AddButtonProps> = ({
  amIFollowing,
  areTheyFollowingMe,
  onPressFollow,
  onPressUnfollow,
  onSendToWallet,
}) => {
  /**
   * Decide label for the main follow button
   */
  let followLabel = 'Follow';
  if (amIFollowing) {
    followLabel = 'Following';
  } else if (!amIFollowing && areTheyFollowingMe) {
    followLabel = 'Follow Back';
  }

  /**
   * Press handler
   */
  const handlePressFollowButton = () => {
    if (amIFollowing) {
      // We are currently following => so user tapping means “Unfollow”
      onPressUnfollow();
    } else {
      // We are NOT following => means “Follow” or “Follow Back”
      onPressFollow();
    }
  };

  return (
    <View style={styles.container}>
      {/* Follow/Unfollow button */}
      <TouchableOpacity style={styles.btn} onPress={handlePressFollowButton}>
        <Text style={styles.text}>{followLabel}</Text>
      </TouchableOpacity>

      {/* Example second button, e.g. “Send to Wallet” */}
      {onSendToWallet && (
        <TouchableOpacity style={styles.btn} onPress={onSendToWallet}>
          <Text style={styles.text}>Send to Wallet</Text>
        </TouchableOpacity>
      )}

      {/* 
        Optionally you can add more, e.g.:
        <TouchableOpacity style={[styles.btn, styles.lastBtn]}>
          <Text style={styles.lastBtnText}>+</Text>
        </TouchableOpacity>
      */}
    </View>
  );
};

export default AddButton;
