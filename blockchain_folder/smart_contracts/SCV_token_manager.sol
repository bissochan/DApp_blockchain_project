// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

// Token interface for mint functionality
interface IToken {
    function mint(address _account, uint256 _amount) external returns (bool);
    event Mint(address account, uint256 amount);
}

// ERC-20 standard interface
interface IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function balanceOf(address who) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract TokenSCV is IERC20, IToken {
    address public owner;

    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowed;
    uint256 private totalSupply_;
    string private _name;
    string private _symbol;
    uint8 private _decimals;

    constructor(string memory name_, string memory symbol_, uint8 decimals_, uint256 initialSupply_) {
        require(decimals_ <= 18, "Too many decimals");
        owner = msg.sender;
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;
        totalSupply_ = initialSupply_;
        balances[owner] = initialSupply_;

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
        require(to != address(0), "Invalid address");
        require(allowed[from][msg.sender] >= amount, "Not allowed");
        require(balances[from] >= amount, "Insufficient balance");

        allowed[from][msg.sender] -= amount;
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
        emit Transfer(address(0), _account, _amount);
        return true;
    }

    // ========================= Burning ========================= //

    function burn(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Amount must be > 0");
        require(balances[msg.sender] >= _amount, "Insufficient balance");

        balances[msg.sender] -= _amount;
        totalSupply_ -= _amount;

        emit Burn(_amount);
        emit Transfer(msg.sender, address(0), _amount);
    }

    event Burn(uint256 amount);
}
