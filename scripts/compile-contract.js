import { readFileSync, writeFileSync } from 'fs'
import solc from 'solc'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const contractPath = join(__dirname, '../src/contracts/ERC20.sol')
const outputPathLib = join(__dirname, '../src/lib/compiled-contract.json')
const outputPathPublic = join(__dirname, '../public/compiled-contract.json')

const contractSource = readFileSync(contractPath, 'utf-8')

const input = {
  language: 'Solidity',
  sources: {
    'ERC20.sol': {
      content: contractSource,
    },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object'],
      },
    },
  },
}

const output = JSON.parse(solc.compile(JSON.stringify(input)))

if (output.errors) {
  const errors = output.errors.filter((e) => e.severity === 'error')
  if (errors.length > 0) {
    console.error('Compilation errors:', errors)
    process.exit(1)
  }
}

const contract = output.contracts['ERC20.sol']['ERC20']
const compiled = {
  abi: contract.abi,
  bytecode: `0x${contract.evm.bytecode.object}`,
}

writeFileSync(outputPathLib, JSON.stringify(compiled, null, 2))
writeFileSync(outputPathPublic, JSON.stringify(compiled, null, 2))
console.log('Contract compiled successfully!')

