describe('draw a vector', () => {
    it('adds the svg vector', () => {
        cy.visit('http://localhost:8080');
        cy.get('#command_input').type("{enter}");

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

describe('draw a lazy vector', () => {
    it('adds the svg vector', () => {
        cy.visit('http://localhost:8080');
        cy.get('#command_input').type("{enter}");

        cy.get('#command_input').type("a = [0.5,0.5]{enter}");
        cy.get('#0').invoke('attr','d').should('eq','M550 350 L600 300');
        cy.get('#0').invoke('attr','class').should('eq','vector');
        cy.get('#0').invoke('attr','marker-end').should('eq','url(#arrow)');

        cy.get('#command_input').type("b = vector(0,0,-1,1){enter}");
        cy.get('#1').invoke('attr','d').should('eq','M550 350 L450 250');

        cy.get('#command_input').type("c = \"a + b\"{enter}"); // same as above, but lazy
        cy.get('#3').invoke('attr','d').should('eq','M550 350 L500 200');

        cy.get('#command_input').type("a = a*2{enter}"); // so what happens to lazy, when it's constituents are altered?
        // a is now double in size, so c must also changed
        // c now refers to @4
        cy.get('#4').invoke('attr','d').should('eq','M550 350 L650 250');

        cy.get('#command_input').type("a = 1{enter}"); // so what happens to lazy, when it's constituents are altered?

        cy.get("#l4").then(text => {
            expect(text.text()).to.equal('@4');   // binding has been changed (to 1, ie not a vector),
                                                        // so this is now a 'free' vector with a reference label
        });
    })
})