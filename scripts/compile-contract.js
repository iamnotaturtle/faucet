import { readFileSync, writeFileSync } from 'fs'
import solc from 'solc'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const erc20Path = join(__dirname, '../src/contracts/ERC20.sol')
const erc20FaucetPath = join(__dirname, '../src/contracts/ERC20Faucet.sol')
const erc721Path = join(__dirname, '../src/contracts/ERC721.sol')
const outputPathLib = join(__dirname, '../src/lib/compiled-contract.json')
const outputPathPublic = join(__dirname, '../public/compiled-contract.json')
const faucetOutputPathLib = join(__dirname, '../src/lib/compiled-faucet-contract.json')
const faucetOutputPathPublic = join(__dirname, '../public/compiled-faucet-contract.json')
const erc721OutputPathLib = join(__dirname, '../src/lib/compiled-erc721-contract.json')
const erc721OutputPathPublic = join(__dirname, '../public/compiled-erc721-contract.json')

const erc20Source = readFileSync(erc20Path, 'utf-8')
const erc20FaucetSource = readFileSync(erc20FaucetPath, 'utf-8')
const erc721Source = readFileSync(erc721Path, 'utf-8')

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

// Compile ERC721 contract
const erc721Input = {
  language: 'Solidity',
  sources: {
    'ERC721.sol': {
      content: erc721Source,
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

const erc721Output = JSON.parse(solc.compile(JSON.stringify(erc721Input)))

if (erc721Output.errors) {
  const errors = erc721Output.errors.filter((e) => e.severity === 'error')
  if (errors.length > 0) {
    console.error('ERC721 compilation errors:', errors)
    process.exit(1)
  }
}

const erc721Contract = erc721Output.contracts['ERC721.sol']['ERC721']
const erc721Compiled = {
  abi: erc721Contract.abi,
  bytecode: `0x${erc721Contract.evm.bytecode.object}`,
}

writeFileSync(erc721OutputPathLib, JSON.stringify(erc721Compiled, null, 2))
writeFileSync(erc721OutputPathPublic, JSON.stringify(erc721Compiled, null, 2))
console.log('ERC721 contract compiled successfully!')

function compileVault(filename, contractName, libPath, publicPath) {
  const source = readFileSync(join(__dirname, `../src/contracts/${filename}`), 'utf-8')
  const input = {
    language: 'Solidity',
    sources: {
      [filename]: {
        content: source,
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
      console.error(`${contractName} compilation errors:`, errors)
      process.exit(1)
    }
  }

  const contract = output.contracts[filename][contractName]
  const compiled = {
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`,
  }

  writeFileSync(libPath, JSON.stringify(compiled, null, 2))
  writeFileSync(publicPath, JSON.stringify(compiled, null, 2))
  console.log(`${contractName} compiled successfully!`)
}

compileVault(
  'ERC4626Vault.sol',
  'ERC4626Vault',
  join(__dirname, '../src/lib/compiled-erc4626-vault.json'),
  join(__dirname, '../public/compiled-erc4626-vault.json'),
)
compileVault(
  'ERC7540Vault.sol',
  'ERC7540Vault',
  join(__dirname, '../src/lib/compiled-erc7540-vault.json'),
  join(__dirname, '../public/compiled-erc7540-vault.json'),
)
