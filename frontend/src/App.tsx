import { useState, useEffect } from 'react'

interface HeartbeatResponse {
  status: string
  timestamp: string
  message: string
}

function App() {
  const [heartbeatStatus, setHeartbeatStatus] = useState<string>('Loading...')
  const [error, setError] = useState<string | null>(null)
  const [responseData, setResponseData] = useState<HeartbeatResponse | null>(null)

  useEffect(() => {
    const checkHeartbeat = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/heartbeat')

        if (response.ok) {
          const data: HeartbeatResponse = await response.json()
          setResponseData(data)
          setHeartbeatStatus(`Success! Server returned status ${response.status}`)
          setError(null)
        } else {
          setError(`Server returned status ${response.status}`)
          setHeartbeatStatus('Failed')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
        setHeartbeatStatus('Failed to connect to server')
      }
    }

    checkHeartbeat()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Service Booking Assistant
        </h1>

        <div className="space-y-4">
          <div className="border-t pt-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">
              Backend Connection Status
            </h2>

            <div className="bg-gray-50 rounded p-4">
              <p className={`font-medium ${error ? 'text-red-600' : 'text-green-600'}`}>
                {heartbeatStatus}
              </p>

              {error && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-700">
                    <span className="font-semibold">Error:</span> {error}
                  </p>
                </div>
              )}

              {responseData && (
                <div className="mt-3 space-y-2">
                  <div className="text-sm">
                    <span className="font-semibold text-gray-600">Status:</span>{' '}
                    <span className="text-gray-800">{responseData.status}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-gray-600">Message:</span>{' '}
                    <span className="text-gray-800">{responseData.message}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-gray-600">Timestamp:</span>{' '}
                    <span className="text-gray-800">
                      {new Date(responseData.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
