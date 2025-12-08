import { type Hex } from 'viem'

// Contract source as string for browser compilation
export const ERC20_CONTRACT_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract ERC20 is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;
    string public name;
    string public symbol;
    uint8 public decimals;

    address public owner;

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _totalSupply
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        owner = msg.sender;
        _totalSupply = _totalSupply * 10 ** _decimals;
        _balances[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
    }

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        address owner = msg.sender;
        _transfer(owner, to, amount);
        return true;
    }

    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        address owner = msg.sender;
        _approve(owner, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        address spender = msg.sender;
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) public {
        require(msg.sender == owner, "Only owner can mint");
        _totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
        unchecked {
            _balances[from] = fromBalance - amount;
            _balances[to] += amount;
        }

        emit Transfer(from, to, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _spendAllowance(address owner, address spender, uint256 amount) internal {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            unchecked {
                _approve(owner, spender, currentAllowance - amount);
            }
        }
    }
}`

export interface CompileResult {
  abi: any[]
  bytecode: Hex
}

export interface DeployParams {
  name: string
  symbol: string
  decimals: number
  totalSupply: bigint
}

async function loadCompiledContract(): Promise<CompileResult | null> {
  try {
    // Try to load from public directory (copied during build)
    const response = await fetch('/faucet/compiled-contract.json')
    if (response.ok) {
      const data = await response.json()
      return {
        abi: data.abi,
        bytecode: data.bytecode as Hex,
      }
    }
  } catch (err) {
    // Try root path as fallback
    try {
      const response = await fetch('/compiled-contract.json')
      if (response.ok) {
        const data = await response.json()
        return {
          abi: data.abi,
          bytecode: data.bytecode as Hex,
        }
      }
    } catch (err2) {
      console.warn('Pre-compiled contract not found, will attempt runtime compilation')
    }
  }
  return null
}

export async function compileContract(): Promise<CompileResult> {
  // First, try to load pre-compiled contract
  const preCompiled = await loadCompiledContract()
  if (preCompiled) {
    return preCompiled
  }

  // Fallback: Use a compilation service
  // Note: This requires CORS to be enabled on the compilation service
  try {
    // Using a public Solidity compiler service
    // You may need to set up your own compilation service or use a proxy
    const response = await fetch('https://compiler.remix-project.org/compile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: 'Solidity',
        sources: {
          'ERC20.sol': {
            content: ERC20_CONTRACT_SOURCE,
          },
        },
        settings: {
          outputSelection: {
            '*': {
              '*': ['abi', 'evm.bytecode.object'],
            },
          },
        },
      }),
    })

    if (!response.ok) {
      throw new Error('Compilation service unavailable')
    }

    const output = await response.json()
    
    if (output.errors) {
      const errors = output.errors.filter((e: any) => e.severity === 'error')
      if (errors.length > 0) {
        throw new Error(`Compilation errors: ${JSON.stringify(errors)}`)
      }
    }

    const contract = output.contracts['ERC20.sol']['ERC20']
    return {
      abi: contract.abi,
      bytecode: `0x${contract.evm.bytecode.object}` as Hex,
    }
  } catch (err: any) {
    throw new Error(`Failed to compile contract: ${err.message}. Please run 'npm run compile-contract' to pre-compile the contract.`)
  }
}

export function getContractABI(): any[] {
  // Return the ABI for contract interactions (reading contract info, etc.)
  return [
    {
      inputs: [],
      name: 'name',
      outputs: [{ internalType: 'string', name: '', type: 'string' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'symbol',
      outputs: [{ internalType: 'string', name: '', type: 'string' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'decimals',
      outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'totalSupply',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'address', name: 'to', type: 'address' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' },
      ],
      name: 'transfer',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'address', name: 'to', type: 'address' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' },
      ],
      name: 'mint',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ]
}
