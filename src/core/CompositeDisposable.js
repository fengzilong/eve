// @flow

export default CompositeDisposable

// ---

type ICompositeDisposable = {
	dispose: Function
}

class CompositeDisposable {
	// --- private ---

	_stash: ICompositeDisposable[]

	// --- constructor ---

	constructor() {
		this._stash = []
	}

	// --- public ---

	add( target: ICompositeDisposable ) {
		if ( this._canDispose( target ) ) {
			this._stash.push( target )
		} else {
			console.warn( `target isn't disposable`, target );
		}
	}

	remove( target: ICompositeDisposable ) {
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
