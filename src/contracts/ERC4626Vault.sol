// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title ERC4626Vault
/// @notice Synchronous ERC-4626 vault. One share is always worth one asset.
contract ERC4626Vault {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;
    string public name;
    string public symbol;
    uint8 public decimals;

    address public owner;
    address public asset;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares);
    event Withdraw(
        address indexed sender,
        address indexed receiver,
        address indexed owner,
        uint256 assets,
        uint256 shares
    );

    constructor(address asset_, string memory name_, string memory symbol_) {
        require(asset_ != address(0), "asset is zero");
        asset = asset_;
        name = name_;
        symbol = symbol_;
        owner = msg.sender;
        decimals = _tryDecimals(asset_);
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function allowance(address account, address spender) public view returns (uint256) {
        return _allowances[account][spender];
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        _spendAllowance(from, msg.sender, amount);
        _transfer(from, to, amount);
        return true;
    }

    function totalAssets() public view returns (uint256) {
        return _totalSupply;
    }

    function convertToShares(uint256 assets) public pure returns (uint256) {
        return assets;
    }

    function convertToAssets(uint256 shares) public pure returns (uint256) {
        return shares;
    }

    function maxDeposit(address) public pure returns (uint256) {
        return type(uint256).max;
    }

    function maxMint(address) public pure returns (uint256) {
        return type(uint256).max;
    }

    function maxWithdraw(address account) public view returns (uint256) {
        return _balances[account];
    }

    function maxRedeem(address account) public view returns (uint256) {
        return _balances[account];
    }

    function previewDeposit(uint256 assets) public pure returns (uint256) {
        return assets;
    }

    function previewMint(uint256 shares) public pure returns (uint256) {
        return shares;
    }

    function previewWithdraw(uint256 assets) public pure returns (uint256) {
        return assets;
    }

    function previewRedeem(uint256 shares) public pure returns (uint256) {
        return shares;
    }

    function deposit(uint256 assets, address receiver) public returns (uint256 shares) {
        require(assets > 0, "zero assets");
        require(receiver != address(0), "receiver is zero");
        shares = assets;
        require(IERC20(asset).transferFrom(msg.sender, address(this), assets), "asset transferFrom failed");
        _mint(receiver, shares);
        emit Deposit(msg.sender, receiver, assets, shares);
    }

    function mint(uint256 shares, address receiver) public returns (uint256 assets) {
        require(shares > 0, "zero shares");
        require(receiver != address(0), "receiver is zero");
        assets = shares;
        require(IERC20(asset).transferFrom(msg.sender, address(this), assets), "asset transferFrom failed");
        _mint(receiver, shares);
        emit Deposit(msg.sender, receiver, assets, shares);
    }

    function withdraw(uint256 assets, address receiver, address account) public returns (uint256 shares) {
        require(assets > 0, "zero assets");
        require(receiver != address(0), "receiver is zero");
        shares = assets;
        if (msg.sender != account) {
            _spendAllowance(account, msg.sender, shares);
        }
        _burn(account, shares);
        require(IERC20(asset).transfer(receiver, assets), "asset transfer failed");
        emit Withdraw(msg.sender, receiver, account, assets, shares);
    }

    function redeem(uint256 shares, address receiver, address account) public returns (uint256 assets) {
        require(shares > 0, "zero shares");
        require(receiver != address(0), "receiver is zero");
        assets = shares;
        if (msg.sender != account) {
            _spendAllowance(account, msg.sender, shares);
        }
        _burn(account, shares);
        require(IERC20(asset).transfer(receiver, assets), "asset transfer failed");
        emit Withdraw(msg.sender, receiver, account, assets, shares);
    }

    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "ERC20: mint to the zero address");
        _totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) internal {
        require(from != address(0), "ERC20: burn from the zero address");
        uint256 balance = _balances[from];
        require(balance >= amount, "ERC20: burn amount exceeds balance");
        unchecked {
            _balances[from] = balance - amount;
            _totalSupply -= amount;
        }
        emit Transfer(from, address(0), amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        uint256 balance = _balances[from];
        require(balance >= amount, "ERC20: transfer amount exceeds balance");
        unchecked {
            _balances[from] = balance - amount;
            _balances[to] += amount;
        }
        emit Transfer(from, to, amount);
    }

    function _approve(address account, address spender, uint256 amount) internal {
        require(account != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        _allowances[account][spender] = amount;
        emit Approval(account, spender, amount);
    }

    function _spendAllowance(address account, address spender, uint256 amount) internal {
        uint256 currentAllowance = _allowances[account][spender];
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            unchecked {
                _approve(account, spender, currentAllowance - amount);
            }
        }
    }

    function _tryDecimals(address token) internal view returns (uint8) {
        (bool ok, bytes memory data) = token.staticcall(abi.encodeWithSignature("decimals()"));
        if (ok && data.length >= 32) {
            return abi.decode(data, (uint8));
        }
        return 18;
    }
}
