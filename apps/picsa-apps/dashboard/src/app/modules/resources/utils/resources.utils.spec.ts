// TODO - add to test spec
const test_data = [
  { id: '1.1.1.1', collection_parent: '1.1.1' },
  { id: '2' },
  { id: '1.1', collection_parent: '1' },
  { id: '1.2', collection_parent: '1' },
  { id: '1.3', collection_parent: '1' },
  { id: '1.1.1', collection_parent: '1.1' },
  { id: 'hanging_1', collection_parent: 'missing' },
  { id: '1' },
  { id: 'circular_1', collection_parent: 'circular_2' },
  { id: 'circular_2', collection_parent: 'circular_3' },
];
