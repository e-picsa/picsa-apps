const SHARE_CODE_CHARS = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
const SHARE_CODE_LENGTH = 4;
const SHARE_CODE_REGEX = new RegExp(`^[${SHARE_CODE_CHARS}]{${SHARE_CODE_LENGTH}}$`);

export const normalizeShareCode = (code?: string | null) => {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();
  return SHARE_CODE_REGEX.test(normalized) ? normalized : null;
};

export const isShareCodeValid = (code: string) => SHARE_CODE_REGEX.test(code);

export const generateShareCode = () => {
  let value = '';
  for (let i = 0; i < SHARE_CODE_LENGTH; i++) {
    value += SHARE_CODE_CHARS.charAt(Math.floor(Math.random() * SHARE_CODE_CHARS.length));
  }
  return value;
};
