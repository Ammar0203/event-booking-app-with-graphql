import { authResolver } from './auth.js'
import { eventResolver } from './event.js'
import { bookingResolver } from './booking.js'
import _ from 'lodash'

const resolvers = _.merge(authResolver, bookingResolver, eventResolver) 

export default resolvers