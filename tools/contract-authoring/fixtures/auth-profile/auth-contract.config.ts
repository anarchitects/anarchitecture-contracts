export type EmptyStringPolicy = 'strip' | 'reject' | 'allow';

export interface AuthFieldConfig {
  required: boolean;
  minLength?: number;
  maxLength?: number;
  emptyStringPolicy: EmptyStringPolicy;
}

export interface RegisterFieldConfig {
  email: AuthFieldConfig;
  password: AuthFieldConfig;
  confirmPassword: AuthFieldConfig;
  name: AuthFieldConfig;
}

export interface LoginFieldConfig {
  credential: AuthFieldConfig;
  password: AuthFieldConfig;
}

export interface ForgotPasswordFieldConfig {
  email: AuthFieldConfig;
}

export interface ResetPasswordFieldConfig {
  token: AuthFieldConfig;
  password: AuthFieldConfig;
  confirmPassword: AuthFieldConfig;
}

export interface VerifyEmailFieldConfig {
  token: AuthFieldConfig;
}

export interface ChangePasswordFieldConfig {
  currentPassword: AuthFieldConfig;
  newPassword: AuthFieldConfig;
  confirmPassword: AuthFieldConfig;
}

export type LogoutFieldConfig = Record<string, never>;

export interface AuthContractConfig {
  version: string | number;
  register: RegisterFieldConfig;
  login: LoginFieldConfig;
  forgotPassword: ForgotPasswordFieldConfig;
  resetPassword: ResetPasswordFieldConfig;
  verifyEmail: VerifyEmailFieldConfig;
  changePassword: ChangePasswordFieldConfig;
  logout: LogoutFieldConfig;
}

export const DefaultAuthContractConfig = {
  version: '1.0.0',
  register: {
    email: {
      required: true,
      emptyStringPolicy: 'reject',
    },
    password: {
      required: true,
      minLength: 6,
      emptyStringPolicy: 'reject',
    },
    confirmPassword: {
      required: true,
      minLength: 6,
      emptyStringPolicy: 'reject',
    },
    name: {
      required: false,
      minLength: 2,
      maxLength: 100,
      emptyStringPolicy: 'reject',
    },
  },
  login: {
    credential: {
      required: true,
      minLength: 2,
      maxLength: 100,
      emptyStringPolicy: 'reject',
    },
    password: {
      required: true,
      minLength: 6,
      emptyStringPolicy: 'reject',
    },
  },
  forgotPassword: {
    email: {
      required: true,
      emptyStringPolicy: 'reject',
    },
  },
  resetPassword: {
    token: {
      required: true,
      minLength: 1,
      emptyStringPolicy: 'reject',
    },
    password: {
      required: true,
      minLength: 6,
      emptyStringPolicy: 'reject',
    },
    confirmPassword: {
      required: true,
      minLength: 6,
      emptyStringPolicy: 'reject',
    },
  },
  verifyEmail: {
    token: {
      required: true,
      minLength: 1,
      emptyStringPolicy: 'reject',
    },
  },
  changePassword: {
    currentPassword: {
      required: true,
      minLength: 6,
      emptyStringPolicy: 'reject',
    },
    newPassword: {
      required: true,
      minLength: 6,
      emptyStringPolicy: 'reject',
    },
    confirmPassword: {
      required: true,
      minLength: 6,
      emptyStringPolicy: 'reject',
    },
  },
  logout: {},
} as const satisfies AuthContractConfig;
