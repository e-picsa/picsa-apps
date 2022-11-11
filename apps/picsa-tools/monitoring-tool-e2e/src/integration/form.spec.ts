describe('picsa-tools-monitoring-tool', () => {
  beforeEach(() => cy.visit('/'));

  it('Shows default form', () => {
    //
    cy.get('#form-title').contains('PICSA Apps - Extension Worker Monitoring');
  });
});
