// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

// Token interface for mint functionality and burning functionality
interface IToken {
    function mint(address _account, uint256 _amount) external returns (bool);
    function burn(address account, uint256 amount) external returns (bool);
    event Mint(address account, uint256 amount);
    event Burn(uint256 amount);
    event DecreaseTotalSupply(uint256 amount);
    event IncreaseTotalSupply(uint256 amount);
}

// ERC-20 standard interface
interface IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function balanceOf(address who) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);

    // approval and allowance functions are for compatibility with ERC-20 standard 
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);

    // transferFrom is used to transfer tokens from one address to another,
    // owner (uiManager) has the right to transfer tokens from any address
    function transferFrom(address from, address to, uint256 value) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract SCV_token_manager is IERC20, IToken {
    address public owner;

    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowed;
    uint256 private totalSupply_;
    string private _name;
    string private _symbol;
    uint8 private _decimals;

    constructor(string memory name_, string memory symbol_, uint8 decimals_, uint256 initialSupply_, address initialOwner_) {
        require(decimals_ <= 18, "Too many decimals");
        owner = initialOwner_;
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;
        totalSupply_ = initialSupply_ * (10 ** uint256(decimals_)); // Adjusting for decimals
        require(totalSupply_ > 0, "Initial supply must be greater than 0");
        balances[owner] = totalSupply_;

        emit Transfer(address(0), owner, initialSupply_);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ========================= View Functions ========================= //

    function name() external view override returns (string memory) {
        return _name;
    }

    function symbol() external view override returns (string memory) {
        return _symbol;
    }

    function decimals() external view override returns (uint8) {
        return _decimals;
    }

    function totalSupply() external view override returns (uint256) {
        return totalSupply_;
    }

    function balanceOf(address account) external view override returns (uint256) {
        return balances[account];
    }

    function allowance(address _owner, address spender) external view override returns (uint256) {
        return allowed[_owner][spender];
    }

    // ========================= ERC20 Functions ========================= //

    function transfer(address to, uint256 amount) external override returns (bool) {
        require(to != address(0), "Invalid address");
        require(to != msg.sender, "Cannot transfer to self");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        require(spender != address(0), "Invalid address");

        allowed[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        require(from != address(0), "Invalid from address");
        require(to != address(0), "Invalid to address");
        require(to != from, "Cannot transfer to self");
        require(msg.sender == owner || allowed[from][msg.sender] >= amount, "Not authorized");
        require(balances[from] >= amount, "Insufficient balance");

        if (msg.sender != owner) {
            allowed[from][msg.sender] -= amount;
            emit Approval(from, msg.sender, allowed[from][msg.sender]);
        }

        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        balances[from] -= amount;
        balances[to] += amount;

        emit Transfer(from, to, amount);
    }

    // ========================= Minting ========================= //

    function mint(address _account, uint256 _amount) external override onlyOwner returns (bool) {
        require(_account != address(0), "Invalid address");
        require(_amount > 0, "Amount must be > 0");

        totalSupply_ += _amount;
        balances[_account] += _amount;

        emit Mint(_account, _amount);
        emit IncreaseTotalSupply(totalSupply_);
        return true;
    }

    // ========================= Burning ========================= //

    function burn(address account, uint256 amount) external override onlyOwner returns (bool) {
        require(account != address(0), "Invalid address");
        require(balances[account] >= amount, "Insufficient balance");

        balances[account] -= amount;
        totalSupply_ -= amount;

        emit Burn(amount);
        emit DecreaseTotalSupply(totalSupply_);
        return true;
    }
}
