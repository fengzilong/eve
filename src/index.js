// @flow
import makeClass from './makeClass'
import Eve from './Eve'
import instance from './instance'
import statics from './statics'

export default makeClass( instance, statics, Eve )

// ---

console.log( `Using Eve v${ VERSION } 👏` )
