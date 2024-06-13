import { GraphQLError } from "graphql";

const isLoggedin = (parent, args, { user }, info) => {
  if (!user) {
    throw new GraphQLError("يجب تسجيل دخولك!!", {
      extensions: {
        code: "BAD_USER_INPUT",
      },
    });
  }
};

export { isLoggedin };
