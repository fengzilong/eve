import makeClass from '../createClass'

test( 'should have extend and implement', () => {
	const Foo = makeClass()

	expect( Foo.extend ).toBeDefined()
	expect( Foo.implement ).toBeDefined()
} )

test( 'static props', () => {
	const Foo = makeClass( {}, {
		bar: 1,
	} )

	expect( Foo.bar ).toBe( 1 )
} )

test( 'inherits static props', () => {
	const Foo = makeClass( {}, {
		bar: 1,
	} )

	const Foo2 = Foo.extend()

	expect( Foo2.bar ).toBe( 1 )
} )

test( 'prototype props', () => {
	const Foo = makeClass( {
		bar: 2,
	}, {} )

	expect( ( new Foo() ).bar ).toBe( 2 )
} )

test( 'parent constructor invoked times', () => {
	const Parent = jest.fn()
	const Child = makeClass( {}, {}, Parent )
	new Child()
	expect( Parent ).toHaveBeenCalledTimes( 1 )
	new Child()
	expect( Parent ).toHaveBeenCalledTimes( 2 )
} )

test( 'extend protoProp inherits', () => {
	function Parent() {}
	Parent.prototype.bar = 1

	const Foo = makeClass( {
		protoProp: 2,
	}, {
		staticProp: 3,
	}, Parent )
	const Foo2 = Foo.extend()
	const Foo3 = Foo2.extend()

	expect( ( new Foo3() ).bar ).toBe( 1 )
	expect( ( new Foo3() ).protoProp ).toBe( 2 )
} )

test( 'extend several times', () => {
	const Parent = jest.fn()
	Parent.prototype.bar = 1

	const Foo = makeClass( {}, {}, Parent )
	const Foo2 = Foo.extend()
	const Foo3 = Foo2.extend()

	expect( new Foo3().bar ).toBe( 1 )
	expect( Foo2.extend ).toBeDefined()
	expect( Foo2.implement ).toBeDefined()
} )

test( 'implement', () => {
	const Foo = makeClass()

	Foo.implement( {
		foo: 1
	} )

	expect( ( new Foo() ).foo ).toBe( 1 )
} )

test( 'implement override', () => {
	const Foo = makeClass( {
		foo: 1
	} )

	Foo.implement( {
		foo: 2
	} )

	expect( ( new Foo() ).foo ).toBe( 2 )
} )

test( 'invoke supr method', () => {
	const foo = jest.fn()
	const Foo = makeClass( {
		foo,
	} )

	const Foo2 = Foo.extend( {
		foo() {
			this.supr()
		}
	} )

	const foo2 = new Foo2()
	foo2.foo()

	expect( foo ).toHaveBeenCalledTimes( 1 )
} )
