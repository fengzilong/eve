import Emitter, { emitable } from '../Emitter'

test( 'Emitter $on and $emit', () => {
	const emitter = new Emitter()
	const fn = jest.fn()

	emitter.$on( 'foo', fn )
	emitter.$emit( 'foo', 'bar' )

	expect( fn ).toHaveBeenCalledTimes( 1 )
	expect( fn ).toHaveBeenCalledWith( 'bar' )

	emitter.$emit( 'foo', 'bar2' )

	expect( fn ).toHaveBeenCalledTimes( 2 )
	expect( fn ).toHaveBeenCalledWith( 'bar2' )
} )

test( 'Emitter $off should work', () => {
	const emitter = new Emitter()
	const fn = jest.fn()

	emitter.$on( 'foo', fn )
	emitter.$off( 'foo', fn )
	emitter.$emit( 'foo' )

	expect( fn ).toHaveBeenCalledTimes( 0 )
} )

test( 'Emitter $once should work', () => {
	const emitter = new Emitter()
	const fn = jest.fn()

	emitter.$once( 'foo', fn )
	emitter.$emit( 'foo' )
	emitter.$emit( 'foo' )

	expect( fn ).toHaveBeenCalledTimes( 1 )
} )

test( 'emitable should work', () => {
	const target = {}
	emitable( target )

	expect( target.$on ).toBeDefined()
	expect( target.$once ).toBeDefined()
	expect( target.$off ).toBeDefined()
	expect( target.$emit ).toBeDefined()
} )

test( 'emitable $on, $off, $emit should work', () => {
	const target = {}
	emitable( target )

	const fn = jest.fn()
	target.$on( 'foo', fn )
	target.$emit( 'foo', 'bar' )
	target.$off( 'foo', fn )
	target.$emit( 'foo', 'bar' )

	expect( fn ).toHaveBeenCalledTimes( 1 )
} )

test( 'emitable $once should work', () => {
	const target = {}
	emitable( target )

	const fn = jest.fn()
	target.$once( 'foo', fn )
	target.$emit( 'foo', 'bar' )
	target.$emit( 'foo', 'bar' )

	expect( fn ).toHaveBeenCalledTimes( 1 )
} )

test( 'multiple $on', () => {
	const target = {}
	emitable( target )

	const fn1 = jest.fn()
	const fn2 = jest.fn()
	target.$on( 'foo', fn1 )
	target.$on( 'foo', fn2 )

	target.$emit( 'foo' )
	expect( fn1 ).toHaveBeenCalledTimes( 1 )
	expect( fn2 ).toHaveBeenCalledTimes( 1 )

	target.$emit( 'foo' )
	expect( fn1 ).toHaveBeenCalledTimes( 2 )
	expect( fn2 ).toHaveBeenCalledTimes( 2 )
} )

test( 'multiple $on with the same fn', () => {
	const target = {}
	emitable( target )

	const fn = jest.fn()
	target.$on( 'foo', fn )
	target.$on( 'foo', fn )

	target.$emit( 'foo' )
	expect( fn ).toHaveBeenCalledTimes( 2 )

	target.$emit( 'foo' )
	expect( fn ).toHaveBeenCalledTimes( 4 )
} )

test( 'multiple $once', () => {
	const target = {}
	emitable( target )

	const fn1 = jest.fn()
	const fn2 = jest.fn()
	target.$once( 'foo', fn1 )
	target.$once( 'foo', fn2 )

	target.$emit( 'foo' )
	expect( fn1 ).toHaveBeenCalledTimes( 1 )
	expect( fn2 ).toHaveBeenCalledTimes( 1 )

	target.$emit( 'foo' )
	expect( fn1 ).toHaveBeenCalledTimes( 1 )
	expect( fn2 ).toHaveBeenCalledTimes( 1 )
} )

test( 'multiple $once with the same fn', () => {
	const target = {}
	emitable( target )

	const fn = jest.fn()
	target.$once( 'foo', fn )
	target.$once( 'foo', fn )

	target.$emit( 'foo' )
	expect( fn ).toHaveBeenCalledTimes( 2 )

	target.$emit( 'foo' )
	expect( fn ).toHaveBeenCalledTimes( 2 )
} )

test( 'multiple $once and $off', () => {
	const target = {}
	emitable( target )

	const fn = jest.fn()
	target.$once( 'foo', fn )
	target.$once( 'foo', fn )
	target.$off( 'foo', fn )

	target.$emit( 'foo' )
	expect( fn ).toHaveBeenCalledTimes( 0 )

	target.$emit( 'foo' )
	expect( fn ).toHaveBeenCalledTimes( 0 )
} )

test( '$off all listeners', () => {
	const target = {}
	emitable( target )

	const fn1 = jest.fn()
	const fn2 = jest.fn()
	target.$once( 'foo', fn1 )
	target.$once( 'foo', fn2 )
	target.$off( 'foo' )

	target.$emit( 'foo' )
	expect( fn1 ).toHaveBeenCalledTimes( 0 )
	expect( fn2 ).toHaveBeenCalledTimes( 0 )
} )
