import { getGreeting } from '../support/app.po';

describe('picsa', () => {
  beforeEach(() => cy.visit('/'));

  it('should display welcome message', () => {
    getGreeting().contains('Welcome to picsa!');
  });
});
