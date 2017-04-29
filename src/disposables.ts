import Disposable from './disposable';

export default class Disposables {
	private _stash: Disposable[];

	constructor() {
		this._stash = [];
	}

	public add( target ) {
		if ( this._canDispose( target ) ) {
			this._stash.push( target );
		}
	}

	public remove( target ) {
		if ( this._canDispose( target ) ) {
			this._stash = this._stash
				.filter( ( disposable ) => disposable !== target );
		}
	}

	public dispose() {
		this._stash.forEach( ( disposable ) => disposable.dispose() );
		this._stash.length = 0;
	}

	private _canDispose( target ) {
		return target instanceof Disposable ||
		( target && typeof target.dispose === 'function' );
	}
}
