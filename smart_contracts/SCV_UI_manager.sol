pragma solidity >=0.8.2 <0.9.0;

interface ISCVStorageManager {
    function addCertificate(string memory _cid, bytes32 _certHash) external returns (uint);
    function getCertificateInfoByHash(bytes32 _certHash) external view returns (bool, string memory);
}


contract SCV_UI_manager {
    // === State Variables ===
    address public owner;
    ISCVStorageManager public storageManager;
    mapping(address => bool) public _certifiedWhitelisted;

    // === Constructor ===
    constructor(address _owner) {
        require(_owner != address(0), "Invalid owner address");
        owner = _owner;

        // Initialize the whitelist with the owner
        this.addWhiteListEntity(this.owner);
        
        storageManager = ISCVStorageManager(owner);
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

    // === Whitelist Management ===
    function addWhiteListEntity(address _entity) external onlyOwner returns (bool) {
        require(_entity != address(0), "Invalid address");
        _certifiedWhitelisted[_entity] = true;
        return true;
    }

    function removeWhiteListEntity(address _entity) external onlyOwner returns (bool) {
        require(_certifiedWhitelisted[_entity], "Entity not in whitelist");
        delete _certifiedWhitelisted[_entity];
        return true;
    }

    // === External Contract Wiring ===
    function setStorageManager(address _storageManagerAddress) external onlyOwner returns (bool){
        require(_storageManagerAddress != address(0), "Invalid storage manager address");
        storageManager = ISCVStorageManager(_storageManagerAddress);
        return true;
    }

    // === Certificate Publishing ===
    function storeCertificate(
        address _entity,
        bytes32 _certificateHash,
        string memory _ipfsCid
    ) public onlyWhitelistedEntity returns (bool){
        require(_entity == msg.sender, "Entity mismatch"); // Optional sanity check
        require(bytes(_ipfsCid).length > 0, "Empty CID");
        require(_certificateHash != bytes32(0), "Invalid hash");

        // Forward to storage manager
        storageManager.addCertificate(_ipfsCid, _certificateHash);

        // TODO: Call TokenManager reward logic (if applicable)

        return true
    }
}