import React from "react";
import { SafeAreaView, View, ScrollView } from "react-native";
import SwipeTabs from "../slider/slider";
import TopNavigation from "../topNavigation/topNavigation";
import ProfileInfo from "../ProfileInfo/profileInfo";
import { dummyProfileData } from "../../mocks/profileInfoData";

const OtherProfile = () => {
  return (
    <>
      <SafeAreaView style={{ backgroundColor: "white", flex: 1 }}>
        {/* navigation */}
        <TopNavigation />
        {/* profile container  */}
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <ProfileInfo profileData={dummyProfileData} />

          {/* slider container  */}

          <View style={{ height: 900 }}>
            <SwipeTabs />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default OtherProfile;
