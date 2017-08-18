import { Watcher, mixin } from '../watcher'

test( 'should have $watch, $unwatch, $update', () => {
	const ob = new Watcher()

	expect( ob.$watch ).toBeDefined()
	expect( ob.$unwatch ).toBeDefined()
	expect( ob.$update ).toBeDefined()
} )
