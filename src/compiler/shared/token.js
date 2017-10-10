// @flow
export default function Token( type: string, value?: any, extra?: any ) {
	this.type = type

	if ( value ) {
		this.value = value
	}

	if ( extra ) {
		Object.assign( this, extra )
	}
}
