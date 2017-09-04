// @flow
import prop from 'dot-prop'
import deepEqual from 'deep-equal'
import { emitable } from './Emitter'
import uniqueId from '../utils/uniqueId'

type WO = {
	id: string,
	path: string,
	observer: Function,
	get: Function,
	last: any
}

export default class Watcher {
	// --- constructor ---

	constructor( { context = {}, path = 'data' } ) {
		emitable( this )
		this._context = context
		this._path = path
		this._computed = normalizeComputed( context.computed, context )
		this._computedCache = {}
	}

	// --- public ---

	$watch( path: string | string[], observer: Function, options = {} ): WO | WO[] {
		if ( Array.isArray( path ) ) {
			return path.map( p => this._watchOne( p, observer, options ) )
		}

		return this._watchOne( path, observer, options )
	}

	$unwatch( target: WO | WO[] ): void {
		if ( Array.isArray( target ) ) {
			return target.forEach( w => this._unwatchOne( w ) )
		}

		return this._unwatchOne( target )
	}

	$update() {
		this._digest( { ttl: 20 } )
		this._compute()
		this.$emit( 'update' )
	}

	$get( key ) {
		// $get will read computed property from cache
		if ( key in this._computedCache ) {
			return this._computedCache[ key ]
		}

		return prop.get( this._data(), key )
	}

	// --- private ---

	_compute() {
		const computed = this._computed
		const computedCache = this._computedCache
		for ( const key in computed ) {
			computedCache[ key ] = computed[ key ].get()
		}
	}

	_digest( { ttl } ) {
		const watchers = this._watchers || []
		const context = this._context

		while( ttl-- ) {
			let dirty = false

			for ( let i = 0, len = watchers.length; i < len; i++ ) {
				const watcher = watchers[ i ]
				const current = watcher.getter()
				if (
					( watcher.last !== current ) ||
					( ( typeof watcher.last === 'object' || typeof current === 'object' ) && !deepEqual( watcher.last, current ) )
				) {
					dirty = true
					watcher.observer.call( context, current, watcher.last )
				}
				watcher.last = current
			}

			if ( dirty && !ttl ) {
				throw new Error( 'Digest failed' )
			}

			if ( !dirty ) {
				break
			}
		}
	}

	_watchOne( path: string, observer: Function, options = {} ): WO {
		const getter = this._get.bind( this, path )
		const watcher: WO = {
			id: uniqueId(),
			path: path,
			observer: observer,
			getter,
			last: getter(),
		}

		this._watchers = this._watchers || []
		this._watchers.push( watcher )

		return watcher
	}

	_data() {
		return this._context[ this._path ] || {}
	}

	_get( path ) {
		const context = this._data()
		return prop.get( context, path )
	}

	_unwatchOne( watcher: WO ): void {
		const index = this._watchers.indexOf( watcher )
		this._watchers.splice( index, 1 )
	}
}

function normalizeComputed( computed = {}, context ) {
	const tmp = {}

	for ( const key in computed ) {
		const value = computed[ key ] || {}
		if ( typeof value === 'function' ) {
			tmp[ key ] = {
				get: value,
				set() {}
			}
		} else {
			tmp[ key ] = value
		}

		if ( typeof tmp[ key ].get === 'function' ) {
			tmp[ key ].get = tmp[ key ].get.bind( context )
		}

		if ( typeof tmp[ key ].get === 'function' ) {
			tmp[ key ].set = tmp[ key ].set.bind( context )
		}
	}

	return tmp
}
