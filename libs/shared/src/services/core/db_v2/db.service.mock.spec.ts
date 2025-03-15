import { PicsaDatabase_V2_Service } from './db.service';

export class MockPicsaDatabase_V2_Service extends PicsaDatabase_V2_Service {
  constructor() {
    super(null as any, { registerDB: () => null } as any);
  }
}
