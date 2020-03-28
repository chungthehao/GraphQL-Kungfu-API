const { ApolloServer, gql } = require("apollo-server");

const typeDefs = gql`
  # comment here: Schema -> The thing that defines your types
  type Movie {
    title: String
    releaseDate: String
    rating: Int
  }

  # Define a query
  type Query {
    movies: [Movie]
  }
`;

const movies = [
  {
    title: "5 Deadly Venoms",
    releaseDate: "12-08-1978",
    rating: 5
  },
  {
    title: "The 36th Chamber of Shaolin",
    releaseDate: "02-02-1978",
    rating: 5
  }
];

// Dạng cơ bản, 1 GraphQL server sẽ có 1 hàm resolver cho mỗi 1 field trong schema của nó.
const resolvers = {
  Query: {
    movies: () => {
      return movies;
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });
// Chạy node index.js
server.listen().then(({ url }) => {
  console.log(`SERVER STARTED AT ${url}`);
});
