import { api } from './api';

export const uploadImageFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const data = response.data.data || response.data;
  return data.url;
};

export const uploadSingleImageFile = uploadImageFile;

export const uploadMultipleImageFiles = async (files: FileList | File[]): Promise<string[]> => {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('images', files[i]);
  }

  try {
    const response = await api.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = response.data.data || response.data;
    if (Array.isArray(data.urls)) {
      return data.urls;
    }
  } catch (e) {
    // Fallback: upload individually if batch endpoint encounters an error
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = await uploadImageFile(files[i]);
      urls.push(url);
    }
    return urls;
  }
  return [];
};
