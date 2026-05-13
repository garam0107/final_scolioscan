import * as React from "react";
import {Text, StyleSheet, View} from "react-native";
import UnorderedList from "../test/UnorderedList"
import ListItem from "../test/ListItem"
import { textFont } from '@/src/constants/fonts';

const Component = () => {
  	
  	return (
    		<View style={styles.view}>
      			<View style={styles.groupParent}>
        				<View style={[styles.parent, styles.text7Position]}>
          					<Text style={[styles.text, styles.textTypo1]}>이 작업은 되돌릴 수 없어요</Text>
          					<Text style={[styles.text2, styles.textTypo]}>데이터를 초기화할까요?</Text>
            						</View>
            						<View style={[styles.frameWrapper, styles.framePosition]}>
              							<View style={styles.wrapperFlexBox}>
                								<Text style={[styles.d3dContainer, styles.textTypo1]}>
                  									<Text style={styles.text3}>삭제되는 항목</Text>
                  									<UnorderedList style={[styles.d3d, styles.d3dClr]}>
                    										<ListItem style={styles.d3d2}>
                      											<Text style={[styles.d3d3, styles.d3dClr]}>2D, 3D 촬영 기록</Text>
                    										</ListItem>
                    										<ListItem style={styles.d3d2}>
                      											<Text style={[styles.d3d3, styles.d3dClr]}>척추측만계 측정 기록</Text>
                    										</ListItem>
                    										<ListItem style={styles.d3d2}>
                      											<Text style={[styles.d3d3, styles.d3dClr]}>분석 및 리포트 히스토리</Text>
                    										</ListItem>
                    										<ListItem>
                      											<Text style={[styles.d3d3, styles.d3dClr]}>앱 설정 (알림 등)</Text>
                    										</ListItem>
                  									</UnorderedList>
                								</Text>
              							</View>
            						</View>
            						<Text style={[styles.text7, styles.text7Typo]}>확인을 위해 아래에 초기화 라고 입력해주세요</Text>
            						<View style={[styles.frameContainer, styles.framePosition]}>
              							<View style={[styles.wrapper, styles.wrapperBorder]}>
                								<Text style={[styles.text8, styles.textTypo]}>초기화</Text>
              							</View>
            						</View>
            						</View>
            						<View style={styles.filledregularParent}>
              							<View style={[styles.filledregular, styles.filledregularFlexBox]}>
                								<Text style={[styles.claim, styles.text7Typo]}>취소</Text>
              							</View>
              							<View style={[styles.filledregular2, styles.filledregularFlexBox]}>
                								<Text style={[styles.claim2, styles.textTypo]}>초기화</Text>
              							</View>
            						</View>
            						</View>);
          					};
          					
          					const styles = StyleSheet.create({
            						text7Position: {
              							left: 8,
              							position: "absolute"
            						},
            						textTypo1: {
              							...textFont,
              							textAlign: "left",
            						},
            						textTypo: {
              							...textFont,
              							fontWeight: "500",
              							lineHeight: 20,
              							textAlign: "left",
            						},
            						framePosition: {
              							right: 0,
              							left: 0,
              							position: "absolute"
            						},
            						d3dClr: {
              							...textFont,
              							color: "#3b4049",
              							fontSize: 14
            						},
            						text7Typo: {
              							...textFont,
              							color: "#25272d",
              							fontWeight: "500",
              							lineHeight: 20,
              							textAlign: "left",
            						},
            						wrapperBorder: {
              							borderWidth: 1,
              							borderStyle: "solid"
            						},
            						filledregularFlexBox: {
              							paddingVertical: 0,
              							paddingHorizontal: 14,
              							justifyContent: "center",
              							alignItems: "center",
              							borderRadius: 6,
              							flex: 1,
              							flexDirection: "row",
              							alignSelf: "stretch"
            						},
            						view: {
              							width: "100%",
              							height: 350,
              							borderTopLeftRadius: 24,
              							borderTopRightRadius: 24,
              							paddingHorizontal: 16,
              							paddingTop: 16,
              							gap: 12,
              							overflow: "hidden",
              							backgroundColor: "#fff"
            						},
            						groupParent: {
              							height: 260,
              							zIndex: 0,
              							alignSelf: "stretch"
            						},
            						parent: {
              							width: 141,
              							height: 38,
              							top: 0
            						},
            						text: {
              							...textFont,
              							top: 24,
              							fontSize: 10,
              							lineHeight: 14,
              							color: "#657085",
              							left: 0,
              							position: "absolute"
            						},
            						text2: {
              							...textFont,
              							color: "#ff4b3c",
              							fontSize: 15,
              							left: 0,
              							position: "absolute",
              							top: 0
            						},
            						frameWrapper: {
              							top: 50
            						},
            						wrapperFlexBox: {
              							padding: 12,
              							justifyContent: "flex-end",
              							backgroundColor: "#f3f4f7",
              							borderRadius: 8,
              							alignSelf: "stretch",
              							overflow: "hidden"
            						},
            						d3dContainer: {
              							alignSelf: "stretch"
            						},
            						text3: {
              							...textFont,
              							fontSize: 12,
              							lineHeight: 16,
              							color: "#657085"
            						},
            						d3d: {
              							margin: 0,
              							paddingLeft: 19
            						},
            						d3d2: {
              							marginBottom: 0
            						},
            						d3d3: {
              							lineHeight: 20,
              							color: "#3b4049"
            						},
            						text7: {
              							...textFont,
              							top: 187,
              							fontSize: 15,
              							left: 8,
              							position: "absolute"
            						},
            						frameContainer: {
              							top: 216
            						},
            						wrapper: {
              							borderColor: "#d4d9e2",
              							padding: 12,
              							justifyContent: "flex-end",
              							backgroundColor: "#f3f4f7",
              							borderRadius: 8,
              							alignSelf: "stretch",
              							overflow: "hidden"
            						},
            						text8: {
              							...textFont,
              							color: "#b6bece",
              							fontSize: 15,
              							alignSelf: "stretch"
            						},
            						filledregularParent: {
              							width: 328,
              							height: 58,
              							marginLeft: -164,
              							bottom: 0,
              							left: "50%",
              							paddingBottom: 16,
              							gap: 10,
              							zIndex: 1,
              							flexDirection: "row",
              							position: "absolute",
              							overflow: "hidden"
            						},
            						filledregular: {
              							borderColor: "#f3f4f7",
              							borderWidth: 1,
              							borderStyle: "solid",
              							backgroundColor: "#fff",
              							paddingVertical: 0,
              							paddingHorizontal: 14,
              							justifyContent: "center",
              							alignItems: "center",
              							borderRadius: 6,
              							flex: 1
            						},
            						claim: {
              							...textFont,
              							fontSize: 14
            						},
            						filledregular2: {
              							backgroundColor: "#d4d9e2"
            						},
            						claim2: {
              							...textFont,
              							color: "#fff",
              							fontSize: 14
            						}
          					});
          					
          					export default Component;
          					
