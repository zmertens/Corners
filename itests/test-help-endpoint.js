// Quick test script for the new /api/help endpoint and batch maze creation
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
    console.log(`Help Endpoint - Status Code: ${res.statusCode}`)
    console.log(`Headers:`, res.headers)

    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })

    res.on('end', () => {
      try {
        const response = JSON.parse(data)
        console.log('\nHelp Response:')
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

const testSingleMazeCreation = () => {
  console.log('\n\n=== Testing Single Maze Creation ===')
  
  const payload = JSON.stringify({
    algo: 'dfs',
    rows: 10,
    columns: 10,
    seed: 42,
    distances: '[0:-1]'
  })

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/mazes/create',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length,
    },
  }

  const req = http.request(options, (res) => {
    console.log(`Single Maze - Status Code: ${res.statusCode}`)

    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })

    res.on('end', () => {
      try {
        const response = JSON.parse(data)
        console.log('\nSingle Maze Response:')
        console.log(JSON.stringify(response, null, 2))

        // Verify the expected structure for single maze
        if (response.data && response.createdAt && response.version_str && response.config) {
          console.log('\n✅ Success! Single maze endpoint returned expected structure')
        } else {
          console.log('\n❌ Error: Unexpected response structure for single maze')
        }
      } catch (error) {
        console.log('\n❌ Error parsing JSON:', error.message)
        console.log('Raw response:', data)
      }
    })
  })

  req.on('error', (error) => {
    console.error('❌ Request failed:', error.message)
  })

  req.write(payload)
  req.end()
}

const testBatchMazeCreation = () => {
  console.log('\n\n=== Testing Batch Maze Creation ===')
  
  const payload = JSON.stringify([
    {
      algo: 'binary_tree',
      rows: 5,
      columns: 5,
      seed: 1
    },
    {
      algo: 'dfs',
      rows: 10,
      columns: 10,
      seed: 42,
      distances: '[0:-1]'
    },
    {
      algo: 'binary_tree',
      rows: 15,
      columns: 20,
      seed: 123
    },
    {
      algo: 'sidewinder',
      rows: 5,
      columns: 5,
      seed: 42
    }
  ])

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/mazes/create',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length,
    },
  }

  const req = http.request(options, (res) => {
    console.log(`Batch Maze - Status Code: ${res.statusCode}`)

    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })

    res.on('end', () => {
      try {
        const response = JSON.parse(data)
        console.log('\nBatch Maze Response:')
        console.log(JSON.stringify(response, null, 2))

        // Verify the expected structure for array of mazes
        if (Array.isArray(response) && response.length === 4) {
          const successfulMazes = response.filter(maze => maze.data && !maze.error)
          const failedMazes = response.filter(maze => maze.error)
          
          console.log(`\n📊 Batch Results: ${successfulMazes.length} successful, ${failedMazes.length} failed`)
          
          if (failedMazes.length > 0) {
            console.log('\n⚠️  Failed mazes:')
            failedMazes.forEach((maze, index) => {
              console.log(`  ${index + 1}. Error: ${maze.error}`)
              console.log(`     Config: ${JSON.stringify(maze.config)}`)
            })
          }
          
          // Check if all responses have required structure (including error cases)
          const allValidStructure = response.every(maze => 
            maze.createdAt && maze.config && (maze.data || maze.error)
          )
          
          if (allValidStructure) {
            if (successfulMazes.length === 4) {
              console.log('\n✅ Success! All mazes generated successfully')
            } else if (successfulMazes.length > 0) {
              console.log('\n⚠️  Partial Success! Some mazes failed but API handled errors correctly')
            } else {
              console.log('\n❌ All mazes failed to generate')
            }
          } else {
            console.log('\n❌ Error: Some responses missing required structure fields')
          }
        } else {
          console.log('\n❌ Error: Unexpected response structure for batch mazes')
        }
      } catch (error) {
        console.log('\n❌ Error parsing JSON:', error.message)
        console.log('Raw response:', data)
      }
    })
  })

  req.on('error', (error) => {
    console.error('❌ Request failed:', error.message)
  })

  req.write(payload)
  req.end()
}

console.log('Testing endpoints...')
console.log('=== Testing Help Endpoint ===')
testHelpEndpoint()

// Run tests sequentially with delays
setTimeout(testSingleMazeCreation, 1000)
setTimeout(testBatchMazeCreation, 2000)
