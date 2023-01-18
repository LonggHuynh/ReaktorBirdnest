import { useState, useEffect } from 'react';
import './App.css';
import url from './config'
import DroneInfoCard from './components/DroneInfoCard'

function App() {

  const [drones, setDrones] = useState([])
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(url('/violatingDrones'))
        .then(response => response.json())
        .then(data => setDrones(data.data))
    }, 2000)
    return () => clearInterval(interval);
  }, [])

  return (
    <div className="App">
      <h1 className='title'>Birdnest - Found {drones.length} drone violations </h1>
      <div className='droneContainer'>
        {drones.map(drone => <DroneInfoCard key={drone.serialNr} drone={drone} />)}
      </div>
    </div>
  )
}

export default App;
