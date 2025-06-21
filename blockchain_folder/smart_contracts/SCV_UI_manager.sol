// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

// Interface for the storage manager (matching your actual contract)
interface ISCVStorageManager {
    function addCertificate(string memory _cid, bytes32 _certHash) external returns (uint256);
    function getCertificateInfoByHash(bytes32 _certHash) external view returns (bool, string memory);
}

interface ISCV_UI_manager {
    function addWhiteListEntity(address _entity) external returns (bool);
    function removeWhiteListEntity(address _entity) external returns (bool);
    function setStorageManager(address _storageManagerAddress) external returns (bool);
    function storeCertificate(
        address _entity,
        bytes32 _certificateHash,
        string memory _ipfsCid
    ) external returns (bool);
}

contract SCV_UI_manager is ISCV_UI_manager {
    // === State Variables ===
    address public owner;
    ISCVStorageManager public storageManager;
    mapping(address => bool) public _certifiedWhitelisted;
    
    // === Events ===
    event EntityWhitelisted(address indexed entity);
    event EntityRemovedFromWhitelist(address indexed entity);
    event StorageManagerUpdated(address indexed newStorageManager);
    event CertificateStored(address indexed entity, bytes32 certificateHash, string ipfsCid);
    
    // === Constructor ===
    constructor(address _owner) {
        require(_owner != address(0), "Invalid owner address");
        owner = _owner;
        // Note: storageManager will be set separately via setStorageManager
    }
    
    // === Modifiers ===
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyWhitelistedEntity() {
        require(_certifiedWhitelisted[msg.sender], "Not a certified entity");
        _;
    }
    
    modifier storageManagerSet() {
        require(address(storageManager) != address(0), "Storage manager not set");
        _;
    }
    
    // === Whitelist Management ===
    function addWhiteListEntity(address _entity) external onlyOwner returns (bool) {
        require(_entity != address(0), "Invalid address");
        require(!_certifiedWhitelisted[_entity], "Entity already whitelisted");
        
        _certifiedWhitelisted[_entity] = true;
        emit EntityWhitelisted(_entity);
        return true;
    }
    
    function removeWhiteListEntity(address _entity) external onlyOwner returns (bool) {
        require(_certifiedWhitelisted[_entity], "Entity not in whitelist");
        
        delete _certifiedWhitelisted[_entity];
        emit EntityRemovedFromWhitelist(_entity);
        return true;
    }
    
    // === External Contract Wiring ===
    function setStorageManager(address _storageManagerAddress) external onlyOwner returns (bool) {
        require(_storageManagerAddress != address(0), "Invalid storage manager address");
        
        storageManager = ISCVStorageManager(_storageManagerAddress);
        emit StorageManagerUpdated(_storageManagerAddress);
        return true;
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
        uint256 certId = storageManager.addCertificate(_ipfsCid, _certificateHash);
        
        emit CertificateStored(_entity, _certificateHash, _ipfsCid);
        return true;
    }
    
    // === View Functions ===
    function isWhitelisted(address _entity) external view returns (bool) {
        return _certifiedWhitelisted[_entity];
    }
    
    // === Certificate Query Functions ===
    function getCertificateInfo(bytes32 _certificateHash) external view storageManagerSet returns (bool, string memory) {
        return storageManager.getCertificateInfoByHash(_certificateHash);
    }
}