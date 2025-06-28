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
    uint256 public constant TOKEN_PER_ETHER = 10000; // Example token reward for each ether sent to the contract
    uint256 public constant TOKEN_PER_ETHER_MIN = 0.01 ether; // Minimum ether to buy tokens
    uint256 public constant TOKEN_INCREASE_SUPPLY_OF = 1000; // Amount of tokens to increase supply by

    mapping(address => bool) public _certifiedWhitelisted;

    // === Events ===
    event EntityWhitelisted(address indexed entity);
    event EntityRemovedFromWhitelist(address indexed entity);
    event StorageManagerUpdated(address indexed newStorageManager);
    event CertificateStored(
        address indexed entity,
        bytes32 certificateHash,
        string ipfsCid
    );
    event CertificateLookup(
        address indexed entity,
        string certificateHash,
        string ipfsCid
    );
    event TokensRewarded(
        address indexed entity,
        uint256 amount
    );
    event TokensTransferred(
        address indexed from,
        address indexed to,
        uint256 amount
    );
    event TokensMinted(
        address indexed entity,
        uint256 amount
    );

    // === Constructor ===
    constructor(address _owner) {
        require(_owner != address(0), "Invalid owner address");
        owner = _owner;
        // Note: storageManager will be set separately via setStorageManager
    }

    // === Fallback Function ===
    fallback() external {
        // Fallback function to handle unexpected calls
        revert("Invalid function call");
    }

    // === Modifiers ===
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner: not authorized");
        _;
    }

    modifier onlyWhitelistedEntity() {
        require(_certifiedWhitelisted[msg.sender], "Only whitelisted entity: not authorized");
        _;
    }

    modifier storageManagerSet() {
        require(
            address(storageManager) != address(0),
            "Storage manager not set"
        );
        _;
    }

    // === Whitelist Management ===
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

    function removeWhiteListEntity(
        address _entity
    ) external onlyOwner returns (bool) {
        require(_certifiedWhitelisted[_entity], "Entity not in whitelist");

        delete _certifiedWhitelisted[_entity];
        emit EntityRemovedFromWhitelist(_entity);
        return true;
    }

    // === External Contract Wiring ===
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

        require(certId > 0, "Certificate storage failed");

        emit CertificateStored(_entity, _certificateHash, _ipfsCid);

        // Reward the entity with tokens for storing the certificate
        if (address(tokenManager) != address(0)) {
            try tokenManager.mint(_entity, TOKEN_PER_REWARD) {
                emit TokensRewarded(_entity, TOKEN_PER_REWARD);
            } catch {
                revert("Token minting failed");
            }
        }

        return true;
    }

    // === View Functions ===
    function isWhitelisted(address _entity) external view returns (bool) {
        return _certifiedWhitelisted[_entity];
    }

    // === Certificate Query Functions ===
    function getCertificateInfo(
        bytes32 _certificateHash
    ) external storageManagerSet returns (bool, string memory) {
        require(address(storageManager) != address(0), "Storage manager not set");
        require(_certificateHash != bytes32(0), "Invalid certificate hash");
        require(address(tokenManager) != address(0), "Token manager not set");
        require(
            tokenManager.balanceOf(msg.sender) >= TOKEN_PER_LOOKUP,
            "Insufficient tokens for lookup"
        );

        tokenManager.transferFrom(msg.sender, address(this), TOKEN_PER_LOOKUP);

        (bool exists, string memory cid) = storageManager.getCertificateInfoByHash(_certificateHash);

        emit CertificateLookup(msg.sender, string(abi.encodePacked(_certificateHash)), cid);

        return (exists, cid);
    }

    // view function for the certificate hash stored in the contract, onlyOwner
    function getCertificateInfoView(
        bytes32 _certificateHash
    ) external view onlyOwner returns (bool, string memory) {
        require(_certificateHash != bytes32(0), "Invalid certificate hash");
        return storageManager.getCertificateInfoByHash(_certificateHash);
    }

    // function see all certificates stored in the contract, onlyOwner
    function getAllCertificates() external view onlyOwner returns (string memory) {
        // This function should return all certificate hashes stored in the storage manager
        // Assuming the storage manager has a function to get all certificates
        // This is a placeholder, actual implementation may vary based on storage manager design
        return storageManager.getAllCertificates();
    }

    function getNumCertificates() external view onlyOwner returns (uint256) {
        // This function should return the number of certificates stored in the storage manager
        // Assuming the storage manager has a function to get the number of certificates
        // This is a placeholder, actual implementation may vary based on storage manager design
        return storageManager.getCertificateCount();
    }

    // === managing Users Tokens ===
    function getUserTokenBalance(address _user) external view returns (uint256) {
        require(address(tokenManager) != address(0), "Token manager not set");
        return tokenManager.balanceOf(_user);
    }

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
        require(
            tokenManager.balanceOf(msg.sender) >= _amount,
            "Insufficient token balance"
        );

        return tokenManager.transfer(_to, _amount);
    }

    // buy tokens with ether
    function buyTokens() external payable returns (bool) {
        require(msg.value > 0, "Send some ether to buy tokens");
        require(address(tokenManager) != address(0), "Token manager not set");

        // Calculate the number of tokens to mint based on the ether sent
        // TODO: control overflows
        require(
            (msg.value * TOKEN_PER_ETHER) / 1 ether > 0,
            "Insufficient ether sent to buy tokens"
        );
        uint256 tokensToTransfer = (msg.value * TOKEN_PER_ETHER) / 1 ether;

        // Transfer tokens from the contract to the user
        if (tokenManager.balanceOf(address(this)) <= tokensToTransfer) {
            // Mint tokens for this contract so that the total supply increases
            tokenManager.mint(address(this), tokensToTransfer + TOKEN_INCREASE_SUPPLY_OF);
            emit TokensMinted(address(this), tokensToTransfer + TOKEN_INCREASE_SUPPLY_OF);
        } 

        // Transfer tokens to the user
        require(
            tokenManager.transfer(msg.sender, tokensToTransfer),
            "Token transfer failed"
        );

        // Emit an event for the token purchase
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
}