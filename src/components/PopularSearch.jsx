import React, { useState, useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';

// GraphQL query to fetch popular searches
const GET_POPULAR_SEARCHES = gql`
  query GetPopularSearches {
    getPopularSearches
  }
`;

const PopularSearchesComponent = () => {
  const [secondsLeft, setSecondsLeft] = useState(25);
  const { loading, error, data, refetch } = useQuery(GET_POPULAR_SEARCHES, {
    fetchPolicy: 'cache-and-network', // Allows real-time updates
  });

  useEffect(() => {
    // Countdown timer: Decrease by 1 second each time
    const countdown = setInterval(() => {
      setSecondsLeft((prevSeconds) => (prevSeconds > 0 ? prevSeconds - 1 : 0));
    }, 1000);

    // Reset countdown and refetch the data every 25 seconds
    const refreshInterval = setInterval(() => {
      refetch(); // Re-fetch popular searches
      setSecondsLeft(25); // Reset the countdown
    }, 25000);

    // Cleanup intervals on component unmount
    return () => {
      clearInterval(countdown);
      clearInterval(refreshInterval);
    };
  }, [refetch]);

  return (
    <div className="popular-searches">
      <h3>Popular Searches</h3>
      {/* Display loading and error messages here */}
      {loading && <p className="loading">Loading popular searches...</p>}
      {error && <p className="error">Error fetching popular searches: {error.message}</p>}
      
      <p>Next refresh in: <span> {secondsLeft} </span> seconds</p>
      <div className="columns">
        {/* Left Column: Indexes 0 to 4 */}
        <ol>
          {data?.getPopularSearches?.slice(0, 5).map((word, index) => (
            <li key={index}>{word}</li>
          ))}
        </ol>

        {/* Right Column: Indexes 5 to 9 */}
        <ol start={6}>
          {data?.getPopularSearches?.slice(5).map((word, index) => (
            <li key={index + 5}>{word}</li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default PopularSearchesComponent;
