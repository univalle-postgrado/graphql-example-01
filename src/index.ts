import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { GraphQLError } from 'graphql';
import { v4 as uuid } from 'uuid';

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  enum Genre {
    NONE
    FICTION
    MYSTERY
    FANTASY
    ROMANCE
  }

  type Author {
    name: String!
    nationality: String
  }

  # This "Book" type defines the queryable fields for every book in our data source.
  type Book {
    id: String!
    title: String!
    description: String
    isbn: String
    publisher: String!
    genre: Genre!
    publishYear: Int
    author: Author!
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    getBooks: [Book]
    getBooksCount: Int!
    getBook(id: String): Book
  }
  
  type Mutation {
    addBook (
      title: String!
      description: String
      isbn: String
      publisher: String!
      genre: Genre!
      publishYear: Int
      authorName: String!
      authorNationality: String
    ): Book

    updateBook (
      id: String!
      title: String
      description: String
      isbn: String
      publisher: String
      genre: Genre
      publishYear: Int
      authorName: String
      authorNationality: String
    ): Book

    deleteBook (id: String!): Book
  }
`;

const books = [
  {
    id: 'd26fd654-f4d4-4b98-91e5-6d8c9569aed6',
    title: 'The Awakening',
    description: 'The Awakening es una novela de la escritora estadounidense Kate Chopin.',
    publisher: 'W W Norton & Co Inc',
    genre: 'NONE',
    publishYear: 1899,
    authorName: 'Kate Chopin'
  },
  {
    id: '35b19ead-3aa9-415e-a46d-6621e1604119',
    title: 'City of Glass',
    description: 'Ciudad de cristal es el tercer libro de la saga Cazadores de Sombras, escrita por Cassandra Clare. Fue publicada originalmente en Estados Unidos.',
    isbn: '978-0140097313',
    publisher: 'Simon & Schuster',
    genre: 'FANTASY',
    publishYear: 2009,
    authorName: 'Paul Auster',
    authorNationality: 'Estadounidense'
  },
];

// Resolvers define how to fetch the types defined in your schema.
// This resolver retrieves books from the "books" array above.
const resolvers = {
  Query: {
    getBooks: () => books,
    getBooksCount: () => books.length,
    getBook: (root, args) => {
      const { id } = args;
      return books.find(book => book.id === id);
    }
  },

  Book: {
    author: (root) => {
      return {
        name: root.authorName,
        nationality: root.authorNationality
      }
    }
  },

  Mutation: {
    addBook: (root, args) => {
      if (books.find(book => book.title === args.title)) {
        throw new GraphQLError('Título es una valor único', {
          extensions: {
            code: 'BAD_USER_INPUT'
          }
        });
      }

      const newBook = { ...args, id: uuid() }
      books.push(newBook);
      return newBook;
    },
    
    updateBook: (root, args) => {
      const updatedBookIndex = books.findIndex(book => book.id === args.id);

      if (updatedBookIndex === -1) return null;

      const book = books[updatedBookIndex];
      const updatedBook = {...book,
        title: args.title ? args.title : book.title,
        description: args.description ? args.description : book.description,
        isbn: args.isbn ? args.isbn : book.isbn,
        publisher: args.publisher ? args.publisher : book.publisher,
        genre: args.genre ? args.genre : book.genre,
        publishYear: args.publishYear ? args.publishYear : book.publishYear,
        authorName: args.authorName ? args.authorName : book.authorName,
        authorNationality: args.authorNationality ? args.authorNationality : book.authorNationality
      };
      books[updatedBookIndex] = updatedBook;
      return updatedBook;
    },

    deleteBook: (root, { id }) => {
      const deletedBookIndex = books.findIndex(book => book.id === id);

      if (deletedBookIndex === -1) return null;

      const deletedBook = books.splice(deletedBookIndex, 1)[0];
      return deletedBook;
    }
  }
};

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);