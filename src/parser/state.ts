export default class State {
	private _: string[]

	constructor() {
		this._ = []
	}

	public enter( state ) {
		this._.push( state )
	}

	public leave( state ) {
		if ( !state ) {
			return this._.pop()
		}

		if ( this.is( state ) ) {
			return this._.pop()
		}
	}

	public last() {
		return this._[ this._.length - 1 ]
	}

	public is( state ) {
		return this.last() === state
	}
}
