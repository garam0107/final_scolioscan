import React, {useState} from "react";
import styles from '@/src/features/settings/contact/contact.styles';
import { View, ScrollView, Image, Text, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function ContactScreen() {
	const [textInput1, onChangeTextInput1] = useState('');
	const [textInput2, onChangeTextInput2] = useState('');
	return (
		<SafeAreaView style={styles.container}>
			<ScrollView  style={styles.scrollView}>
				<View style={styles.row}>
					<Image
						source = {{uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/by2ktXXBu3/8ifw3z4u_expires_30_days.png"}} 
						resizeMode = {"stretch"}
						style={styles.image}
					/>
					<Text style={styles.text}>
						{"문의하기"}
					</Text>
					<View style={styles.box}>
					</View>
				</View>
				<TextInput
					placeholder={"불편한 점이나 개선 아이디어를개발팀에 직접 전달할 수 있어요"}
					value={textInput1}
					onChangeText={onChangeTextInput1}
					style={styles.input}
				/>
				<View style={styles.column}>
					<View style={styles.column2}>
						<Text style={styles.text2}>
							{"문의 유형"}
						</Text>
						<View style={styles.row2}>
							<TouchableOpacity style={styles.buttonColumn} onPress={()=>alert('Pressed!')}>
								<Image
									source = {{uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/by2ktXXBu3/kxcbayfb_expires_30_days.png"}} 
									resizeMode = {"stretch"}
									style={styles.image2}
								/>
								<Text style={styles.text3}>
									{"버그 신고"}
								</Text>
							</TouchableOpacity>
							<TouchableOpacity style={styles.buttonColumn2} onPress={()=>alert('Pressed!')}>
								<Image
									source = {{uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/by2ktXXBu3/7m103exx_expires_30_days.png"}} 
									resizeMode = {"stretch"}
									style={styles.image2}
								/>
								<Text style={styles.text3}>
									{"기능 제안"}
								</Text>
							</TouchableOpacity>
						</View>
						<View style={styles.row3}>
							<TouchableOpacity style={styles.buttonColumn3} onPress={()=>alert('Pressed!')}>
								<Image
									source = {{uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/by2ktXXBu3/mznxeslj_expires_30_days.png"}} 
									resizeMode = {"stretch"}
									style={styles.image2}
								/>
								<Text style={styles.text3}>
									{"UX 개선"}
								</Text>
							</TouchableOpacity>
							<TouchableOpacity style={styles.buttonColumn2} onPress={()=>alert('Pressed!')}>
								<Image
									source = {{uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/by2ktXXBu3/foajcx4c_expires_30_days.png"}} 
									resizeMode = {"stretch"}
									style={styles.image2}
								/>
								<Text style={styles.text3}>
									{"기타 문의"}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
					<View style={styles.column2}>
						<Text style={styles.text2}>
							{"문의 내용"}
						</Text>
						<View style={styles.view}>
							<Text style={styles.text4}>
								{"문의 내용을 작성해주세요"}
							</Text>
						</View>
					</View>
					<View style={styles.column2}>
						<Text style={styles.text5}>
							{"답변 받으실 이메일 (선택)"}
						</Text>
						<TextInput
							placeholder={"이메일 주소를 적어주세요"}
							value={textInput2}
							onChangeText={onChangeTextInput2}
							style={styles.input2}
						/>
					</View>
					<View style={styles.column3}>
						<Text style={styles.text6}>
							{"스크린샷 (선택)"}
						</Text>
						<View style={styles.row4}>
							<TouchableOpacity style={styles.buttonColumn4} onPress={()=>alert('Pressed!')}>
								<Image
									source = {{uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/by2ktXXBu3/ym7b3ff5_expires_30_days.png"}} 
									resizeMode = {"stretch"}
									style={styles.image3}
								/>
								<Text style={styles.text7}>
									{"추가"}
								</Text>
							</TouchableOpacity>
							<View >
								<View style={styles.box2}>
								</View>
								<Image
									source = {{uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/by2ktXXBu3/pzpy8wjr_expires_30_days.png"}} 
									resizeMode = {"stretch"}
									style={styles.absoluteImage}
								/>
							</View>
						</View>
					</View>
				</View>
				<View style={styles.view2}>
					<TouchableOpacity style={styles.button} onPress={()=>alert('Pressed!')}>
						<Text style={styles.text8}>
							{"문의하기"}
						</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</SafeAreaView>
	)
}