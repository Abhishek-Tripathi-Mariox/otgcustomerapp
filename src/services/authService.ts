import api from './api';

export interface SendOtpResponse {
  success: boolean;
  message: string;
  data: {
    mobile: string;
    expiresIn: number;
    isNewUser: boolean;
    otp?: string; // Only in development
  };
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      _id: string;
      name: string;
      mobile: string;
      email?: string;
      profileImage?: string;
      address?: any;
      status: string;
      isVerified: boolean;
      isNewUser: boolean;
    };
  };
}

export interface ResendOtpResponse {
  success: boolean;
  message: string;
  data: {
    mobile: string;
    expiresIn: number;
    attemptsRemaining: number;
    otp?: string; // Only in development
  };
}

export interface UserProfileResponse {
  success: boolean;
  data: any;
}

const authService = {
  sendOtp: (mobile: string) =>
    api.post<SendOtpResponse>('/mobile/auth/send-otp', {
      mobile,
      deviceType: 'android',
    }),

  verifyOtp: (mobile: string, otp: string) =>
    api.post<VerifyOtpResponse>('/mobile/auth/verify-otp', {
      mobile,
      otp,
      deviceType: 'android',
    }),

  resendOtp: (mobile: string) =>
    api.post<ResendOtpResponse>('/mobile/auth/resend-otp', {
      mobile,
      deviceType: 'android',
    }),

  getProfile: () => api.get<UserProfileResponse>('/mobile/auth/me'),

  updateProfile: async (data: {
    name?: string;
    email?: string;
    address?: any;
    profileImage?: string;
    profileImageBase64?: string;
    profileImageType?: string;
  }) => {
    return api.put<UserProfileResponse>('/mobile/auth/profile', data, {
      timeout: 30000, // 30s — base64 image payloads can be large
    });
  },

  updateFcmToken: (fcmToken: string) =>
    api.put('/mobile/auth/fcm-token', {fcmToken}),

  logout: () => api.post('/mobile/auth/logout'),
};

export default authService;
