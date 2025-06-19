pragma solidity >=0.8.2 <0.9.0;

interface ISCVStorageManager {
    function addCertificate(string memory _cid, bytes32 _certHash) external returns (uint);
    function getCertificateInfoByHash(bytes32 _certHash) external view returns (bool, string memory);
}


contract SCV_UI_manager {
    // === State Variables ===
    address public owner;
    ISCVStorageManager public storageManager;

    // === Constructor ===
    constructor(address _owner) {
        require(_owner != address(0), "Invalid owner address");
        owner = _owner;
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
    mapping(address => bool) public _certifiedWhitelisted;

    function addWhiteListEntity(address _entity) external onlyOwner {
        require(_entity != address(0), "Invalid address");
        _certifiedWhitelisted[_entity] = true;
    }

    function removeWhiteListEntity(address _entity) external onlyOwner {
        require(_certifiedWhitelisted[_entity], "Entity not in whitelist");
        delete _certifiedWhitelisted[_entity];
    }

    // === External Contract Wiring ===
    function setStorageManager(address _storageManagerAddress) external onlyOwner {
        require(_storageManagerAddress != address(0), "Invalid storage manager address");
        storageManager = ISCVStorageManager(_storageManagerAddress);
    }

    // === Certificate Publishing ===
    function storeCertificate(
        address _entity,
        bytes32 _certificateHash,
        string memory _ipfsCid
    ) public onlyWhitelistedEntity {
        require(_entity == msg.sender, "Entity mismatch"); // Optional sanity check
        require(bytes(_ipfsCid).length > 0, "Empty CID");
        require(_certificateHash != bytes32(0), "Invalid hash");

        // Forward to storage manager
        storageManager.addCertificate(_ipfsCid, _certificateHash);

        // TODO: Call TokenManager reward logic (if applicable)
    }
}