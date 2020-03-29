const { ApolloServer, gql } = require("apollo-server");
const { GraphQLScalarType } = require("graphql");
const { Kind } = require("graphql/language");

const typeDefs = gql`
  # Schema -> The thing that defines your types

  scalar Date

  enum Status { # Giá trị chỉ nằm trong 1 tập hữu hạn biết trước
    WATCHED
    INTERESTED
    NOT_INTERESTED
    UNKNOWN
  }

  type Actor {
    id: ID!
    name: String!
  }

  type Movie {
    id: ID! # type đặc biệt nè
    title: String!
    releaseDate: Date
    rating: Int
    # fake1: Float
    # fake2: Boolean
    status: Status
    # actor: [Actor] # Valid: null, [], [...some data]; Not valid: [ some data without name or id ]
    actor: [Actor]! # Valid: [], [...some data]; Not valid: [ some data without name or id ]
    # actor: [Actor!]! # Valid: [...some data]; Not valid: [ some data without name or id ]
  }

  # Define a query
  type Query {
    movies: [Movie]
    movie(id: ID): Movie
  }
`;

const movies = [
  {
    id: "dfkjfjvh4858rj34ju1",
    title: "5 Deadly Venoms",
    releaseDate: new Date("12-08-1978"),
    rating: 5,
    actor: [
      // {
      //   id: "23eb3hc31h329y7",
      //   name: "Gordon Liu"
      // }
    ]
  },
  {
    id: "3rdfj23ej3jc34",
    title: "The 36th Chamber of Shaolin",
    releaseDate: new Date("02-02-1978"),
    rating: 5,
    actor: [
      // {
      //   name: "Henry"
      // }
    ]
  }
];

// Dạng cơ bản, 1 GraphQL server sẽ có 1 hàm resolver cho mỗi 1 field trong schema của nó.
const resolvers = {
  Query: {
    movies: () => {
      return movies;
    },

    // obj: liên quan tới cấp cao hơn; context: thông tin user, auth,...; info: ít dùng, tìm hiểu sau
    movie: (obj, args, context, info) => {
      const { id } = args;
      const foundMovie = movies.find(m => m.id === id);

      return foundMovie;
    }
  },
  Date: new GraphQLScalarType({
    name: "Date",
    description: "It's a date, deal with it.",
    parseValue(value) {
      // value from the client
      return new Date(value);
    },
    serialize(value) {
      // value sent to the client
      return value.getTime();
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return new Date(ast.value);
      }
      return null;
    }
  })
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true
});
// Chạy node index.js
server
  .listen({
    port: process.env.PORT || 4000
  })
  .then(({ url }) => {
    console.log(`SERVER STARTED AT ${url}`);
  });
