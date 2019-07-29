import { getGreeting } from '../support/app.po';

describe('climate-tool', () => {
  beforeEach(() => cy.visit('/'));

  it('should display welcome message', () => {
    getGreeting().contains('Welcome to climate-tool!');
  });
});
