describe('draw a vector', () => {
    it('adds the svg vector', () => {
        cy.visit('http://localhost:8080');

        cy.get('#command_input').type("a = vector(0,0,0.5,0.5){enter}");
        cy.get('#0').invoke('attr','d').should('eq','M550 350 L600 300');
        cy.get('#0').invoke('attr','class').should('eq','vector');
        cy.get('#0').invoke('attr','marker-end').should('eq','url(#arrow)');

        cy.get('#command_input').type("b = vector(0,0,-1,1){enter}");
        cy.get('#1').invoke('attr','d').should('eq','M550 350 L450 250');

        cy.get('#command_input').type("c = a + b{enter}");
        cy.get('#2').invoke('attr','d').should('eq','M550 350 L500 200');
    })
})
