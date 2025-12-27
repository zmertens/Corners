// Test script to verify WASM module optimization
import {
  initializeWasm,
  getWasmModule,
  isWasmReady,
} from '../src/services/wasmLoader'

const testWasmOptimization = async () => {
  console.log('🧪 Testing WASM Module Optimization')
  console.log('=====================================')

  // Test 1: Initialize WASM once
  console.log('1. Initializing WASM module...')
  await initializeWasm()

  if (isWasmReady()) {
    console.log('✅ WASM module initialized successfully')
  } else {
    console.log('❌ WASM module failed to initialize')
    return
  }

  // Test 2: Multiple calls to getWasmModule should be fast
  console.log('\n2. Testing multiple getWasmModule calls...')

  const start1 = Date.now()
  const module1 = getWasmModule()
  const end1 = Date.now()
  console.log(`   First call: ${end1 - start1}ms`)

  const start2 = Date.now()
  const module2 = getWasmModule()
  const end2 = Date.now()
  console.log(`   Second call: ${end2 - start2}ms`)

  const start3 = Date.now()
  const module3 = getWasmModule()
  const end3 = Date.now()
  console.log(`   Third call: ${end3 - start3}ms`)

  // Test 3: Verify all calls return the same instance
  console.log('\n3. Verifying singleton behavior...')
  console.log(`   module1 === module2: ${module1 === module2}`)
  console.log(`   module2 === module3: ${module2 === module3}`)

  // Test 4: Test maze generation performance
  if (module1) {
    console.log('\n4. Testing maze generation performance...')

    const generateMaze = (rows: number, cols: number) => {
      const startTime = Date.now()
      try {
        const params = new module1.StringVector()
        params.push_back('-r')
        params.push_back(rows.toString())
        params.push_back('-c')
        params.push_back(cols.toString())
        params.push_back('-a')
        params.push_back('binary_tree')

        const cliInstance = module1.get()
        if (cliInstance && cliInstance.convert) {
          const maze = cliInstance.convert(params)
          params.delete()
          const endTime = Date.now()
          return endTime - startTime
        }
      } catch (error) {
        console.error('   Error generating maze:', error)
      }
      return -1
    }

    // Generate a few mazes to test performance
    for (let i = 1; i <= 3; i++) {
      const time = generateMaze(10, 10)
      if (time >= 0) {
        console.log(`   Maze ${i} generated in: ${time}ms`)
      }
    }
  }

  console.log('\n✅ WASM optimization test completed!')
  console.log('The module is loaded once and reused for all subsequent calls.')
}

// Run the test
testWasmOptimization().catch(console.error)
