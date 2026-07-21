import { useState } from 'react'

import { TestDriveBooking } from './components/TestDriveBooking'
import { formatVehicleType } from './lib/formatters'
import './App.css'

function App() {
  const [vehicleType] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('type') ?? 'tesla_modelx'
  })

  return (
    <main className="app">
      <div className="booking-heading">
        <p className="eyebrow">Nevo test drive</p>
        <h1 id="booking-title">{formatVehicleType(vehicleType)}</h1>
      </div>
      <TestDriveBooking vehicleType={vehicleType} />
    </main>
  )
}

export default App
