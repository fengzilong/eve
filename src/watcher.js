// @flow
import uid from './utils/uid'

export { Watcher, watchable }

// ---------------------

type WO = {
	id: string,
	path: string,
	observer: Function,
	get: Function,
	last: any
}

function createMethods() {
	return {
		$watch(
			path: string | string[],
			observer: Function
		): WO | WO[] {
			if ( Array.isArray( path ) ) {
				return path.map( p => this._watchOne( p ) )
			}

			return this._watchOne( path, observer )
		},
		_watchOne( path: string, observer: Function ): WO {
			const watcher: WO = {
				id: uid(),
				path: path,
				observer: observer,
				get: function () {},
				last: void 0,
			}

			this._watchers = this._watchers || []
			this._watchers.push( watcher )

			return watcher
		},
		_get( path, context ) {

		},
		$unwatch( watcher: WO | WO[] ): void {
			if ( Array.isArray( watcher ) ) {
				return watcher.forEach( w => this._unwatchOne( w ) )
			}

			return this._unwatchOne( watcher )
		},
		_unwatchOne( watcher: WO ): void {

		},
		$update() {

		},
		_digest() {

		},
	}
}

function watchable( target: any = {} ): void {
	if ( typeof target === 'function' ) {
		Object.assign( target.prototype, createMethods() )
	} else {
		Object.assign( target, createMethods() )
	}
}

function Watcher( { context: any, onUpdate: Function } ) {}
watchable( Watcher )
