import Observer from '../src/observer';

test( 'should have $watch, $unwatch, $update', () => {
	const ob = new Observer();

	expect( ob.$watch ).toBeDefined();
	expect( ob.$unwatch ).toBeDefined();
	expect( ob.$update ).toBeDefined();
} );
