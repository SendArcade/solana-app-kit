import React from "react";
import { Image, View, Text } from "react-native";
import AddButton from "../addButton/addButton";
import PerksCard from "../perksCard/perksCard";
import BuyCard from "../buyCard/buyCrad";

import ProfileIcons from "../../assets/svgs/index";
import { styles } from "./profileInfo.style";
import { findMentioned } from "../../utils/common/findMentioned";
import { ProfileData } from "../../mocks/profileInfoData";


type ProfileInfoProps = {
  profileData: ProfileData;
};

const ProfileInfo: React.FC<ProfileInfoProps> = ({ profileData }) => {
  return (
    <View>
      {/* profile info */}
      <View style={styles.profileInfo}>
        <View style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            {/* profile image */}
            <View style={styles.profImgContainer}>
              <Image style={styles.profImg} source={profileData.profileImage} />
            </View>
            <View>
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "600", lineHeight: 22 }}>
                  {profileData.username}
                </Text>
                <ProfileIcons.SubscriptionTick />
              </View>
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    textAlign: "left",
                    color: "#999999",
                  }}
                >
                  {profileData.handle}
                </Text>
                <Text
                  style={{
                    backgroundColor: "#F6F7F9",
                    paddingHorizontal: 12,
                    borderRadius: 6,
                    paddingVertical: 4,
                    fontSize: 12,
                    fontWeight: "500",
                    textAlign: "left",
                    color: "#999999",
                  }}
                >
                  Follows you
                </Text>
              </View>
            </View>
          </View>

          {/* bio section */}
          <View>
            <Text style={styles.bioSection}>{findMentioned(profileData.bio)}</Text>
          </View>

          {/* follower and following count */}
          <View style={{ display: "flex", flexDirection: "row", gap: 12 }}>
            <View style={{ display: "flex", flexDirection: "row", gap: 2 }}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>
                {profileData.followers}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  textAlign: "left",
                  color: "#B7B7B7",
                }}
              >
                Followers
              </Text>
            </View>
            <View style={{ display: "flex", flexDirection: "row", gap: 2 }}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>
                {profileData.following}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  textAlign: "left",
                  color: "#B7B7B7",
                }}
              >
                Following
              </Text>
            </View>
            <View style={{ display: "flex", flexDirection: "row", gap: 2 }}>
              <ProfileIcons.PinLocation />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  textAlign: "left",
                  color: "#B7B7B7",
                }}
              >
                {profileData.location}
              </Text>
            </View>
          </View>
        </View>

        {/* buy card */}
        <BuyCard />

        {/* perks card */}
        <PerksCard />

        {/* following stats */}
        <View style={styles.followingStatsContainer}>
          <View style={styles.imageContainer}>
            <Image
              source={require("../../assets/images/reaction-user-1.png")}
              style={styles.firstimage}
            />
            <Image
              source={require("../../assets/images/reaction-user-2.png")}
              style={[styles.firstimage, styles.secondImage]}
            />
            <Image
              source={require("../../assets/images/reaction-user-1.png")}
              style={[styles.firstimage, styles.secondImage]}
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.text}>
              Followed by {profileData.followedBy.join(", ")}
            </Text>
          </View>
        </View>

        {/* add button */}
        <View>
          <AddButton />
        </View>
      </View>
    </View>
  );
};

export default ProfileInfo;
