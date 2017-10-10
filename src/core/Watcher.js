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
		this._watchers = []
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
		this.$emit( 'update' )
	}

	// read from cache
	$get( path ) {
		return this._get( path, { fromCache: true } )
	}

	// --- private ---

	_get( path: string, options: any = {} ) {
		if ( this._isComputed( path ) ) {
			// re-calc if not from cache
			if ( !options.fromCache ) {
				this._compute( path )
			}
			return this._computedCache[ path ]
		}

		return prop.get( this._data(), path )
	}

	_isComputed( path: string ) {
		return path in this._computed
	}

	_compute( path?: string ) {
		const computed = this._computed

		if ( typeof path === 'undefined' ) {
			// cache all
			for ( const p in computed ) {
				this._cacheComputedByPath( p )
			}
		} else {
			// cache one
			this._cacheComputedByPath( path )
		}
	}

	_cacheComputedByPath( path: string ) {
		this._computedCache[ path ] = this._computed[ path ].get()
	}

	// during digest, computed properties will be fetched from last digest cache
	_digest( { ttl } ) {
		const watchers = this._watchers
		const context = this._context

		while( ttl-- ) {
			let dirty = false

			for ( let i = 0, len = watchers.length; i < len; i++ ) {
				const watcher = watchers[ i ]
				// automatically calc computed properties and cache it
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
				throw new Error( 'digest too many times' )
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
