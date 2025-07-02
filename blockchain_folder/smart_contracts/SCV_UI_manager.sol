// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

// Interface for the storage manager (matching your actual contract)
import "./SCV_storage_manager.sol";
import "./SCV_token_manager.sol";
interface ISCV_UI_manager {
    function addWhiteListEntity(address _entity) external returns (bool);
    function removeWhiteListEntity(address _entity) external returns (bool);
    function setStorageManager(address _storageManagerAddress) external returns (bool);
    function isWhitelisted(address _entity) external view returns (bool);
    function getCertificateInfo(bytes32 _certificateHash) external returns (bool, string memory);
    function getCertificateInfoView(bytes32 _certificateHash) external view returns (bool, string memory);
    function getAllCertificates() external view returns (string memory);
    function getUserTokenBalance(address _user) external view returns (uint256);
    function setTokenManager(address _tokenManagerAddress) external returns (bool);
    function storeCertificate(
        address _entity,
        bytes32 _certificateHash,
        string memory _ipfsCid
    ) external returns (bool);
    function getNumCertificates() external view returns (uint256);
    function newUser(address _user) external returns (bool);
    function burnUserTokens(address user, uint256 amount) external;
    function mintUserTokens(address user, uint256 amount) external;
    function transferTokens(address _to, uint256 _amount) external returns (bool);
    function buyTokens() external payable returns (bool);
    function withdrawEther(address payable _to, uint256 _amount) external;

    // === Events ===
    event EntityWhitelisted(address indexed entity);
    event EntityRemovedFromWhitelist(address indexed entity);
    event StorageManagerUpdated(address indexed newStorageManager);
    event TokenManagerUpdated(address indexed newTokenManager);

    // Used to log successful certificate storage
    // This event is emitted when a certificate is successfully stored
    // It includes the entity that stored the certificate, the certificate hash, and the IPFS CID
    event CertificateStored(
        address indexed entity,
        bytes32 indexed certificateHash,
        string ipfsCid
    );

    // Used to log successful certificate lookups and to send the IPFS CID
    // This event is emitted when a certificate is successfully looked up
    event CertificateLookup(
        address indexed entity,
        bytes32 indexed certificateHash,
        string ipfsCid
    );

    // Used to log successful certificate storage
    // This event is emitted when a certificate is successfully store
    event TokensRewarded(
        address indexed entity,
        uint256 amount
    );

    // Used to log successful token transfers
    // This event is emitted when tokens are transferred from one address to another
    event TokensTransferred(
        address indexed from,
        address indexed to,
        uint256 amount
    );

    // Used to log successful token minting
    // This event is emitted when tokens are minted for an entity
    event TokensMinted(
        address indexed entity,
        uint256 amount
    );

    // Used to log successful token burning
    // This event is emitted when tokens are burned from an entity's balance
    event TokensBurned(
        address indexed entity,
        uint256 amount
    );
}

contract SCV_UI_manager is ISCV_UI_manager {
    // === State Variables ===
    address public owner;
    ISCVStorageManager public storageManager;
    SCV_token_manager public tokenManager; // Placeholder for future token manager integration

    // Constants for token rewards
    // These values can be adjusted based on the system's requirements
    uint256 public constant TOKEN_PER_REWARD = 20; // Example token reward for storing a certificate
    uint256 public constant TOKEN_PER_LOOKUP = 10; // Example token reward for each lookup
    uint256 public constant TOKEN_INITIAL_SUPPLY = 1000000; // Initial token supply for the contract
    uint256 public constant TOKEN_INITIAL_PER_USER = 100; // Initial token balance for the users
    uint256 public constant TOKEN_PER_ETHER = 10000; // arbitrary token reward for each ether sent to the contract
    uint256 public constant TOKEN_PER_ETHER_MIN = 0.0001 ether; // Minimum ether to buy tokens
    uint256 public constant TOKEN_INCREASE_SUPPLY_OF = 1000; // Amount of tokens to increase supply by

    // === Whitelist Management ===
    // This mapping keeps track of whitelisted entities that can store certificates
    mapping(address => bool) public _certifiedWhitelisted;
     
    // // Certificate querying, list that remembers which wallet can see a specific certificate
    // mapping(address => mapping(bytes32 => bool)) public certificateQueryWhitelist;

    // === Constructor ===
    constructor(address _owner) {
        require(_owner != address(0), "Invalid owner address");
        owner = _owner;
        // Note: storageManager will be set separately via setStorageManager
    }

    // // === Fallback Function ===
    // THIS FUNCTION CAN BE IMPLEMENTED IN FUTURE IMPROVEMENTS TO ALLOW UPGRADABILITY
    // // Fallback function to handle unexpected calls
    // fallback() external {
    //     // Fallback function to handle unexpected calls
    //     revert("Invalid function call");
    // }

    // === Modifiers ===

    // Modifier to restrict access to the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner: not authorized");
        _;
    }

    // Modifier to restrict access to whitelisted entities
    modifier onlyWhitelistedEntity() {
        require(_certifiedWhitelisted[msg.sender], "Only whitelisted entity: not authorized");
        _;
    }

    // Modifier to ensure the storage manager is set before performing operations
    modifier storageManagerSet() {
        require(
            address(storageManager) != address(0),
            "Storage manager not set"
        );
        _;
    }

    // === Whitelist Management ===
    // Function to check if an entity is whitelisted
    // This function checks if the given entity is in the whitelist
    // It returns true if the entity is whitelisted, false otherwise
    function certifiedWhitelisted(
        address _entity
    ) external view returns (bool) {
        return _certifiedWhitelisted[_entity];
    }
    function addWhiteListEntity( 
        address _entity
    ) external onlyOwner returns (bool) {
        require(_entity != address(0), "Invalid address");
        require(!_certifiedWhitelisted[_entity], "Entity already whitelisted");

        _certifiedWhitelisted[_entity] = true;
        emit EntityWhitelisted(_entity);
        return true;
    }

    // Function to remove an entity from the whitelist
    // This function allows the owner to remove an entity from the whitelist
    // It checks if the entity is in the whitelist and removes it if found
    function removeWhiteListEntity(
        address _entity
    ) external onlyOwner returns (bool) {
        require(_certifiedWhitelisted[_entity], "Entity not in whitelist");

        delete _certifiedWhitelisted[_entity];
        emit EntityRemovedFromWhitelist(_entity);
        return true;
    }

    // === External Contract Wiring ===

    // Function to set the storage manager address
    function setStorageManager(
        address _storageManagerAddress
    ) external onlyOwner returns (bool) {
        require(
            _storageManagerAddress != address(0),
            "Invalid storage manager address"
        );

        storageManager = ISCVStorageManager(_storageManagerAddress);
        emit StorageManagerUpdated(_storageManagerAddress);
        return true;
    }

    // === Token Manager Setup ===
    // Function to set the token manager address
    function setTokenManager(
        address _tokenManagerAddress
    ) external onlyOwner returns (bool) {
        require(
            _tokenManagerAddress != address(0),
            "Invalid token manager address"
        );

        tokenManager = SCV_token_manager(_tokenManagerAddress);
        return false;
    }

    // === Certificate Publishing ===

    // Function to store a certificate
    // This function allows a whitelisted entity to store a certificate
    /*
    This function allows a whitelisted entity to store a certificate in the storage manager.
    It requires the entity to be whitelisted and the storage manager to be set.
    */
    function storeCertificate(
        address _entity,
        bytes32 _certificateHash,
        string memory _ipfsCid
    ) public onlyWhitelistedEntity storageManagerSet returns (bool) {
        require(_entity == msg.sender, "Entity mismatch");
        require(bytes(_ipfsCid).length > 0, "Empty CID");
        require(_certificateHash != bytes32(0), "Invalid hash");

        // Forward to storage manager (returns uint256 ID)
        uint256 certId = storageManager.addCertificate(
            _ipfsCid,
            _certificateHash
        );

        require(certId >= 0, "Certificate storage failed");

        emit CertificateStored(_entity, _certificateHash, _ipfsCid);

        // Reward the entity with tokens for storing the certificate
        // check balance of this contract and then send tokens to the entity
        uint256 tokenBalance = tokenManager.balanceOf(address(this));

        if (tokenBalance < TOKEN_PER_REWARD) {
            // Mint more tokens if the contract balance is low
            uint256 mintAmount = TOKEN_PER_REWARD + TOKEN_INCREASE_SUPPLY_OF;
            tokenManager.mint(address(this), mintAmount);
            emit TokensMinted(address(this), mintAmount);
        }

        // Transfer tokens to the entity
        bool success = tokenManager.transfer(_entity, TOKEN_PER_REWARD);
        require(success, "Token transfer failed");

        emit TokensRewarded(_entity, TOKEN_PER_REWARD);

        return true;
    }

    // === View Functions ===
    // Function to check if an entity is whitelisted
    // This function checks if the given entity is in the whitelist
    function isWhitelisted(address _entity) external view returns (bool) {
        return _certifiedWhitelisted[_entity];
    }

    // === Certificate Query Functions ===

    // Function to get access to certificate information by hash
    // the information are published as emitted events
    function getCertificateInfo(
        bytes32 _certificateHash
    ) external storageManagerSet returns (bool, string memory) {
        // Ensure the storage manager is set 
        require(address(storageManager) != address(0), "Storage manager not set");

        // Check if the certificate hash is valid
        require(_certificateHash != bytes32(0), "Invalid certificate hash");

        // Check if the token manager is set and the user has enough tokens
        require(address(tokenManager) != address(0), "Token manager not set");
        require(
            tokenManager.balanceOf(msg.sender) >= TOKEN_PER_LOOKUP,
            "Insufficient tokens for lookup"
        );

        // Transfer tokens from the user to the contract for the lookup
        tokenManager.transferFrom(msg.sender, address(this), TOKEN_PER_LOOKUP);

        // Emit an event for the token transfer
        (bool exists, string memory cid) = storageManager.getCertificateInfoByHash(_certificateHash);

        emit CertificateLookup(msg.sender, _certificateHash, cid);

        return (exists, cid);
    }

    // Debug function to get certificate information without token deduction
    // This function is for testing purposes and should be used by owner only
    function getCertificateInfoView(
        bytes32 _certificateHash
    ) external view onlyOwner returns (bool, string memory) {
        require(_certificateHash != bytes32(0), "Invalid certificate hash");

        return storageManager.getCertificateInfoByHash(_certificateHash);
    }

    // function see all certificates stored in the contract, onlyOwner
    // Debug purposes
    function getAllCertificates() external view onlyOwner returns (string memory) {
        // This function should return all certificate hashes stored in the storage manager
        // Assuming the storage manager has a function to get all certificates
        // This is a placeholder, actual implementation may vary based on storage manager design
        return storageManager.getAllCertificates();
    }

    // Function to get the number of certificates stored in the storage manager
    function getNumCertificates() external view onlyOwner returns (uint256) {
        // This function should return the number of certificates stored in the storage manager
        // Assuming the storage manager has a function to get the number of certificates
        // This is a placeholder, actual implementation may vary based on storage manager design
        return storageManager.getCertificateCount();
    }

    // === managing Users Tokens ===
    // Function to get the token balance of a user
    function getUserTokenBalance(address _user) external view returns (uint256) {
        require(address(tokenManager) != address(0), "Token manager not set");
        require(_user != address(0), "Invalid user address");
        return tokenManager.balanceOf(_user);
    }

    // Function to mint specific amount tokens for a new user 
    // Not used in the application, provided for future improvements
    function newUser(
        address _user
    ) external onlyOwner returns (bool) {
        require(_user != address(0), "Invalid user address");
        require(
            tokenManager.balanceOf(_user) == 0,
            "User already has tokens"
        );

        // Mint initial tokens for the new user
        return tokenManager.mint(_user, TOKEN_INITIAL_PER_USER);
    }

    // should be used to transfer tokens from the contract to the user
    // this function can be used by the contract owner to transfer tokens to users
    function transferTokens(
        address _to,
        uint256 _amount
    ) external returns (bool) {
        require(_to != address(0), "Invalid recipient address");

        return tokenManager.transfer(_to, _amount);
    }

    // Function to buy tokens with ether
    // This function allows users to buy tokens by sending ether to the contract
    // It calculates the number of tokens to transfer based on the ether sent
    // and the predefined TOKEN_PER_ETHER rate.
    function buyTokens() external payable returns (bool) {
        require(msg.value > 0, "Send some ether to buy tokens");
        require(address(tokenManager) != address(0), "Token manager not set");

        uint256 tokensToTransfer = (msg.value * TOKEN_PER_ETHER) / 1 ether;
        require(tokensToTransfer > 0, "Insufficient ether sent to buy tokens");

        // Ensure contract has enough tokens, or mint more
        uint256 contractBalance = tokenManager.balanceOf(address(this));
        if (contractBalance < tokensToTransfer) {
            uint256 mintAmount = tokensToTransfer + TOKEN_INCREASE_SUPPLY_OF;
            tokenManager.mint(address(this), mintAmount);
            emit TokensMinted(address(this), mintAmount);
        }

        // Transfer tokens to the buyer
        bool success = tokenManager.transfer(msg.sender, tokensToTransfer);
        require(success, "Token transfer failed");

        emit TokensTransferred(address(this), msg.sender, tokensToTransfer);
        return true;
    }


    // Function to burn user tokens, only callable by the owner
    // This function allows the owner to burn tokens from a specific user's balance
    function burnUserTokens(address user, uint256 amount) public onlyOwner {
        tokenManager.burn(user, amount);
    }

    // Function to mint tokens for a specific user, only callable by the owner
    function mintUserTokens(address user, uint256 amount) public onlyOwner {
        tokenManager.mint(user, amount);
    }

    // === Withdraw function ===

    // Function to withdraw ether from the contract
    // Not used in the application, provided for future improvements
    // Callable only by the owner
    function withdrawEther(
        address payable _to,
        uint256 _amount
    ) external onlyOwner {
        require(_to != address(0), "Invalid address");
        require(address(this).balance >= _amount, "Insufficient balance");

        // Transfer the specified amount of ether to the recipient
        _to.transfer(_amount);
    }
}