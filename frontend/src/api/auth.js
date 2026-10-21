import api from './axios';

export const signupApi = (data) => api.post('/auth/signup', data);
export const verifyEmailApi = (data) => api.post('/auth/verify', data);
export const resendOtpApi = (data) => api.post('/auth/resend-otp', data);
export const loginApi = (data) => api.post('/auth/login', data);
export const logoutApi = () => api.post('/auth/logout');
export const logoutAllApi = () => api.post('/auth/logout-all');
export const getMeApi = () => api.get('/auth/me');
export const updateMeApi = (data) => api.patch('/auth/me', data);
export const changePasswordApi = (data) => api.patch('/auth/change-password', data);
export const forgetPasswordApi = (data) => api.post('/auth/forget-password', data);
export const resetPasswordApi = (data) => api.post('/auth/reset-password', data);
export const uploadProfileImageApi = (formData) =>
  api.patch('/auth/me/profile-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const updateProfileImageApi = (formData) =>
  api.patch('/auth/me/newprofile-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteUserApi = () => api.delete('/auth/users/me');
