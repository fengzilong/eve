import compile from '../compiler'
import { h, g, l, o } from '../vdom/helpers'

export default function createRenderFn( template, instance ) {
	const { render } = compile( template || '' )
	return render.bind(
		instance, // context
		h, g.bind( instance ), l, o // helpers
	)
}
