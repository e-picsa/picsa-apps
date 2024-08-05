import { arrayToHashmap } from '../../../../../../libs/utils';

const MW_DISTRICTS = [
  { id: 'balaka', label: 'Balaka' },
  { id: 'blantyre', label: 'Blantyre' },
  { id: 'chikwawa', label: 'Chikwawa' },
  { id: 'chiradzulu', label: 'Chiradzulu' },
  { id: 'chitipa', label: 'Chitipa' },
  { id: 'dedza', label: 'Dedza' },
  { id: 'dowa', label: 'Dowa' },
  { id: 'karonga', label: 'Karonga' },
  { id: 'kasungu', label: 'Kasungu' },
  { id: 'likoma', label: 'Likoma' },
  { id: 'lilongwe', label: 'Lilongwe' },
  { id: 'machinga', label: 'Machinga' },
  { id: 'mangochi', label: 'Mangochi' },
  { id: 'mchinji', label: 'Mchinji' },
  { id: 'mulanje', label: 'Mulanje' },
  { id: 'mwanza', label: 'Mwanza' },
  { id: 'mzimba', label: 'Mzimba' },
  { id: 'neno', label: 'Neno' },
  { id: 'nkhata_bay', label: 'Nkhata Bay' },
  { id: 'nkhotakota', label: 'Nkhotakota' },
  { id: 'nsanje', label: 'Nsanje' },
  { id: 'ntcheu', label: 'Ntcheu' },
  { id: 'ntchisi', label: 'Ntchisi' },
  { id: 'phalombe', label: 'Phalombe' },
  { id: 'rumphi', label: 'Rumphi' },
  { id: 'salima', label: 'Salima' },
  { id: 'thyolo', label: 'Thyolo' },
  { id: 'zomba', label: 'Zomba' },
];

export const DISTRICTS = {
  mw: arrayToHashmap(MW_DISTRICTS, 'label'),
};
