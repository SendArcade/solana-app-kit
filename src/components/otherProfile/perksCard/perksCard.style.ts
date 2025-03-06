import { StyleSheet } from "react-native";
import COLORS from "../../../assets/colors";

export const styles = StyleSheet.create({
    container:{
        width:"100%",
        height:"auto",
        display:"flex",
        flexDirection:"column",
        paddingVertical:10,
        paddingHorizontal:12,
        borderWidth:2,
        borderRadius:12,
        gap:6,
        borderColor:COLORS.greyBorderdark
    },
    perkContainer:{
        display:"flex",
        flexDirection:"row",
        borderWidth:2,
        borderRadius:12,
        paddingHorizontal:12,
        paddingVertical:10,
        gap:8,
        alignItems:"center",
        borderColor:COLORS.greyBorderdark
    }, 
     communityImgContainer: {
        width: 38, 
        height: 38, 
        borderRadius: 19, 
        overflow: "hidden", 
      },
      communityImg: {
        width: "100%",
        height: "100%",
      },
})