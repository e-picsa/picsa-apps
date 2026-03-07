import { adminBoundaries } from './admin-boundaries.ts';

const req = new Request('http://localhost/climate/admin-boundaries', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ country_code: 'ZW', admin_level: 2 }),
});

console.log('Sending request...');
const res = await adminBoundaries(req);
console.log('Status:', res.status);
const text = await res.text();
if (res.status === 200) {
  console.log('Success! Output length:', text.length);
  // parse and print top level keys
  const data = JSON.parse(text);
  console.log('Keys:', Object.keys(data));
  if (data.objects) {
    console.log('Objects:', Object.keys(data.objects));
    for (const key of Object.keys(data.objects)) {
      console.log(`\nObject: ${key}`);
      const obj = data.objects[key];
      console.log('Type:', obj.type);
      if (obj.geometries && obj.geometries.length > 0) {
        console.log(`Found ${obj.geometries.length} geometries`);
        console.log('First geometry type:', obj.geometries[0].type);
        console.log('First geometry properties:', obj.geometries[0].properties);
        console.log('Second geometry properties:', obj.geometries[1]?.properties);
      }
    }
  }
} else {
  console.error('Error:', text);
}
