import { readFileSync, writeFileSync } from 'fs'
import solc from 'solc'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const erc20Path = join(__dirname, '../src/contracts/ERC20.sol')
const erc20FaucetPath = join(__dirname, '../src/contracts/ERC20Faucet.sol')
const outputPathLib = join(__dirname, '../src/lib/compiled-contract.json')
const outputPathPublic = join(__dirname, '../public/compiled-contract.json')
const faucetOutputPathLib = join(__dirname, '../src/lib/compiled-faucet-contract.json')
const faucetOutputPathPublic = join(__dirname, '../public/compiled-faucet-contract.json')

const erc20Source = readFileSync(erc20Path, 'utf-8')
const erc20FaucetSource = readFileSync(erc20FaucetPath, 'utf-8')

// Compile ERC20 contract
const erc20Input = {
  language: 'Solidity',
  sources: {
    'ERC20.sol': {
      content: erc20Source,
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

const erc20Output = JSON.parse(solc.compile(JSON.stringify(erc20Input)))

if (erc20Output.errors) {
  const errors = erc20Output.errors.filter((e) => e.severity === 'error')
  if (errors.length > 0) {
    console.error('ERC20 compilation errors:', errors)
    process.exit(1)
  }
}

const erc20Contract = erc20Output.contracts['ERC20.sol']['ERC20']
const erc20Compiled = {
  abi: erc20Contract.abi,
  bytecode: `0x${erc20Contract.evm.bytecode.object}`,
}

writeFileSync(outputPathLib, JSON.stringify(erc20Compiled, null, 2))
writeFileSync(outputPathPublic, JSON.stringify(erc20Compiled, null, 2))
console.log('ERC20 contract compiled successfully!')

// Compile ERC20Faucet contract
const faucetInput = {
  language: 'Solidity',
  sources: {
    'ERC20Faucet.sol': {
      content: erc20FaucetSource,
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

const faucetOutput = JSON.parse(solc.compile(JSON.stringify(faucetInput)))

if (faucetOutput.errors) {
  const errors = faucetOutput.errors.filter((e) => e.severity === 'error')
  if (errors.length > 0) {
    console.error('ERC20Faucet compilation errors:', errors)
    process.exit(1)
  }
}

const faucetContract = faucetOutput.contracts['ERC20Faucet.sol']['ERC20Faucet']
const faucetCompiled = {
  abi: faucetContract.abi,
  bytecode: `0x${faucetContract.evm.bytecode.object}`,
}

writeFileSync(faucetOutputPathLib, JSON.stringify(faucetCompiled, null, 2))
writeFileSync(faucetOutputPathPublic, JSON.stringify(faucetCompiled, null, 2))
console.log('ERC20Faucet contract compiled successfully!')

