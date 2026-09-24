import { type Hex } from 'viem'
import erc4626VaultSource from '../contracts/ERC4626Vault.sol?raw'
import erc7540VaultSource from '../contracts/ERC7540Vault.sol?raw'

export const ERC4626_VAULT_CONTRACT_SOURCE = erc4626VaultSource
export const ERC7540_VAULT_CONTRACT_SOURCE = erc7540VaultSource

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

// Faucet contract source as string for browser compilation
export const ERC20_FAUCET_CONTRACT_SOURCE = `// SPDX-License-Identifier: MIT
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

contract ERC20Faucet is IERC20 {
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
        _balances[address(this)] = _totalSupply;
        emit Transfer(address(0), address(this), _totalSupply);
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

    function money_pweese() public {
        uint256 amount = 5 * 10 ** decimals;
        require(_balances[address(this)] >= amount, "Insufficient faucet balance");
        _transfer(address(this), msg.sender, amount);
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

async function loadCompiledFaucetContract(): Promise<CompileResult | null> {
  try {
    // Try to load from public directory (copied during build)
    const response = await fetch('/faucet/compiled-faucet-contract.json')
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
      const response = await fetch('/compiled-faucet-contract.json')
      if (response.ok) {
        const data = await response.json()
        return {
          abi: data.abi,
          bytecode: data.bytecode as Hex,
        }
      }
    } catch (err2) {
      console.warn('Pre-compiled faucet contract not found, will attempt runtime compilation')
    }
  }
  return null
}

export async function compileFaucetContract(): Promise<CompileResult> {
  // First, try to load pre-compiled contract
  const preCompiled = await loadCompiledFaucetContract()
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
          'ERC20Faucet.sol': {
            content: ERC20_FAUCET_CONTRACT_SOURCE,
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

    const contract = output.contracts['ERC20Faucet.sol']['ERC20Faucet']
    return {
      abi: contract.abi,
      bytecode: `0x${contract.evm.bytecode.object}` as Hex,
    }
  } catch (err: any) {
    throw new Error(`Failed to compile faucet contract: ${err.message}. Please run 'npm run compile-contract' to pre-compile the contract.`)
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

// ERC721 contract source as string for browser compilation
export const ERC721_CONTRACT_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC721 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}

interface IERC721Metadata {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

contract ERC721 is IERC721, IERC721Metadata {
    string public name;
    string public symbol;
    string private _baseURI;

    address public owner;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    uint256 private _tokenIdCounter;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory baseURI_
    ) {
        name = _name;
        symbol = _symbol;
        _baseURI = baseURI_;
        owner = msg.sender;
        _tokenIdCounter = 0;
    }

    function balanceOf(address _owner) public view override returns (uint256) {
        require(_owner != address(0), "ERC721: address zero is not a valid owner");
        return _balances[_owner];
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "ERC721: invalid token ID");
        return tokenOwner;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_owners[tokenId] != address(0), "ERC721: invalid token ID");
        return string(abi.encodePacked(_baseURI, _toString(tokenId)));
    }

    function baseURI() public view returns (string memory) {
        return _baseURI;
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }

    function approve(address to, uint256 tokenId) public override {
        address tokenOwner = ownerOf(tokenId);
        require(to != tokenOwner, "ERC721: approval to current owner");
        require(
            msg.sender == tokenOwner || isApprovedForAll(tokenOwner, msg.sender),
            "ERC721: approve caller is not token owner or approved for all"
        );
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view override returns (address) {
        require(_owners[tokenId] != address(0), "ERC721: invalid token ID");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) public override {
        require(msg.sender != operator, "ERC721: approve to caller");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address _owner, address operator) public view override returns (bool) {
        return _operatorApprovals[_owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: caller is not token owner or approved");
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public override {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: caller is not token owner or approved");
        _safeTransfer(from, to, tokenId, data);
    }

    function mint(address to) public returns (uint256) {
        require(msg.sender == owner, "ERC721: only owner can mint");
        require(to != address(0), "ERC721: mint to the zero address");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _balances[to]++;
        _owners[tokenId] = to;

        emit Transfer(address(0), to, tokenId);

        return tokenId;
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");
        require(to != address(0), "ERC721: transfer to the zero address");

        delete _tokenApprovals[tokenId];

        _balances[from]--;
        _balances[to]++;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory data) internal {
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, data), "ERC721: transfer to non ERC721Receiver implementer");
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        return (spender == tokenOwner || isApprovedForAll(tokenOwner, spender) || getApproved(tokenId) == spender);
    }

    function _checkOnERC721Received(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) private returns (bool) {
        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("ERC721: transfer to non ERC721Receiver implementer");
                } else {
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        } else {
            return true;
        }
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}`

async function loadCompiledERC721Contract(): Promise<CompileResult | null> {
  try {
    // Try to load from public directory (copied during build)
    const response = await fetch('/faucet/compiled-erc721-contract.json')
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
      const response = await fetch('/compiled-erc721-contract.json')
      if (response.ok) {
        const data = await response.json()
        return {
          abi: data.abi,
          bytecode: data.bytecode as Hex,
        }
      }
    } catch (err2) {
      console.warn('Pre-compiled ERC721 contract not found, will attempt runtime compilation')
    }
  }
  return null
}

export async function compileERC721Contract(): Promise<CompileResult> {
  // First, try to load pre-compiled contract
  const preCompiled = await loadCompiledERC721Contract()
  if (preCompiled) {
    return preCompiled
  }

  // Fallback: Use a compilation service
  try {
    const response = await fetch('https://compiler.remix-project.org/compile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: 'Solidity',
        sources: {
          'ERC721.sol': {
            content: ERC721_CONTRACT_SOURCE,
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

    const contract = output.contracts['ERC721.sol']['ERC721']
    return {
      abi: contract.abi,
      bytecode: `0x${contract.evm.bytecode.object}` as Hex,
    }
  } catch (err: any) {
    throw new Error(`Failed to compile ERC721 contract: ${err.message}. Please run 'npm run compile-contract' to pre-compile the contract.`)
  }
}

export function getERC721ContractABI(): any[] {
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
      name: 'baseURI',
      outputs: [{ internalType: 'string', name: '', type: 'string' }],
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
      inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
      name: 'ownerOf',
      outputs: [{ internalType: 'address', name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
      name: 'tokenURI',
      outputs: [{ internalType: 'string', name: '', type: 'string' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'address', name: 'to', type: 'address' }],
      name: 'mint',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'address', name: 'from', type: 'address' },
        { internalType: 'address', name: 'to', type: 'address' },
        { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      ],
      name: 'transferFrom',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'address', name: 'from', type: 'address' },
        { internalType: 'address', name: 'to', type: 'address' },
        { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      ],
      name: 'safeTransferFrom',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ]
}

async function loadCompiledJson(paths: string[], label: string): Promise<CompileResult | null> {
  for (const path of paths) {
    try {
      const response = await fetch(path)
      if (response.ok) {
        const data = await response.json()
        return {
          abi: data.abi,
          bytecode: data.bytecode as Hex,
        }
      }
    } catch {
      // Try the next path.
    }
  }
  console.warn(`Pre-compiled ${label} not found, will attempt runtime compilation`)
  return null
}

async function compileWithRemix(
  filename: string,
  contractName: string,
  source: string,
  precompiled: CompileResult | null,
): Promise<CompileResult> {
  if (precompiled) {
    return precompiled
  }

  try {
    const response = await fetch('https://compiler.remix-project.org/compile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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

    const contract = output.contracts[filename][contractName]
    return {
      abi: contract.abi,
      bytecode: `0x${contract.evm.bytecode.object}` as Hex,
    }
  } catch (err: any) {
    throw new Error(
      `Failed to compile ${contractName}: ${err.message}. Please run 'npm run compile-contract' to pre-compile the contract.`,
    )
  }
}

export async function compileERC4626Vault(): Promise<CompileResult> {
  const precompiled = await loadCompiledJson(
    ['/faucet/compiled-erc4626-vault.json', '/compiled-erc4626-vault.json'],
    'ERC4626 vault',
  )
  return compileWithRemix('ERC4626Vault.sol', 'ERC4626Vault', ERC4626_VAULT_CONTRACT_SOURCE, precompiled)
}

export async function compileERC7540Vault(): Promise<CompileResult> {
  const precompiled = await loadCompiledJson(
    ['/faucet/compiled-erc7540-vault.json', '/compiled-erc7540-vault.json'],
    'ERC7540 vault',
  )
  return compileWithRemix('ERC7540Vault.sol', 'ERC7540Vault', ERC7540_VAULT_CONTRACT_SOURCE, precompiled)
}

export function getAssetABI(): any[] {
  return [
    {
      inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
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
      inputs: [
        { internalType: 'address', name: 'spender', type: 'address' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' },
      ],
      name: 'approve',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ]
}

export function getVaultABI(): any[] {
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
      name: 'asset',
      outputs: [{ internalType: 'address', name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'owner',
      outputs: [{ internalType: 'address', name: '', type: 'address' }],
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
      inputs: [],
      name: 'totalAssets',
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
      inputs: [{ internalType: 'uint256', name: 'assets', type: 'uint256' }],
      name: 'convertToShares',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
      name: 'convertToAssets',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'uint256', name: 'assets', type: 'uint256' }],
      name: 'previewDeposit',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
      name: 'previewMint',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'uint256', name: 'assets', type: 'uint256' }],
      name: 'previewWithdraw',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
      name: 'previewRedeem',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'uint256', name: 'assets', type: 'uint256' },
        { internalType: 'address', name: 'receiver', type: 'address' },
      ],
      name: 'deposit',
      outputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'uint256', name: 'assets', type: 'uint256' },
        { internalType: 'address', name: 'receiver', type: 'address' },
        { internalType: 'address', name: 'controller', type: 'address' },
      ],
      name: 'deposit',
      outputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'uint256', name: 'shares', type: 'uint256' },
        { internalType: 'address', name: 'receiver', type: 'address' },
      ],
      name: 'mint',
      outputs: [{ internalType: 'uint256', name: 'assets', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'uint256', name: 'shares', type: 'uint256' },
        { internalType: 'address', name: 'receiver', type: 'address' },
        { internalType: 'address', name: 'controller', type: 'address' },
      ],
      name: 'mint',
      outputs: [{ internalType: 'uint256', name: 'assets', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'uint256', name: 'assets', type: 'uint256' },
        { internalType: 'address', name: 'receiver', type: 'address' },
        { internalType: 'address', name: 'owner', type: 'address' },
      ],
      name: 'withdraw',
      outputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'uint256', name: 'shares', type: 'uint256' },
        { internalType: 'address', name: 'receiver', type: 'address' },
        { internalType: 'address', name: 'owner', type: 'address' },
      ],
      name: 'redeem',
      outputs: [{ internalType: 'uint256', name: 'assets', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'uint256', name: 'assets', type: 'uint256' },
        { internalType: 'address', name: 'controller', type: 'address' },
        { internalType: 'address', name: 'owner', type: 'address' },
      ],
      name: 'requestDeposit',
      outputs: [{ internalType: 'uint256', name: 'requestId', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'uint256', name: 'shares', type: 'uint256' },
        { internalType: 'address', name: 'controller', type: 'address' },
        { internalType: 'address', name: 'owner', type: 'address' },
      ],
      name: 'requestRedeem',
      outputs: [{ internalType: 'uint256', name: 'requestId', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'uint256', name: 'requestId', type: 'uint256' },
        { internalType: 'address', name: 'controller', type: 'address' },
      ],
      name: 'pendingDepositRequest',
      outputs: [{ internalType: 'uint256', name: 'assets', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'uint256', name: 'requestId', type: 'uint256' },
        { internalType: 'address', name: 'controller', type: 'address' },
      ],
      name: 'claimableDepositRequest',
      outputs: [{ internalType: 'uint256', name: 'assets', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'uint256', name: 'requestId', type: 'uint256' },
        { internalType: 'address', name: 'controller', type: 'address' },
      ],
      name: 'pendingRedeemRequest',
      outputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'uint256', name: 'requestId', type: 'uint256' },
        { internalType: 'address', name: 'controller', type: 'address' },
      ],
      name: 'claimableRedeemRequest',
      outputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'address', name: 'operator', type: 'address' },
        { internalType: 'bool', name: 'approved', type: 'bool' },
      ],
      name: 'setOperator',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'address', name: 'controller', type: 'address' }],
      name: 'fulfillDeposit',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'address', name: 'controller', type: 'address' }],
      name: 'fulfillRedeem',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'bytes4', name: 'interfaceId', type: 'bytes4' }],
      name: 'supportsInterface',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'view',
      type: 'function',
    },
  ]
}
