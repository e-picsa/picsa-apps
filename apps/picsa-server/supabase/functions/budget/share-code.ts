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
  return Array.from(crypto.getRandomValues(new Uint32Array(SHARE_CODE_LENGTH)), (value) => {
    return SHARE_CODE_CHARS.charAt(value % SHARE_CODE_CHARS.length);
  }).join('');
};
