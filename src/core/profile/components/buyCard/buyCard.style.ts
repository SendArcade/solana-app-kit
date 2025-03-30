import { StyleSheet } from "react-native";
import COLORS from "../../../../assets/colors";

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
        borderWidth:1
    },
    contentContainer:{
        display:"flex",
        flexDirection:"row",
        alignItems:"center",
        gap:8
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
        paddingHorizontal: 16,
        height: 36,
        borderRadius: 12,
        backgroundColor: COLORS.greyLight, 
        alignItems: "center",
        justifyContent: "center",
    },
    buyButtonText: {
        color: "black",
        fontSize: 12,
        fontWeight: "600",
    },
    buyButtonContainer:{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
    pinYourCoinContainer: {
        borderStyle: "dashed",
        borderColor: "#1d9bf0",
        backgroundColor: "rgba(29, 155, 240, 0.05)",
    },
    arrowButton: {
        padding: 8,
        marginLeft: 8,
    },
    pinArrowButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1d9bf0',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
    },
    pinButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 6,
    },
})