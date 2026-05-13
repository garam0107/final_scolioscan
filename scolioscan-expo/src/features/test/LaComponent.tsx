import * as React from "react";
import {Text, StyleSheet, View, Image} from "react-native";
import { textFont } from '@/src/constants/fonts';

const LaComponent = () => {
  	
  	return (
    		<View style={styles.view}>
      			<View style={styles.parent}>
        				<Text style={[styles.text, styles.textTypo]}>언어 설정</Text>
        				<Text style={[styles.text2, styles.textTypo]}>앱에 표시할 언어를 선택해주세요</Text>
      			</View>
      			<View style={styles.frameParent}>
        				<View style={[styles.group, styles.groupFlexBox]}>
          					<Text style={styles.text3Typo}>한국어</Text>
          					<Image style={styles.frameChild} resizeMode="cover" />
        				</View>
        				<View style={[styles.englishWrapper, styles.groupFlexBox]}>
          					<Text style={[styles.english, styles.text3Typo]}>English</Text>
        				</View>
        				<View style={[styles.englishWrapper, styles.groupFlexBox]}>
          					<Text style={[styles.english, styles.text3Typo]}>日本語</Text>
        				</View>
        				<View style={[styles.englishWrapper, styles.groupFlexBox]}>
          					<Text style={[styles.english, styles.text3Typo]}>中文</Text>
        				</View>
      			</View>
    		</View>);
};

const styles = StyleSheet.create({
  	textTypo: {
    		...textFont,
    		textAlign: "left",
    		left: 0,
    		position: "absolute"
  	},
  	groupFlexBox: {
    		alignSelf: "stretch",
    		overflow: "hidden"
  	},
  	text3Typo: {
    		...textFont,
    		color: "#000",
    		fontSize: 14,
    		textAlign: "left",
    		lineHeight: 20
  	},
  	view: {
    		width: "100%",
    		height: 300,
    		borderTopLeftRadius: 24,
    		borderTopRightRadius: 24,
    		backgroundColor: "#fff",
    		overflow: "hidden"
  	},
  	parent: {
    		top: 16,
    		left: 24,
    		width: 129,
    		height: 38,
    		position: "absolute"
  	},
  	text: {
    		...textFont,
    		top: 0,
    		fontSize: 15,
    		fontWeight: "500",
    		color: "#25272d",
    		lineHeight: 20,
    		textAlign: "left",
  	},
  	text2: {
    		...textFont,
    		top: 24,
    		fontSize: 10,
    		lineHeight: 14,
    		color: "#657085"
  	},
  	frameParent: {
    		top: 67,
    		width: 360,
    		paddingHorizontal: 16,
    		paddingVertical: 0,
    		gap: 1,
    		left: 0,
    		position: "absolute"
  	},
  	group: {
    		borderStyle: "solid",
    		borderColor: "#d4d9e2",
    		borderTopWidth: 1,
    		flexDirection: "row",
    		alignItems: "center",
    		justifyContent: "space-between",
    		paddingHorizontal: 8,
    		paddingVertical: 15,
    		gap: 20
  	},
  	frameChild: {
    		height: 28,
    		width: 28
  	},
  	englishWrapper: {
    		height: 58
  	},
  	english: {
    		marginTop: -11,
    		top: "50%",
    		left: 8,
    		position: "absolute"
  	}
});

export default LaComponent;
