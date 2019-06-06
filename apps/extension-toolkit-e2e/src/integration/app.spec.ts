import { getGreeting } from '../support/app.po';

describe('extension-toolkit', () => {
  beforeEach(() => cy.visit('/'));

  it('should display welcome message', () => {
    getGreeting().contains('Welcome to extension-toolkit!');
  });
});
