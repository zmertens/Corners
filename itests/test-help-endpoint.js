// Quick test script for the new /api/help endpoint
const http = require('http')

const testHelpEndpoint = () => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/help',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }

  const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`)
    console.log(`Headers:`, res.headers)

    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })

    res.on('end', () => {
      try {
        const response = JSON.parse(data)
        console.log('\nResponse:')
        console.log(JSON.stringify(response, null, 2))

        // Verify the expected structure
        if (response.maze_builder_help && response.corners_info) {
          console.log('\n✅ Success! Help endpoint returned expected structure')
        } else {
          console.log('\n❌ Error: Unexpected response structure')
        }
      } catch (error) {
        console.log('\n❌ Error parsing JSON:', error.message)
        console.log('Raw response:', data)
      }
    })
  })

  req.on('error', (error) => {
    console.error('❌ Request failed:', error.message)
    console.log('Make sure the server is running with: npm run dev')
  })

  req.end()
}

console.log('Testing /api/help endpoint...')
testHelpEndpoint()
