// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title ERC7540Vault
/// @notice Fully asynchronous ERC-7540 vault. Requests use id 0 and aggregate per controller.
///         One share is always worth one asset. The owner moves pending requests to claimable.
contract ERC7540Vault {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    mapping(address => mapping(address => bool)) private _operators;
    mapping(address => uint256) private _pendingDeposit;
    mapping(address => uint256) private _claimableDeposit;
    mapping(address => uint256) private _pendingRedeem;
    mapping(address => uint256) private _claimableRedeem;

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
    event DepositRequest(
        address indexed controller,
        address indexed owner,
        uint256 indexed requestId,
        address sender,
        uint256 assets
    );
    event RedeemRequest(
        address indexed controller,
        address indexed owner,
        uint256 indexed requestId,
        address sender,
        uint256 shares
    );
    event OperatorSet(address indexed controller, address indexed operator, bool approved);

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

    function maxDeposit(address controller) public view returns (uint256) {
        return _claimableDeposit[controller];
    }

    function maxMint(address controller) public view returns (uint256) {
        return _claimableDeposit[controller];
    }

    function maxWithdraw(address controller) public view returns (uint256) {
        return _claimableRedeem[controller];
    }

    function maxRedeem(address controller) public view returns (uint256) {
        return _claimableRedeem[controller];
    }

    function previewDeposit(uint256) public pure returns (uint256) {
        revert("preview not available for async vault");
    }

    function previewMint(uint256) public pure returns (uint256) {
        revert("preview not available for async vault");
    }

    function previewWithdraw(uint256) public pure returns (uint256) {
        revert("preview not available for async vault");
    }

    function previewRedeem(uint256) public pure returns (uint256) {
        revert("preview not available for async vault");
    }

    function deposit(uint256 assets, address receiver) public returns (uint256 shares) {
        return deposit(assets, receiver, msg.sender);
    }

    function deposit(uint256 assets, address receiver, address controller) public returns (uint256 shares) {
        require(assets > 0, "zero assets");
        require(receiver != address(0), "receiver is zero");
        require(controller == msg.sender || _operators[controller][msg.sender], "not controller or operator");
        uint256 claimable = _claimableDeposit[controller];
        require(claimable >= assets, "insufficient claimable");
        unchecked {
            _claimableDeposit[controller] = claimable - assets;
        }
        shares = assets;
        _mint(receiver, shares);
        emit Deposit(controller, receiver, assets, shares);
    }

    function mint(uint256 shares, address receiver) public returns (uint256 assets) {
        return mint(shares, receiver, msg.sender);
    }

    function mint(uint256 shares, address receiver, address controller) public returns (uint256 assets) {
        require(shares > 0, "zero shares");
        require(receiver != address(0), "receiver is zero");
        require(controller == msg.sender || _operators[controller][msg.sender], "not controller or operator");
        assets = shares;
        uint256 claimable = _claimableDeposit[controller];
        require(claimable >= assets, "insufficient claimable");
        unchecked {
            _claimableDeposit[controller] = claimable - assets;
        }
        _mint(receiver, shares);
        emit Deposit(controller, receiver, assets, shares);
    }

    function withdraw(uint256 assets, address receiver, address controller) public returns (uint256 shares) {
        require(assets > 0, "zero assets");
        require(receiver != address(0), "receiver is zero");
        require(controller == msg.sender || _operators[controller][msg.sender], "not controller or operator");
        shares = assets;
        uint256 claimable = _claimableRedeem[controller];
        require(claimable >= shares, "insufficient claimable");
        unchecked {
            _claimableRedeem[controller] = claimable - shares;
        }
        require(IERC20(asset).transfer(receiver, assets), "asset transfer failed");
        emit Withdraw(msg.sender, receiver, controller, assets, shares);
    }

    function redeem(uint256 shares, address receiver, address controller) public returns (uint256 assets) {
        require(shares > 0, "zero shares");
        require(receiver != address(0), "receiver is zero");
        require(controller == msg.sender || _operators[controller][msg.sender], "not controller or operator");
        assets = shares;
        uint256 claimable = _claimableRedeem[controller];
        require(claimable >= shares, "insufficient claimable");
        unchecked {
            _claimableRedeem[controller] = claimable - shares;
        }
        require(IERC20(asset).transfer(receiver, assets), "asset transfer failed");
        emit Withdraw(msg.sender, receiver, controller, assets, shares);
    }

    function requestDeposit(uint256 assets, address controller, address owner_) public returns (uint256 requestId) {
        require(assets > 0, "zero assets");
        require(controller != address(0), "controller is zero");
        require(owner_ == msg.sender || _operators[owner_][msg.sender], "not owner or operator");
        requestId = 0;
        _pendingDeposit[controller] += assets;
        require(IERC20(asset).transferFrom(owner_, address(this), assets), "asset transferFrom failed");
        emit DepositRequest(controller, owner_, requestId, msg.sender, assets);
    }

    function pendingDepositRequest(uint256 requestId, address controller) public view returns (uint256 assets) {
        if (requestId != 0) return 0;
        return _pendingDeposit[controller];
    }

    function claimableDepositRequest(uint256 requestId, address controller) public view returns (uint256 assets) {
        if (requestId != 0) return 0;
        return _claimableDeposit[controller];
    }

    function requestRedeem(uint256 shares, address controller, address owner_) public returns (uint256 requestId) {
        require(shares > 0, "zero shares");
        require(controller != address(0), "controller is zero");
        if (owner_ != msg.sender && !_operators[owner_][msg.sender]) {
            _spendAllowance(owner_, msg.sender, shares);
        }
        requestId = 0;
        _burn(owner_, shares);
        _pendingRedeem[controller] += shares;
        emit RedeemRequest(controller, owner_, requestId, msg.sender, shares);
    }

    function pendingRedeemRequest(uint256 requestId, address controller) public view returns (uint256 shares) {
        if (requestId != 0) return 0;
        return _pendingRedeem[controller];
    }

    function claimableRedeemRequest(uint256 requestId, address controller) public view returns (uint256 shares) {
        if (requestId != 0) return 0;
        return _claimableRedeem[controller];
    }

    function isOperator(address controller, address operator) public view returns (bool) {
        return _operators[controller][operator];
    }

    function setOperator(address operator, bool approved) public returns (bool) {
        require(operator != address(0), "operator is zero");
        _operators[msg.sender][operator] = approved;
        emit OperatorSet(msg.sender, operator, approved);
        return true;
    }

    function share() public view returns (address) {
        return address(this);
    }

    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return
            interfaceId == 0x01ffc9a7 || // ERC-165
            interfaceId == 0xe3bc4e65 || // ERC-7540 operator
            interfaceId == 0xce3bbe50 || // ERC-7540 async deposit
            interfaceId == 0x620ee8e4 || // ERC-7540 async redeem
            interfaceId == 0x2f0a18c5; // ERC-7575
    }

    /// @notice Owner-only transition from pending to claimable. Not part of ERC-7540.
    function fulfillDeposit(address controller) public {
        require(msg.sender == owner, "only owner");
        uint256 assets = _pendingDeposit[controller];
        require(assets > 0, "nothing pending");
        _pendingDeposit[controller] = 0;
        _claimableDeposit[controller] += assets;
    }

    /// @notice Owner-only transition from pending to claimable. Not part of ERC-7540.
    function fulfillRedeem(address controller) public {
        require(msg.sender == owner, "only owner");
        uint256 shares = _pendingRedeem[controller];
        require(shares > 0, "nothing pending");
        _pendingRedeem[controller] = 0;
        _claimableRedeem[controller] += shares;
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
