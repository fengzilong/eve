import uid from '../src/shared/uid';

test( 'uid works', () => {
	const uid1 = uid();
	const uid2 = uid();
	expect( uid1 === uid2 ).toBe( false );
} );
