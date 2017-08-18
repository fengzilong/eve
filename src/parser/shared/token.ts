export default function Token( type: string, value?: any ) {
	this.type = type
	if ( value ) {
		this.value = value
	}
}
