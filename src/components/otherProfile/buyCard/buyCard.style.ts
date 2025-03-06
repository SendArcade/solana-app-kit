import { StyleSheet } from "react-native";
import COLORS from "../../../assets/colors";

export const styles = StyleSheet.create({
    container:{
        width:"100%",
        height:"auto",
        display:"flex",
        flexDirection:"row",
        justifyContent:"space-between",
        paddingHorizontal:12,
        paddingVertical:10,
        borderColor:COLORS.greyBorderdark,
        borderRadius:12,
        borderWidth:2

    },
    contentContainer:{
        display:"flex",
        flexDirection:"row",
        alignItems:"center",gap:8
    },
    imgContainer: {
        width: 38,
        height: 38,
        borderRadius: 8,
        
        overflow: "hidden", 
      },
      img: {
        width: "100%",
        height: "100%",
      },
      buyButton: {
        width: 69,
        height: 36,
        borderRadius: 12,
        backgroundColor: COLORS.greyLight, 
        alignItems: "center",

        justifyContent: "center",
      },
      buyButtonText: {
        color: "black",
        fontSize: 12,
        fontWeight: 600,
      },
      buyButtonContainer:{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }
})