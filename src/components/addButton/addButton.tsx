import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "./addButton.style";
import Icons from "../../assets/svgs/index"
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
