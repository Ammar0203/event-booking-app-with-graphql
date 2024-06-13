import { GraphQLError } from 'graphql';

const UserInputError = (message) => {
  throw new GraphQLError(message, {
    extensions: {
      code: 'BAD_USER_INPUT',
    },
  });
}

export { UserInputError }