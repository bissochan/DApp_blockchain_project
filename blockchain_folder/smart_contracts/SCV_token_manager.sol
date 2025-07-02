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

    // Token storage
    // This contract implements the ERC-20 standard and includes minting and burning functionality
    // It allows the owner to mint new tokens and burn existing tokens
    mapping(address => uint256) private balances;

    // Mapping for allowances, allowing other addresses to spend tokens on behalf of the owner
    // This is used for the transferFrom function, allowing the owner to transfer tokens from other addresses
    mapping(address => mapping(address => uint256)) private allowed;
    uint256 private totalSupply_;
    string private _name;
    string private _symbol;

    // Number of decimals for the token, typically 18 for ERC-20 tokens
    // This allows for fractional tokens, e.g., 1 token can be represented as 1 * 10^18
    // while this is useful, our contract make exchanges usually for 10 tokens, so we will not actual use decimals
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
        require(msg.sender == owner, "Only owner: not authorized");
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

    // transfer allows the owner (uiManager) to transfer tokens to another address
    // This function checks if the recipient address is valid and not the sender
    // It also checks if the sender has enough balance to cover the transfer
    function transfer(address to, uint256 amount) external override returns (bool) {
        require(to != address(0), "Invalid address");
        require(to != msg.sender, "Cannot transfer to self");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        _transfer(msg.sender, to, amount);
        return true;
    }

    // NOT actually used by UI manager, but required by ERC20 standard
    // approve allows the owner (uiManager) to set an allowance for a spender
    // This function allows the owner to approve a spender to spend a certain amount of tokens on their behalf
    // It emits an Approval event to notify the blockchain of the approval
    // The spender cannot be the zero address, and the amount must be greater than zero
    function approve(address spender, uint256 amount) external override returns (bool) {
        require(spender != address(0), "Invalid address");

        allowed[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    // transferFrom allows the owner (uiManager) to transfer tokens from another address
    // This function checks if the sender is the owner or has enough allowance to transfer the tokens
    // It also checks if the from address has enough balance to cover the transfer
    // If the sender is not the owner, it reduces the allowance for the spender
    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        require(from != address(0), "Invalid from address");
        require(to != address(0), "Invalid to address");
        require(to != from, "Cannot transfer to self");
        require(msg.sender == owner || allowed[from][msg.sender] >= amount, "Only owner: not authorized");
        require(balances[from] >= amount, "Insufficient balance");

        if (msg.sender != owner) {
            allowed[from][msg.sender] -= amount;
            emit Approval(from, msg.sender, allowed[from][msg.sender]);
        }

        _transfer(from, to, amount);
        return true;
    }

    // Internal function to handle the actual transfer of tokens
    // This function updates the balances of the sender and receiver
    // It emits a Transfer event to notify the blockchain of the transfer
    function _transfer(address from, address to, uint256 amount) internal {
        balances[from] -= amount;
        balances[to] += amount;

        emit Transfer(from, to, amount);
    }

    // ========================= Minting ========================= //

    // Mint function allows the owner (uiManager) to mint new tokens
    // This function checks if the account address is valid and the amount is greater than zero
    // It increases the total supply of tokens and updates the balance of the account
    // It emits a Mint event to notify the blockchain of the minting
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

    // Burn function allows the owner (uiManager) to burn tokens from a specific account
    // This function checks if the account address is valid and the amount is less than or equal to the account's balance
    // It decreases the total supply of tokens and updates the balance of the account
    // It emits a Burn event to notify the blockchain of the burning
    // It also emits a DecreaseTotalSupply event to notify the blockchain of the decrease in total supply
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
