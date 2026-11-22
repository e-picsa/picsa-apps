/** Generic card shape shared by tools that support user-created custom cards (e.g. budget, seasonal calendar) */
export interface IPicsaCustomCard {
  /** id used as well as key to easier specify image (and be non-unique for things like inputs and outputs) */
  id: string;
  label: string;
  type: string;
  groupings?: string[];
  customMeta?: IPicsaCustomCardMeta;
  imgType: 'svg' | 'png';
  /** Optional image override (default uses card id) */
  imgId?: string;
  _deleted?: boolean;
}

export interface IPicsaCustomCardMeta {
  imgData: string;
  dateCreated: string;
  createdBy: string;
}
