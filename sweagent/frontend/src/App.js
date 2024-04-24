import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';

const url = ''; // Will get this from .env 
// Connect to Socket.io
const socket = io(url);

function App() {
  const [dataPath, setDataPath] = useState('https://github.com/klieret/swe-agent-test-repo/issues/1');
  const [testRun, setTestRun] = useState(true);
  const [responseMessage, setResponseMessage] = useState('');
  const [agentFeed, setAgentFeed] = useState([]);
  const [envFeed, setEnvFeed] = useState([]);
  const [highlightedStep, setHighlightedStep] = useState(null);


  axios.defaults.baseURL = url;

  const handleMouseEnter = (step) => {
    setHighlightedStep(step);
  };


  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.get(`/run`, { params: { data_path: dataPath, test_run: testRun } });
      setResponseMessage(response.data);
      setAgentFeed([]); // Clear the agent feed messages
      setEnvFeed([]); // Clear the environment feed messages
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Use effect to listen to socket updates
  React.useEffect(() => {
    const handleUpdate = (data) => {
      const updateFeed = data.feed === 'agent' ? setAgentFeed : setEnvFeed;
      updateFeed(prevMessages => [...prevMessages, { title: data.title, message: data.message, format: data.format, step: data.thought_idx }]);
    };

    socket.on('update', handleUpdate);

    return () => {
        socket.off('update', handleUpdate);
    };
  }, []);

  return (
    <div>
      <h1>Start run</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="data_path">Data Path:</label>
        <input type="text" value={dataPath} onChange={(e) => setDataPath(e.target.value)} required />
        <label htmlFor="test_run">Test run (no LM queries)</label>
        <input type="checkbox" checked={testRun} onChange={(e) => setTestRun(e.target.checked)} />
        <button type="submit">Run</button>
      </form>
      <div>{responseMessage}</div>
      <h2>Trajectory</h2>
      <div id="container">
        <Feed feed={agentFeed} highlightedStep={highlightedStep} handleMouseEnter={handleMouseEnter}  title="Agent Feed" />
        <Feed feed={envFeed} highlightedStep={highlightedStep} handleMouseEnter={handleMouseEnter}  title="Environment Feed" />
      </div>
    </div>
  );
}

const Feed = ({ feed, title, highlightedStep, handleMouseEnter }) => {
  const feedRef = useRef(null); // Create a ref for the feed container
  
  // Scroll to the bottom of the feed whenever the feed data changes
  useEffect(() => {
      if (feedRef.current) {
          feedRef.current.scrollTop = feedRef.current.scrollHeight;
      }
  }, [feed]); // Dependency array includes 'feed' to trigger the effect when it changes


  return (
    <div id={`${title.toLowerCase().replace(' ', '')}`} ref={feedRef} >
      <h3>{title}</h3>
      {feed.map((item, index) => (
        <div key={index} 
          className={`message ${item.format} step${item.step} ${highlightedStep === item.step ? 'highlight' : ''}`}
          onMouseEnter={() => handleMouseEnter(item.step)}
        >
          <h4>{item.title}</h4>
          {item.message}
        </div>
      ))}
    </div>
  )
};

export default App;

