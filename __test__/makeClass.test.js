import extendify from '../src/makeClass';

test( 'should have extend and implement', () => {
	const Foo = extendify( {
		bar: 1
	} );

	expect( Foo.bar ).toBe( 1 );
	expect( Foo.extend ).toBeDefined();
	expect( Foo.implement ).toBeDefined();
} );

test( 'extend two times', () => {
	const Parent = jest.fn();
	Parent.prototype.bar = 1;

	const Foo = extendify( Parent );
	const Foo2 = Foo.extend();
	const Foo3 = Foo2.extend();

	expect( new Foo3().bar ).toBe( 1 );
	expect( Parent ).toHaveBeenCalledTimes( 1 );
	expect( Foo2.extend ).toBeDefined();
	expect( Foo2.implement ).toBeDefined();
} );
