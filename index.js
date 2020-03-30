const { ApolloServer, gql, PubSub } = require("apollo-server");
const { GraphQLScalarType } = require("graphql");
const { Kind } = require("graphql/language");
const mongoose = require("mongoose");

// Thay chuỗi dưới bằng cái tạo được ở mongoDB Atlas
mongoose.connect("mongodb://localhost:27017/test", {
  useNewUrlParser: true
});
const db = mongoose.connection;

const movieSchema = new mongoose.Schema({
  title: String,
  releaseDate: Date,
  rating: Number,
  status: String,
  actorIds: [String]
});

const Movie = mongoose.model("Movie", movieSchema);

// gql`` parses your string into AST (Abstract Syntax Tree)
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
    actor: [Actor] # Valid: null, [], [...some data]; Not valid: [ some data without name or id ]
    # actor: [Actor]! # Valid: [], [...some data]; Not valid: [ some data without name or id ]
    # actor: [Actor!]! # Valid: [...some data]; Not valid: [ some data without name or id ]
  }

  # Define a query
  type Query {
    movies: [Movie]
    movie(id: ID): Movie
  }

  # Define a input type, để trong mutation của typeDefs và params của nó tương ứng ở resolver
  input MovieInput {
    id: ID
    title: String
    releaseDate: Date
    rating: Int
    status: Status
    actor: [ActorInput]
  }

  input ActorInput {
    id: ID
  }

  # Define a mutation
  type Mutation {
    addMovie(newMovie: MovieInput): [Movie]
  }

  # Define a subscription
  type Subscription {
    movieAdded: Movie
  }
`;

const actors = [
  {
    id: "gordon",
    name: "Gordon Liu"
  },
  {
    id: "jakie",
    name: "Jakie Chan"
  },
  {
    id: "abc",
    name: "A B C"
  }
];

const movies = [
  {
    id: "dfkjfjvh4858rj34ju1",
    title: "5 Deadly Venoms",
    releaseDate: new Date("12-08-1978"),
    rating: 5,
    actor: [
      {
        id: "jakie"
      }
    ]
  },
  {
    id: "3rdfj23ej3jc34",
    title: "The 36th Chamber of Shaolin",
    releaseDate: new Date("02-02-1978"),
    rating: 5
  }
];

const pubsub = new PubSub();
const MOVIE_ADDED = "MOVIE_ADDED";

// Dạng cơ bản, 1 GraphQL server sẽ có 1 hàm resolver cho mỗi 1 field trong schema của nó.
const resolvers = {
  Subscription: {
    movieAdded: {
      subscribe: () => pubsub.asyncIterator([MOVIE_ADDED])
    }
  },

  Query: {
    movies: async () => {
      try {
        const allMovies = await Movie.find();
        return allMovies;
      } catch (error) {
        console.log(error);
        return [];
      }
    },

    // obj: liên quan tới cấp cao hơn; context: thông tin user, auth,...; info: ít dùng, tìm hiểu sau
    movie: async (obj, args, context, info) => {
      try {
        const { id } = args;
        const foundMovie = await Movie.findById(id);

        return foundMovie;
      } catch (error) {
        console.log(error);
        return {};
      }
    }
  },
  Movie: {
    actor: (movie, args, context) => {
      console.log("movie", movie);

      if (!("actor" in movie)) return [];

      // Lẽ ra là các DB call
      const actorIds = movie.actor.map(a => a.id);
      const filteredActors = actors.filter(a => actorIds.includes(a.id));

      return filteredActors;
    }
  },
  Mutation: {
    addMovie: async (obj, args, context) => {
      // console.log(context);
      const { newMovie } = args;

      if (context.userId) {
        try {
          // Do mutation & All of our database stuff
          const justAddedMovie = await Movie.create(newMovie);
          pubsub.publish(MOVIE_ADDED, { movieAdded: justAddedMovie });
          const allMovies = await Movie.find();

          // Return data as expected in schema
          return allMovies;
        } catch (error) {
          console.log(error);
          return [];
        }
      }

      return [];
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
  playground: true,
  context: ({ req }) => {
    console.log("HI HENRY!");
    const fakeUser = { userId: "hi_I_am_a_user" };
    return { ...fakeUser };
  }
});

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
  console.log("we're connected!");

  // Chạy node index.js
  server
    .listen({
      port: process.env.PORT || 4000
    })
    .then(({ url }) => {
      console.log(`SERVER STARTED AT ${url}`);
    });
});
