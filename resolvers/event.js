import Event from '../models/event.js'
import { transformEvent } from './transform.js'
import { UserInputError } from './errorHandling.js'
import { combineResolvers } from 'graphql-resolvers'
import { isLoggedin } from '../middlewares/isLogin.js'
import { PubSub } from 'graphql-subscriptions'

const pubsub = new PubSub()

const eventResolver = {
  Query: {
    events: async () => {
      try {
        const events = await Event.find({}).sort({ created_at: 'desc' }).populate('creator')
        return events.map(event => transformEvent(event))
      } catch (error) {
        throw error
      }
    },
    getUserEvents: async (_, { userId }) => {
      try {
        const events = await Event.find({ creator: userId })
        return events.map(event => transformEvent(event))
      } catch (error) {
        throw error
      }
    }
  },

  Mutation: {
    createEvent: combineResolvers(isLoggedin, async (_, args, context) => {
      const ExistingEvent = await Event.findOne({ title: args.eventInput.title })
      if (ExistingEvent) {
        UserInputError('يوجد لدينا مناسبة بنفس هذا العنوان، الرجاء اختيار عنوان آخر!')
      }
      const event = new Event({
        title: args.eventInput.title,
        description: args.eventInput.description,
        price: args.eventInput.price,
        date: new Date(args.eventInput.date),
        creator: context.user._id,
      })

      let createdEvent
      try {
        const result = await event.save()
        createdEvent = transformEvent(result)
        pubsub.publish('EVENT_ADDED', {
          eventAdded: createdEvent
        })
        return createdEvent
      } catch (err) {
        throw err
      }
    }),
    deleteEvent: async (_, args) => {
      try {
        await Event.deleteOne({ _id: args.eventId })
        return Event.find({})
      } catch (err) {
        throw err
      }
    }
  },

  Subscription: {
    eventAdded: {
      subscribe: () => pubsub.asyncIterator(['EVENT_ADDED']),
    },
  },
}

// module.exports = { eventResolver }
export { eventResolver }