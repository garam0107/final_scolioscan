import api from '@/src/api/client';
import type * as ImagePicker from 'expo-image-picker';

type SendContactRequest = {
  email?: string;
  inquiryType: string;
  inquiryContent: string;
  screenshots: ImagePicker.ImagePickerAsset[];
};

export const contactAPI = {
  sendContact: ({ email, inquiryType, inquiryContent, screenshots }: SendContactRequest) => {
    const formData = new FormData();

    if (email) {
      formData.append('email', email);
    }

    formData.append('inquiry_type', inquiryType);
    formData.append('inquiry_content', inquiryContent);

    screenshots.forEach((screenshot, index) => {
      formData.append('screenshots', {
        uri: screenshot.uri,
        name: screenshot.fileName ?? `contact-screenshot-${index + 1}.jpg`,
        type: screenshot.mimeType ?? 'image/jpeg',
      } as any);
    });

    return api.post('/contact/with-attachments', formData);
  },
};
