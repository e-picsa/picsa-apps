import { getGreeting } from '../support/app.po';

describe('station-data', () => {
  beforeEach(() => cy.visit('/'));

  it('should display welcome message', () => {
    getGreeting().contains('Welcome to station-data!');
  });
});
