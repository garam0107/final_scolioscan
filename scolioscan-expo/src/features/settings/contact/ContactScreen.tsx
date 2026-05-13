import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, {useState} from "react";
import type { SvgProps } from 'react-native-svg';
import { contactAPI } from '@/src/api/contact';
import styles from '@/src/features/settings/contact/contact.styles';
import { Alert, View, Image, Text, TextInput, TouchableOpacity, Pressable } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import ContactBugIcon from '../../../../assets/icons/setting/contact_bug.svg';
import ContactFeatureIcon from '../../../../assets/icons/setting/contact_feature.svg';
import ContactOtherIcon from '../../../../assets/icons/setting/contact_other.svg';
import ContactUxIcon from '../../../../assets/icons/setting/contact_ux.svg';

type ContactType = 'bug' | 'feature' | 'ux' | 'etc';

const CONTACT_TYPES: { key: ContactType; label: string; Icon: React.ComponentType<SvgProps> }[] = [
	{
		key: 'bug',
		label: '버그 신고',
		Icon: ContactBugIcon,
	},
	{
		key: 'feature',
		label: '기능 제안',
		Icon: ContactFeatureIcon,
	},
	{
		key: 'ux',
		label: 'UX 개선',
		Icon: ContactUxIcon,
	},
	{
		key: 'etc',
		label: '기타 문의',
		Icon: ContactOtherIcon,
	},
];

const MAX_SCREENSHOT_COUNT = 3;

export default function ContactScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [contactMessage, setContactMessage] = useState('');
	const [textInput2, onChangeTextInput2] = useState('');
	const [screenshots, setScreenshots] = useState<ImagePicker.ImagePickerAsset[]>([]);
	const [selectedContactType, setSelectedContactType] = useState<ContactType>('bug');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handlePickScreenshots = async () => {
		const remainingCount = MAX_SCREENSHOT_COUNT - screenshots.length;

		if (remainingCount <= 0) {
			Alert.alert('스크린샷', `스크린샷은 최대 ${MAX_SCREENSHOT_COUNT}장까지 추가할 수 있어요.`);
			return;
		}

		const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (!permissionResult.granted) {
			Alert.alert('권한 필요', '스크린샷을 추가하려면 사진 접근 권한이 필요해요.');
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images'],
			allowsMultipleSelection: true,
			selectionLimit: remainingCount,
			quality: 0.8,
		});

		if (result.canceled) {
			return;
		}

		setScreenshots((current) => [...current, ...result.assets].slice(0, MAX_SCREENSHOT_COUNT));
	};

	const handleRemoveScreenshot = (uri: string) => {
		setScreenshots((current) => current.filter((screenshot) => screenshot.uri !== uri));
	};

	const handleSubmit = async () => {
		if (!contactMessage.trim()) {
			Alert.alert('문의 내용', '문의 내용을 작성해주세요.');
			return;
		}

		if (isSubmitting) {
			return;
		}

		const selectedTypeLabel = CONTACT_TYPES.find((contactType) => contactType.key === selectedContactType)?.label ?? '기타 문의';

		try {
			setIsSubmitting(true);
			await contactAPI.sendContact({
				email: textInput2.trim() || undefined,
				inquiryType: selectedTypeLabel,
				inquiryContent: contactMessage.trim(),
				screenshots,
			});
			setContactMessage('');
			onChangeTextInput2('');
			setScreenshots([]);
			Alert.alert('문의하기', '문의가 전송되었습니다.');
		} catch {
			Alert.alert('문의하기', '문의 전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
			<View style={styles.header}>
				<Pressable hitSlop={12} onPress={() => router.back()} style={styles.headerBackButton}>
					<Ionicons name="chevron-back" size={24} color="#7E899F" />
				</Pressable>
				<Text style={styles.headerTitle}>문의하기</Text>
				<View style={styles.headerSide} />
			</View>

			<KeyboardAwareScrollView
				bottomOffset={128}
				style={styles.scrollView}
				contentContainerStyle={[styles.scrollContent, { paddingBottom: 0 }]}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.infoBox}>
					<Text style={styles.infoText}>불편한 점이나 개선 아이디어를 {"\n"}개발팀에 직접 전달할 수 있어요</Text>
				</View>
				<View style={styles.column}>
					<View style={styles.column2}>
						<Text style={styles.text2}>
							{"문의 유형"}
						</Text>
						<View style={styles.row2}>
							{CONTACT_TYPES.slice(0, 2).map((contactType, index) => {
								const selected = selectedContactType === contactType.key;
								const Icon = contactType.Icon;

								return (
									<TouchableOpacity
										key={contactType.key}
										style={[
											styles.typeButton,
											index === 0 && styles.typeButtonGap,
											selected ? styles.typeButtonActive : styles.typeButtonInactive,
										]}
										onPress={() => setSelectedContactType(contactType.key)}
									>
										<Icon width={24} height={24} style={styles.image2} />
										<Text style={styles.text3}>{contactType.label}</Text>
									</TouchableOpacity>
								);
							})}
						</View>
						<View style={styles.row3}>
							{CONTACT_TYPES.slice(2).map((contactType, index) => {
								const selected = selectedContactType === contactType.key;
								const Icon = contactType.Icon;

								return (
									<TouchableOpacity
										key={contactType.key}
										style={[
											styles.typeButton,
											index === 0 && styles.typeButtonGap,
											selected ? styles.typeButtonActive : styles.typeButtonInactive,
										]}
										onPress={() => setSelectedContactType(contactType.key)}
									>
										<Icon width={24} height={24} style={styles.image2} />
										<Text style={styles.text3}>{contactType.label}</Text>
									</TouchableOpacity>
								);
							})}
						</View>
					</View>
					<View style={styles.column2}>
						<Text style={styles.text2}>
							{"문의 내용"}
						</Text>
						<TextInput
							underlineColorAndroid="transparent"
							placeholder="문의 내용을 작성해주세요"
							placeholderTextColor="#B5BDCE"
							value={contactMessage}
							onChangeText={setContactMessage}
							multiline
							textAlignVertical="top"
							style={styles.messageInput}
						/>
					</View>
					<View style={styles.column2}>
						<Text style={styles.text5}>
							{"답변 받으실 이메일 (선택)"}
						</Text>
						<TextInput
							underlineColorAndroid="transparent"
							placeholder={"이메일 주소를 적어주세요"}
							placeholderTextColor="#B5BDCE"
							value={textInput2}
							onChangeText={onChangeTextInput2}
							style={styles.input2}
						/>
					</View>
					<View >
						<Text style={styles.text6}>
							{"스크린샷 (선택)"}
						</Text>
						<View style={styles.row4}>
							{screenshots.map((screenshot) => (
								<View key={screenshot.uri} style={styles.screenshotPreview}>
									<Image source={{ uri: screenshot.uri }} resizeMode="cover" style={styles.screenshotImage} />
									<TouchableOpacity
										hitSlop={8}
										style={styles.screenshotRemoveButton}
										onPress={() => handleRemoveScreenshot(screenshot.uri)}
									>
										<Ionicons name="close" size={14} color="#FFFFFF" />
									</TouchableOpacity>
								</View>
							))}
							{screenshots.length < MAX_SCREENSHOT_COUNT && (
								<TouchableOpacity style={styles.buttonColumn4} onPress={handlePickScreenshots}>
									<Image
										source = {{uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/by2ktXXBu3/u7hm65ee_expires_30_days.png"}}
										resizeMode = {"stretch"}
										style={styles.image3}
									/>
									<Text style={styles.text7}>
										{"추가"}
									</Text>
								</TouchableOpacity>
							)}
						</View>
					</View>
				</View>
			</KeyboardAwareScrollView>
			<View style={[styles.fixedFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
				<TouchableOpacity
					disabled={isSubmitting}
					style={[styles.button, isSubmitting && styles.buttonDisabled]}
					onPress={handleSubmit}
				>
					<Text style={styles.text8}>
						{isSubmitting ? "전송 중" : "문의하기"}
					</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	)
}
