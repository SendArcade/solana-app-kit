import { StyleSheet } from "react-native";

export const style =StyleSheet.create({
    container :{
        display:"flex",
        flexDirection:"column",
       alignItems:"center",
       width:"70%",
       gap:8
    },
    btnGrp: {
        display: "flex",
        paddingHorizontal:40,
        paddingVertical:25,
        flexDirection: "row",
        justifyContent: "space-between", // Ensures even spacing
        alignItems: "flex-start", // Aligns all buttons to the top
      },
      btnWrapper: {
        flex: 1, 
        alignItems: "center",
        height: 80, 
        gap:6
      },
      btn: {
        alignItems:"center",
        justifyContent:"center",
        width: 40,
        height: 40,
        borderColor:"#EDEFF3",
        borderWidth:2,
        borderRadius: 20,
        backgroundColor: "#F6F7F9",
      },
      btnText: {
        fontSize: 12,
        fontWeight: "400",
        color: "#B7B7B8",
        textAlign: "center",
        flexWrap: "wrap",
      },
})