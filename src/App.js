import Header from "./components/Header";
import { ApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client';
import Search from "./components/Search";
import PopularSearch from "./components/PopularSearch";

const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
  cache: new InMemoryCache(),
})

function App() {
  return (
    <>
      <ApolloProvider client={client}>
        <Header />
        <Search/>
        <PopularSearch />
      </ApolloProvider>
    </>
  );
}

export default App;
