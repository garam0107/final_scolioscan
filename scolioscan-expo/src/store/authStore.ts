import { create } from 'zustand';

type RegisterDraft = {
  email: string;
  password: string;
  name: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  carrier: string | null;
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
  carrier: null,
  gender: null,
  phone: '',
  address: '',
  detailAddress: '',
};

export const useAuthStore = create<AuthStoreState>((set) => ({
  registerDraft: initialRegisterDraft,
  updateRegisterDraft: (patch) =>
    // 각 가입 단계에서 입력한 일부 값만 덮어써도 나머지 단계 값은 유지한다.
    set((state) => ({
      registerDraft: {
        ...state.registerDraft,
        ...patch,
      },
    })),
  // 가입 화면 진입과 이탈 시 이전 임시 입력값이 남지 않도록 초기 상태로 돌린다.
  resetRegisterDraft: () => set({ registerDraft: initialRegisterDraft }),
}));

export type { RegisterDraft };
