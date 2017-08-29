// @flow
export default class State {
	// --- private ---

	_: string[]

	// --- constructor ---

	constructor() {
		this._ = []
	}

	// --- public ---

	enter( state ) {
		this._.push( state )
	}

	leave( state ) {
		if ( !state ) {
			return this._.pop()
		}

		if ( this.is( state ) ) {
			return this._.pop()
		}
	}

	last() {
		return this._[ this._.length - 1 ]
	}

	is( state ) {
		return this.last() === state
	}
}
