import React from 'react'
import './DroneInfoCard.css'
const DroneInfoCard = ({ drone }) => {
  const { firstName, lastName, phoneNumber, email, distance, violationAt,serialNr } = drone
  return (
    <div className='droneCard'>
      <h1> {`${firstName} ${lastName}`}</h1>
      <p> Email: {email}</p>
      <p> Phone number: {phoneNumber}</p>
      <p> Drone serial number : {serialNr}</p>
      <p> Closest distance: {distance.toFixed(1)} m</p>
      <p> Last seen: {new Date(violationAt).toLocaleString()}</p>
    </div>
  )
}

export default DroneInfoCard