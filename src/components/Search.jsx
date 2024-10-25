import React, { useState } from 'react';
import { gql, useLazyQuery } from '@apollo/client';
import axios from 'axios';

// GraphQL query to search for a word
const SEARCH_WORD = gql`
  query Search($word: String!) {
    search(word: $word) {
      word
      wordtype
      definition
    }
  }
`;

const SearchComponent = () => {
  const [term, setTerm] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [executeSearch, { data, loading, error }] = useLazyQuery(SEARCH_WORD);

  // Text to speech
  const [isPlaying, setIsPlaying] = useState(false); // State to track if audio is playing
  const audioRef = React.useRef(null); // Reference to the audio element

  // Text generation
  const [result, setResult] = useState('');
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [errorPrompt, setErrorPrompt] = useState('');

  // Handle search submission
  const handleSearch = async () => {
    if (term.trim()) {
      executeSearch({ variables: { word: term } });
      // Call backend API to get pronunciation
      await fetchPronunciation(term);
      // Immediately fetch the text generation
      await fetchTextGeneration(term);
    }
  };

  // Function to call the backend API for pronunciation
  const fetchPronunciation = async (word) => {
    try {
      const response = await axios.post('http://localhost:4000/generate-audio', {
        input: word,
      }, {
        responseType: 'blob', // Ensure response is treated as a Blob
      });

      // Set audio URL to play the pronunciation
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log(audioUrl);
      
      setAudioUrl(audioUrl);

      // Set a sample phonetic transcription (you might update this with more accurate data)
      const phonetic = word; // You can enhance this logic to fetch actual phonetics
      setPhonetic(phonetic);
    } catch (err) {
      console.error('Error fetching pronunciation:', err);
    }
  };

  // Function to call the backend API for text generation
  const fetchTextGeneration = async (word) => {
    setLoadingPrompt(true);
    setErrorPrompt('');
    try {
      const response = await axios.post('http://localhost:4000/generate-text', { prompt: `Where does the word ${word} come from?` });
      setResult(response.data.text);
    } catch (error) {
      console.error('Error fetching text generation:', error);
      setErrorPrompt('Error generating text. Please try again.');
    } finally {
      setLoadingPrompt(false);
    }
  };

  const playAudio = async () => {
    try {
      audioRef.current.src = audioUrl; // Set audio source to the blob URL
      audioRef.current.play(); // Play the audio

      setIsPlaying(true); // Update playing state
      audioRef.current.onended = () => {
        setIsPlaying(false); // Reset playing state when audio ends
      };
    } catch (error) {
      console.error('Error fetching audio:', error);
    }
  };

  const handleTermChange = (e) => {
    setTerm(e.target.value);
    setAudioUrl('');
    setPhonetic('');
    setResult('');
    setErrorPrompt('');
  }

  return (
    <div className="search-container">
      <div className="search-box">
        <label>Term:</label>
        <input
          type="text"
          value={term}
          onChange={handleTermChange}
          placeholder="Enter a word..."
        />
        <button onClick={handleSearch}>Lookup</button>
      </div>

      {/* Display loading message */}
      {loading && <p className="loading">Loading...</p>}

      {/* Display error message if the search fails */}
      {error && <p className="error">Error fetching word: {error.message}</p>}

      {/* Display search results */}
      {data && (
        <div className="results">
          <h3>Search Results:</h3>
          {data.search.length > 0 ? (
            data.search.map((definition, index) => (
              <div key={index}>
                <p>
                  <strong>{index + 1} ({definition.wordtype})::</strong> {definition.definition}
                </p>
              </div>
            ))
          ) : (
            <p>No results found for "{term}"</p>
          )}
        </div>
      )}

      {/* Pronunciation Section */}
      {audioUrl && phonetic && (
        <div className="pronunciation">
          <h4>How is the "{term}" pronounced?</h4>
          <p>U.S. English</p>
          <p>
            {phonetic} 
            <button onClick={playAudio} disabled={isPlaying}>
              <span role="img" aria-label="audio">{isPlaying ? '🔊......' : '🔊'}</span>
            </button>
            <audio ref={audioRef} style={{ display: 'none' }} /> 
          </p>
          {/* <p>{term}</p> */}
        </div>
      )}

      {/* Text Generation Section */}
      {loadingPrompt && <p className="loading">Generating text...</p>}
      {errorPrompt && <p className="error">{errorPrompt}</p>}
      {result && (
        <div className="text-generation">
          <h4>Where does the "{term}" come from?</h4>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
};

export default SearchComponent;
