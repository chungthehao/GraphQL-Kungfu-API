const { ApolloServer, gql } = require("apollo-server");

const typeDefs = gql`
  # comment here: Schema -> The thing that defines your types
  type Movie {
    title: String
    releaseDate: String
    rating: Int
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
