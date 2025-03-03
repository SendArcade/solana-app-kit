import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "./addButton.style";
import Icons from "../../assets/svgs/index"

/**
 * A component that provides action buttons for user interactions
 * 
 * @component
 * @description
 * AddButton is a component that displays a set of action buttons for common user interactions.
 * Currently, it provides two main actions:
 * - Follow Back: Allows users to follow back other users
 * - Send to Wallet: Enables sending assets to a wallet
 * 
 * The component is styled with a consistent button layout and supports
 * touch interactions. Additional actions can be uncommented and customized
 * as needed (e.g., Buy Time and Add actions).
 * 
 * @example
 * ```tsx
 * <AddButton />
 * ```
 */
const AddButton = () => {
  return (
    <View style={styles.container}>
        
      <TouchableOpacity style={styles.btn}>
   
        <Text style={styles.text}>Follow Back</Text>
        {/* <Icons.AddBtnIcon style={styles.icon}/> */}
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn}>
        <Text style={styles.text}>Send to Wallet</Text>
        {/* <Icons.AddBtnIcon style={styles.icon}/> */}
      </TouchableOpacity>

      {/* <TouchableOpacity style={styles.btn}>
        <Text style={styles.text}>Buy Time</Text>
        <Icons.AddBtnIcon style={styles.icon}/>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.lastBtn]}>
        <Text style={styles.lastBtnText}>+</Text>
      </TouchableOpacity> */}
    </View>
  );
};

export default AddButton;
