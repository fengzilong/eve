import makeClass from '../src/makeClass';

test( 'should have extend and implement', () => {
	const Foo = makeClass( {
		foo: 1,
	}, {
		bar: 2
	} );

	expect( new Foo().foo ).toBe( 1 );
	expect( Foo.bar ).toBe( 2 );
	expect( Foo.extend ).toBeDefined();
	expect( Foo.implement ).toBeDefined();
} );

test( 'extend two times', () => {
	const Parent = jest.fn();
	Parent.prototype.bar = 1;

	const Foo = makeClass( {}, {}, Parent );
	const Foo2 = Foo.extend();
	const Foo3 = Foo2.extend();

	expect( new Foo3().bar ).toBe( 1 );
	new Foo2();
	expect( Parent ).toHaveBeenCalledTimes( 2 );
	expect( Foo2.extend ).toBeDefined();
	expect( Foo2.implement ).toBeDefined();
} );
