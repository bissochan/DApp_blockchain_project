// SPDX-License-Identifier: MIT
// This contract would manage our main system

pragma solidity >=0.8.2 <0.9.0;

// Interface for SCV storage manager
// This interface defines the functions for managing certificates in the SCV storage manager
// It includes functions to add certificates, retrieve certificate information by hash,
// get all certificates, and get the count of certificates
// The interface ensures that any contract implementing it will have these functions
// This allows for easy interaction with the SCV storage manager from other contracts or applications
interface ISCVStorageManager {
    function addCertificate(string memory _cid, bytes32 _certHash) external returns (uint);
    function getCertificateInfoByHash(bytes32 _certHash) external view returns (bool, string memory);
    function getAllCertificates() external view returns (string memory);
    function getCertificateCount() external view returns (uint256);
}

// SCV_storage_manager contract
// This contract implements the ISCVStorageManager interface
// It manages the storage of certificates, allowing the owner (e.g., SCV_UI_manager)
// to add certificates, retrieve certificate information by hash, and get all certificates
// The contract uses a mapping to store certificate information and an array to keep track of certificate IDs
// The owner of the contract is set during deployment, and only the owner can call certain functions
contract SCV_storage_manager is ISCVStorageManager {
    // Manager address (e.g., SCV_UI_manager)
    address public owner;

    bytes32[] private certificateIds;
    uint256 public num_certificates;

    // Constructor to initialize the contract with the manager's address
    // This constructor sets the owner of the contract to the provided manager address
    // It also initializes the number of certificates to 0 and sets up an array for certificate IDs
    // The array is initialized with a fixed size for simplicity, and all IDs are set to 0
    // The certificate list is initialized with a default entry for the zero hash
    constructor(address _manager) {
        owner = _manager;
        require(owner != address(0), "Invalid manager address");
        num_certificates = 0;

        certificateIds = new bytes32[](256); // Initialize with a fixed size for simplicity
        // Initialize the certificate list with empty values
        for (uint256 i = 0; i < 256; i++) {
            certificateIds[i] = 0; // Initialize all IDs to 0
        }

        // Initialize the certificate list with a default entry
        certificateList[bytes32(0)] = CertificateInfo({
            certificateHash: bytes32(0),
            ipfsCid: "",
            timestamp: 0
        });
    }

    // Modifier to restrict access to the owner (e.g., SCV_UI_manager)
    // This modifier checks if the caller is the owner of the contract
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    // Structure to hold certificate information
    // This structure contains the certificate hash, IPFS CID, and timestamp
    // It is used to store and retrieve certificate information efficiently
    // The `certificateHash` is a unique identifier for the certificate
    struct CertificateInfo {
        bytes32 certificateHash;
        string ipfsCid;
        uint256 timestamp;
    }

    // Mapping to store certificate information by hash
    // This mapping allows us to quickly access certificate information by its hash
    mapping(bytes32 => CertificateInfo) private certificateList;

    // Event emitted when a certificate is stored
    event CertificateStored(string comment);

    // ========================== Certificate Management Functions ========================= //

    // Function to add a new certificate
    // This function allows the owner (e.g., SCV_UI_manager) to add a new certificate
    // It takes a CID (Content Identifier) and a certificate hash as parameters
    // It returns the index of the newly added certificate
    // Note: This function is only callable by the owner (e.g., SCV_UI_manager)
    // It checks for valid inputs and ensures the certificate does not already exist
    function addCertificate(string memory _cid, bytes32 _certHash) public onlyOwner returns (uint256) {
        require(bytes(_cid).length > 0, "Invalid CID");
        require(_certHash != bytes32(0), "Invalid certificate hash");
        require(certificateList[_certHash].timestamp == 0, "Certificate already exists");

        CertificateInfo memory newCert = CertificateInfo({
            certificateHash: _certHash,
            ipfsCid: _cid,
            timestamp: block.timestamp
        });

        certificateList[_certHash] = newCert;

        // Store the certificate ID in the array
        certificateIds[num_certificates] = _certHash;
        num_certificates++;

        // Emit an event for certificate storage (optional, but recommended)
        // since emit are public we don't publish also the hash 
        emit CertificateStored("Certificate stored successfully");

        return num_certificates - 1; // Return the index of the newly added certificate
    }

    // Function to get certificate information by hash
    // This function returns a tuple with a boolean indicating success and a string with the certificate info
    // Note: This function is only callable by the owner (e.g., SCV_UI_manager)
    // It returns a boolean indicating success and a string with the certificate information
    // The string contains the timestamp, hash, and CID of the certificate
    function getCertificateInfoByHash(bytes32 _certHash) public view onlyOwner returns (bool, string memory) {
        require(_certHash != bytes32(0), "Invalid certificate hash");

        CertificateInfo storage cert = certificateList[_certHash];
        require(cert.timestamp > 0, "Certificate not found");

        string memory certInfo = string(
            abi.encodePacked(
                "Timestamp: ",
                uint2str(cert.timestamp),
                ", Hash: 0x", // Add 0x prefix
                bytes32ToHexString(cert.certificateHash),
                ", CID: ",
                cert.ipfsCid
            )
        );

        return (true, certInfo);
    }

    // External helper to use try-catch (only external calls support try-catch)
    // function buildCertInfoString(CertificateInfo memory cert) external pure returns (string memory) {
    //     return string(
    //         abi.encodePacked(
    //             "Timestamp: ",
    //             uint2str(cert.timestamp),
    //             ", Hash: ",
    //             bytes32ToHexString(cert.certificateHash),
    //             ", CID: ",
    //             cert.ipfsCid
    //         )
    //     );
    // }

    // Function to get all certificates as a string, Debugging purposes or for admin use
    // This function returns a string with all certificates' information
    // It iterates through the stored certificates and concatenates their information into a single string
    // Note: This function is only callable by the owner (e.g., SCV_UI_manager)
    function getAllCertificates() public view onlyOwner returns (string memory) {
        if (num_certificates == 0) {
            return "No certificates found";
        }

        string memory allCerts = "";

        for (uint256 i = 0; i < num_certificates; i++) {
            bytes32 certHash = certificateIds[i];
            CertificateInfo storage cert = certificateList[certHash];

            if (cert.timestamp > 0) {
                allCerts = string(
                    abi.encodePacked(
                        allCerts,
                        "Timestamp: ",
                        uint2str(cert.timestamp),
                        ", Hash: ",
                        bytes32ToHexString(cert.certificateHash),
                        ", CID: ",
                        cert.ipfsCid,
                        "\n"
                    )
                );
            }
        }

        if (bytes(allCerts).length == 0) {
            return "No certificates found";
        }

        return allCerts;
    }

    // Function to get the count of certificates
    // This function returns the total number of certificates stored in the contract
    function getCertificateCount() public view onlyOwner returns (uint256) {
        return num_certificates;
    }


    // ========================== Helper Functions ========================= //

    // Helper: Convert uint to string
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }

        uint256 temp = _i;
        uint256 length = 0;
        while (temp != 0) {
            length++;
            temp /= 10;
        }

        bytes memory bstr = new bytes(length);
        uint256 k = length;

        while (_i != 0) {
            k--;
            bstr[k] = bytes1(uint8(48 + _i % 10));
            _i /= 10;
        }

        return string(bstr);
    }


    // Helper: Convert bytes32 to hex string
    function bytes32ToHexString(bytes32 _bytes32) internal pure returns (string memory) {
        bytes memory HEX = "0123456789abcdef";
        bytes memory str = new bytes(64);
        for (uint i = 0; i < 32; i++) {
            str[i * 2] = HEX[uint(uint8(_bytes32[i] >> 4))];
            str[1 + i * 2] = HEX[uint(uint8(_bytes32[i] & 0x0f))];
        }
        return string(str);
    }
}
