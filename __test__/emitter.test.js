import Emitter, { mixin } from '../src/emitter';

test( 'Emitter $on and $emit', () => {
	const emitter = new Emitter();
	const fn = jest.fn();

	emitter.$on( 'foo', fn );
	emitter.$emit( 'foo', 'bar' );

	expect( fn ).toHaveBeenCalledTimes( 1 );
	expect( fn ).toHaveBeenCalledWith( 'bar' );

	emitter.$emit( 'foo', 'bar2' );

	expect( fn ).toHaveBeenCalledTimes( 2 );
	expect( fn ).toHaveBeenCalledWith( 'bar2' );
} );

test( 'Emitter $off should work', () => {
	const emitter = new Emitter();
	const fn = jest.fn();

	emitter.$on( 'foo', fn );
	emitter.$off( 'foo', fn );
	emitter.$emit( 'foo' );

	expect( fn ).toHaveBeenCalledTimes( 0 );
} );

test( 'Emitter $once should work', () => {
	const emitter = new Emitter();
	const fn = jest.fn();

	emitter.$once( 'foo', fn );
	emitter.$emit( 'foo' );
	emitter.$emit( 'foo' );

	expect( fn ).toHaveBeenCalledTimes( 1 );
} );

test( 'mixin should work', () => {
	const target = {};
	mixin( target );

	expect( target.$on ).toBeDefined();
	expect( target.$once ).toBeDefined();
	expect( target.$off ).toBeDefined();
	expect( target.$emit ).toBeDefined();
} );

test( 'mixin $on, $off, $emit should work', () => {
	const target = {};
	mixin( target );

	const fn = jest.fn();
	target.$on( 'foo', fn );
	target.$emit( 'foo', 'bar' );
	target.$off( 'foo', fn );
	target.$emit( 'foo', 'bar' );

	expect( fn ).toHaveBeenCalledTimes( 1 );
} );

test( 'mixin $once should work', () => {
	const target = {};
	mixin( target );

	const fn = jest.fn();
	target.$once( 'foo', fn );
	target.$emit( 'foo', 'bar' );
	target.$emit( 'foo', 'bar' );

	expect( fn ).toHaveBeenCalledTimes( 1 );
} );
