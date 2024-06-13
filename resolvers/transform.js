const transformEvent = event => ({
  ...event._doc,
  date: new Date(event.date).toISOString().replace(/T/, " ")
}) 

const transformBooking = booking => ({
  ...booking._doc,
  createdAt: booking.createdAt.toDateString(),
  updatedAt: booking.updatedAt.toDateString()
}) 

export { transformBooking, transformEvent }
