const statics = {
	component( name, Component ) {
		this.prototype.components = this.prototype.components || {}
		this.prototype.components[ name ] = Component
	},

	filter() {

	},

	directive() {

	},

	command() {

	},
}

export default statics
