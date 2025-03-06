import { StyleSheet } from "react-native";
import COLORS from "../../../assets/colors";

export const styles = StyleSheet.create({

    profileInfo:{
        gap: 12,
        height: "auto",
        width: "100%",
       
        paddingHorizontal: 16,
        paddingBottom: 12,  
      },
      bioSection:{
        fontSize: 14,
        fontWeight: "400",
        textAlign: "left",
      },
      btnGrp: {
        flexDirection: 'row',
        gap: 10,
      },
      followBtn: {
        height: 45,
        flex: 1,
        borderRadius: 12,
        backgroundColor: '#2A2A2A',
        justifyContent: 'center',
        alignItems: 'center',
      },
      followBtnText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.02,
        textAlign: 'center',
      },
      sendToWalletBtn: {
        height: 45,
        flex: 1,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.greyBorder,
        backgroundColor: COLORS.greyLight, 
        justifyContent: 'center',
        alignItems: 'center',
      },
      sendToWalletBtnText: {
        color: '#2A2A2A',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.02,
        textAlign: 'center',
      },
      imageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        left: -4,
      },
      firstimage: {
        width: 32,
        height: 32,
        borderRadius: 10,
      },
      secondImage: {
        marginLeft: -18,
      },
      followingStatsContainer: {
        display: 'flex',
        flexDirection: 'row',
        gap: 4,
      },
      textContainer: {
        justifyContent: 'center',
        width: 290,
      },
      text: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.greyMid,
        textAlign: 'left',
        flexWrap: 'wrap',
      },
     
      profImgContainer:{width: 72, height: 72, borderRadius: 42,alignItems:"center",justifyContent:"center",},
      profImg:{ width: "100%", height: "100%", resizeMode: "cover" }
    
})