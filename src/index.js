// @flow
import createClass from './core/createClass'
import Eve from './Eve'
import instance from './instance'
import statics from './statics'

export default createClass( instance, statics, Eve )

// ---

console.log( `Using Eve v${ VERSION } 👏` )
