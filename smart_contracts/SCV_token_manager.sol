// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

//importing safemath 
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/math/SafeMath.sol";
// importing token interface
interface IToken {
    function mint(address _account, uint256 _amount) external;
}

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

    // standard event
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract TokenSCV is IERC20{
    address public owner;

   // Internal state variables
    mapping(address => uint256) internal balanceOf; // mapping address to their balance
    mapping (address => mapping (address => uint256)) internal allowed; // (Optional) allowance mapping (ie, spender, balance)
    uint256 internal totalSupply_; // total supply of tokens
    string private _name; // name of token
    string private _symbol; // symbol of the token
    uint8 private _decimals;  // number of decimals
    
    // event for approve
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Transfer(address indexed from, address indexed to, uint256 value);

    event Burn(uint256 amount);

    constructor(string memory name_, string memory symbol_, uint256 decimals_, uint256 initialSupply_){
        owner = msg.sender; // set the owner of token contract to caller address (this should be a smart contract)
        _name = name_;  // set token naming convention for all tokens (string)
        _symbol = symbol_;    //set symbol name (ie, 'SV')
        _decimals = uint256(decimals_);   // set number of decimals used to determine value amount of tokens 18 decimals for sv token
        totalSupply_ = initialSupply_;    // set total supply of the token contract (this should be 0)

        // set the owner as msg.sender (the owner should be the UI_manager
        owner = msg.sender;
        
        // transfer initial supply of tokens to the creator
        balanceOf[owner] = totalSupply_;      // give this contract ownership over totalSupply_ amount

        // emit the event 
        emit Transfer(address(0), owner, totalSupply_);   /// this is the transfer event (initially zero)
    }        
    
    //--------------VIEW FUNCTIONS----------------//
    function name() external view returns (string memory){
        return _name;  /// Returning the naming convention for all tokens in string format.
    }
        
    function symbol() external view returns (string memory){
        return _symbol; /// Returning the symbol name of token in string format
    }

    function totalSupply() external view returns(uint256 supply) {   // Returning the total
        return totalSupply_;  // for all tokens, as uint8 it's decimals (18 is sv token)
    }
       
    function balanceOf(address account){ ///Return the token balance of address (ie owner)
        return balanceOf[account];     // Returning the total supply to owner 0 0x000...000 for sv contract is 18 decimal places or 32 bytes.
    }  

    function decimals() external view returns (uint8){
        return _decimals;
    }

    //---------------EXCHANGE FUNCTIONS------------//
    function transfer(address to, uint256 value) external returns (bool){
        require(value <= balanceOf[msg.sender]);  /// if the transfer amount is greater than current token balances then throw error and return false;
        require(!(to == address(0))); // TODO: check this if the to address is zero, return an error (zero address can't be an address) otherwise set the value of balanceOf for msg.sender as new total supply minus transfer amount 
        
            /// Transfer from the sender to the receiver (ie current token balances -= transfer amounts);
        _transfer(msg.sender, to, value);   // call internal function (_transfer) with values of msg.sender and to as well as value; this will decrease balanceOf for either address from transfer amount in total supply
        return true;  /// return success (true or false)
    }    
     
    /**
        * @dev Transfer token for a given address
        * @param _from address which you want to send tokens from
        * @param _to address which you want to transfer to
        * @param _value uint256 the amount of tokens to be transferred
    */
    function _transfer(address _from, address _to, uint256 _value) internal {   /// internal because it is allowed to change the state 
         balanceOf[_from] -= _value; // decrease total supply for sender by transfer amount for both sender and receiver addresses (ie from or to);

         /// increase total supply for recipient address with given value, and emit Transfer event.
        balanceOf[_to] += _value;   /// increase current supply of token contract at the reciever's address by transfer amount 1)
        
        // emit the Transfer event (with values from sender to receiver addresses);
        emit Transfer(_from, _to, _value);    // This will emit a Transfer(from, to, value).
    }    

    /// --------------------EXCHANGE FOR OTHERS FUNCTIONS------------------------------
    /// @notice approve is used by spender to update allowed amount. 
    /// This is not required because spender can approve max -1 and never again.
    function allowance(address owner, address spender) public view returns (uint256){   // Return the allowed value of this contract from a given token address and spender's address;
        return allowed[owner][spender];      /// Returning all approved values for each address.
    }

    function approve(address spender, uint256 value) external returns (bool){
        require(!(spender == address(0)));   // check if the spender is zero then return false;
        require(_value <= balanceOf[msg.sender]);  /// if _value greater than current token balances, throw error and return (false) else do nothing for approving amount of this contract to spend on behalf of msg.sender address or spender's address.
         // increase total supply for sender by transfer amount from either owner or spender;
        allowed[msg.sender][spender] = value ;  /// approve the given token address and allowance with this contract to spend on behalf of msg.sender, spender addresses (ie from)
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool){
        require(_value <= allowed[from][msg.sender]);  /// if the approve amount is greater than current token balances then throw error and return false;
        require(!(to == address(0))); // TODO: check this if the to address is zero, return an error (zero address can't be an address) otherwise set the value of balanceOf for msg.sender as new total supply minus transfer amount 
         /// Transfer from the sender to the receiver (ie current token balances -= transfer amounts);
        _transfer(from, to, value);   // call internal function (_transfer) with values of from and to as well as value; this will decrease balance
    }
}