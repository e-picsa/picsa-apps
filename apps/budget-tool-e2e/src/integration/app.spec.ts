import { getGreeting } from '../support/app.po';

describe('budget-tool', () => {
  beforeEach(() => cy.visit('/'));

  it('should display welcome message', () => {
    getGreeting().contains('Welcome to budget-tool!');
  });
});
