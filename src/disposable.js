// @flow
type IDisposable = {
	dispose: Function
}

export default class Disposable {
	// --- private ---

	_stash: IDisposable[]

	// --- constructor ---

	constructor() {
		this._stash = []
	}

	// --- public ---

	add( target: IDisposable ) {
		if ( this._canDispose( target ) ) {
			this._stash.push( target )
		} else {
			console.warn( `target isn't disposable`, target );
		}
	}

	remove( target: IDisposable ) {
		if ( this._canDispose( target ) ) {
			this._stash = this._stash
				.filter( ( disposable ) => disposable !== target )
		}
	}

	dispose() {
		this._stash.forEach( ( disposable ) => disposable.dispose() )
		this._stash.length = 0
	}

	// --- private ---

	_canDispose( target ) {
		return ( target && typeof target.dispose === 'function' )
	}
}
