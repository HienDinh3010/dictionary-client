import React, { useState, useEffect } from 'react';
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
const backendHost = process.env.REACT_APP_BACKEND_HOST;
const SearchComponent = () => {
  const [term, setTerm] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [phonetic, setPhonetic] = useState('');
  const [executeSearch, { data, loading, error }] = useLazyQuery(SEARCH_WORD);
  const [queryData, setQueryData] = useState(null); // local state for resetting data

  useEffect(() => {
    if (data) {
      setQueryData(data);  // update local state with the new query result
    }
  }, [data]);

  //Image generation
  const [loadingImage, setLoadingImage] = useState(false);
  const [errorImage, setErrorImage] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Text to speech
  const [isPlaying, setIsPlaying] = useState(false); // State to track if audio is playing
  const audioRef = React.useRef(null); // Reference to the audio element

  // Text generation
  const [termHistory, setTermHistory] = useState('');
  const [loadingTermHistory, setLoadingTermHistory] = useState(false);
  const [errorTermHistory, setErrorTermHistory] = useState('');

  // Example generation
  const [example, setExample] = useState('');
  const [loadingExample, setLoadingExample] = useState(false);
  const [errorExample, setErrorExample] = useState('');

  // Handle search submission
  const handleSearch = async () => {

    if (term.trim()) {
      executeSearch({ variables: { word: term.trim().toLowerCase() } });

      await searchTerm(term.trim().toLowerCase());
    }
  };

  const searchTerm = async (term) => {
    try {
      //Send a POST request to find the term from search history
      const response = await axios.post(`${backendHost}/search`, {
        term: term,
      });
      const result = response.data;
      console.log(`result ${result.message}`);
      if (result.found) {
        console.log("found term history from db")
        setImageUrl(result.imageUrl ? result.imageUrl : process.env.DEFAULT_IMG);

        const arrayBuffer =  result.audioBuffer;
        const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);

        setTermHistory(result.termHistory);

        setExample(result.example);
      } else {
        console.log("fetching openai");
        try {
          // Wait for all fetch functions to complete and store the results
          const [imageResult, pronunciationResult, textGenerationResult, textExampleResult] = await Promise.all([
              fetchImage(term),
              fetchPronunciation(term),
              fetchTextGeneration(term),
              fetchTextExample(term),
          ]);
      
          // Assuming these functions return the values you need
          const audioBuffer = pronunciationResult;
          const imageUrl = imageResult;
          const termHistory = textGenerationResult;
          const example = textExampleResult;
      
          // Now make the POST request with populated data
          await axios.post(`${backendHost}/new-search`, {
              term: term,
              audioBuffer: audioBuffer,
              imageUrl: imageUrl,
              termHistory: termHistory,
              example: example
          });
        } catch (error) {
            console.log(`Error adding new search: ${error}`);
        }      
      }
    } catch (err) {
      console.log(`error search term`, err);
    }
  }

  // Function to call the backend API for image generation
  const fetchImage = async (prompt) => {
    setLoadingImage(true);
    setErrorImage('');
    try {
      // Send a POST request to generate an image based on the prompt
      const response = await axios.post(`${backendHost}/generate-image`, {
        input: `Cute image about ${prompt}`,
      });

      // Retrieve the image URL from the response
      const imageUrl = response.data.imageUrl;
      console.log(imageUrl);

      // Set the image URL to display the generated image
      setImageUrl(imageUrl ? imageUrl : process.env.DEFAULT_IMG);
      return imageUrl;
    } catch (err) {
      console.error('Error fetching image:', err);
      setErrorImage(err);
    } finally {
      setLoadingImage(false);
    }
  };

  // Function to call the backend API for pronunciation
  const fetchPronunciation = async (word) => {
    try {
      const response = await axios.post(`${backendHost}/generate-audio`, {
        input: word,
      }, {
        responseType: 'blob', // Ensure response is treated as a Blob
      });

      // Set audio URL to play the pronunciation
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log(audioUrl);
      
      setAudioUrl(audioUrl);

      // Convert Blob to ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      setAudioBuffer(new Uint8Array(arrayBuffer));

      // Set a sample phonetic transcription (you might update this with more accurate data)
      const phonetic = word; // You can enhance this logic to fetch actual phonetics
      setPhonetic(phonetic);
      return arrayBuffer;
    } catch (err) {
      console.error('Error fetching pronunciation:', err);
    }
  };

  // Function to call the backend API for text generation
  const fetchTextGeneration = async (word) => {
    setLoadingTermHistory(true);
    setErrorTermHistory('');
    try {
      const response = await axios.post(`${backendHost}/generate-text`, { prompt: `Where does the word ${word} come from?` });
      setTermHistory(response.data.text);
      return response.data.text;
    } catch (error) {
      console.error('Error fetching text generation:', error);
      setErrorTermHistory('Error generating text. Please try again.');
    } finally {
      setLoadingTermHistory(false);
    }
  };

  const fetchTextExample = async (word) => {
    setLoadingExample(true);
    setErrorExample('');
    try {
      const response = await axios.post(`${backendHost}/generate-text`, { prompt: `Funny story about ${word}?` });
      setExample(response.data.text);
      console.log(response.data.text);
      return response.data.text;
    } catch (error) {
      console.error('Error fetching example generation:', error);
      setErrorExample('Error generating example. Please try again.');
    } finally {
      setLoadingExample(false);
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
    setQueryData(null);
    setAudioUrl('');
    setPhonetic('');
    setTermHistory('');
    setErrorTermHistory('');
    setImageUrl('');
    setExample('');
    setErrorExample('');
    setTerm(e.target.value);
  }

  return (
    <div className="search-container">
      <div className="search-box">
        <div className='input-group'>
          <label>Term:</label>
          <input
            type="text"
            value={term}
            onChange={handleTermChange}
            placeholder="Enter a word..."
            className="form-control"
          />
          <button className="btn btn-primary" onClick={handleSearch}>
            Lookup
          </button>
        </div>
      </div>

      {/* Display loading message */}
      {loading && <p className="loading">Loading...</p>}

      {/* Display error message if the search fails */}
      {error && <p className="error">Error fetching word: {error.message}</p>}

      {queryData && (
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
      {loadingTermHistory && <p className="loading">Generating text...</p>}
      {errorTermHistory && <p className="error">{errorTermHistory}</p>}
      {termHistory && (
        <div className="text-generation">
          <h4>Where does the "{term}" come from?</h4>
          <p>{termHistory}</p>
        </div>
      )}

      {/* Example Generation Section */}
      {loadingExample && <p className="loading">Generating text...</p>}
      {errorExample && <p className="error">{errorExample}</p>}
      {example && (
        <div className="text-generation">
          <h4>Funny story about the "{term}" :)</h4>
          <p>{example}</p>
        </div>
      )}

      {/* Display search results */}
      {loadingImage && <p className="loading">Generating image...</p>}
      {errorImage && <p className="error">{errorImage}</p>}
      {imageUrl && 
      <div className="generated-image-container">
        <img src={imageUrl} alt="Generated" className="generated-image" />
      </div>}
    </div>
  );
};

export default SearchComponent;
