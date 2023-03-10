const xml2js = require('xml-js')
const fetch = require("node-fetch");
const express = require('express');
const cors = require('cors');


const port = process.env.PORT || 5000
const app = express()


app.use(express.json());

app.use(cors({
  origin: "*",
}))







// the key-value is (serialNr : {... pilot:{... pilotInfo}, timeStamp, distance})
var droneMap = new Map()

//Distance fromt the center
const distance = (drone) => {
  const xDiff = Number(drone.positionX._text) / 1000 - 250
  const yDiff = Number(drone.positionY._text) / 1000 - 250
  return Math.sqrt(xDiff * xDiff + yDiff * yDiff)
}


//This function update the drones that are already in the droneMap and return the ones that are not to make the pilot api calls for these drones.  
const getViolatingDrones = (data) => {


  const timeStamp = new Date(data.report.capture._attributes.snapshotTimestamp)

  //Drones from the data API call not seen in the last 10 minutes. 
  const notAppearedDrones = []

  data.report.capture.drone.forEach(drone => {
    const droneDistance = distance(drone)
    const serialNr = drone.serialNumber._text

    if (droneDistance > 100) {
      //Ignore the drone not in NDZ
      return
    }

    if (droneMap.has(serialNr)) {
      let updatedDrone = droneMap.get(serialNr)
      //Update the closest distance.
      updatedDrone.distance = Math.min(droneDistance, updatedDrone.distance)
      droneMap.set(serialNr, { ...updatedDrone, serialNr, capturedAt: timeStamp })

    } else {
      notAppearedDrones.push({ serialNr, capturedAt: timeStamp, distance: droneDistance })

    }
  })

  return notAppearedDrones
}

//Clear drones not seen for more than 10 minutes
const cleanUp = () => {
  droneMap.forEach((drone, serialNr) => {
    if (new Date() - drone.capturedAt > 600000)
      droneMap.delete(serialNr)
  })
}

const handleUpdate = async () => {

  const notAppearedDrones = await fetch(
    "https://assignments.reaktor.com/birdnest/drones"
  ).then((res) => res.text())
    .then(data => xml2js.xml2js(data, { compact: true }))
    .then(data => getViolatingDrones(data))
    .catch(err => console.error('Error:', err))


  await Promise.all(
    notAppearedDrones.map((drone) => {

      fetch(`https://assignments.reaktor.com/birdnest/pilots/${drone.serialNr}`)
        .then(async (response) => {
          const data = await response.json()
          if (!response.ok) {
            throw new Error(`Pilot with the drone ${drone.serialNr} not found`)
          }
          return data
        })
        .then((pilot) => {
          droneMap.set(drone.serialNr, { ...drone, pilot: pilot })
        })
        .catch(err => console.error('Error:', err));
    })
  )

  cleanUp();

}

setInterval(handleUpdate, 2000)

app.get('/api/violatingDrones', (req, res) => {
  const drones = [...droneMap.values()].map(drone => ({ ...drone.pilot, violationAt: drone.capturedAt, distance: drone.distance, serialNr: drone.serialNr }))
  res.json({ data: drones })
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})