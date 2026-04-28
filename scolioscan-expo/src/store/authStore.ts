import { create } from 'zustand';

type RegisterDraft = {
  email: string;
  password: string;
  name: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  gender: boolean | null;
  phone: string;
  address: string;
  detailAddress: string;
};

type AuthStoreState = {
  registerDraft: RegisterDraft;
  updateRegisterDraft: (patch: Partial<RegisterDraft>) => void;
  resetRegisterDraft: () => void;
};

const initialRegisterDraft: RegisterDraft = {
  email: '',
  password: '',
  name: '',
  birthYear: '',
  birthMonth: '',
  birthDay: '',
  gender: null,
  phone: '',
  address: '',
  detailAddress: '',
};

export const useAuthStore = create<AuthStoreState>((set) => ({
  registerDraft: initialRegisterDraft,
  updateRegisterDraft: (patch) =>
    set((state) => ({
      registerDraft: {
        ...state.registerDraft,
        ...patch,
      },
    })),
  resetRegisterDraft: () => set({ registerDraft: initialRegisterDraft }),
}));

export type { RegisterDraft };
