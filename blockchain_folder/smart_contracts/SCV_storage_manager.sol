// SPDX-License-Identifier: MIT
// This contract would manage our main system

pragma solidity >=0.8.2 <0.9.0;


interface ISCVStorageManager {
    function addCertificate(string memory _cid, bytes32 _certHash) external returns (uint);
    function getCertificateInfoByHash(bytes32 _certHash) external view returns (bool, string memory);
    function getAllCertificates() external view returns (string memory);
    function getCertificateCount() external view returns (uint256);
}

contract SCV_storage_manager is ISCVStorageManager {
    // Manager address (e.g., SCV_UI_manager)
    address public owner;

    bytes32[] private certificateIds;
    uint256 public num_certificates;

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

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    struct CertificateInfo {
        bytes32 certificateHash;
        string ipfsCid;
        uint256 timestamp;
    }

    mapping(bytes32 => CertificateInfo) private certificateList;

    // Event emitted when a certificate is stored
    event CertificateStored(string cid, bytes32 certHash, uint256 timestamp);

    function addCertificate(string memory _cid, bytes32 _certHash) public onlyOwner returns (uint256) {
        // validate CID
        require(bytes(_cid).length > 0, "Invalid CID");

        // validate that hash does not exists, rare case
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
        emit CertificateStored(_cid, _certHash, block.timestamp);

        // TODO checks this implementation
        // Return a pseudo ID (e.g., hash of CID % 256)
        return uint256(keccak256(abi.encodePacked(_cid))) % 256;
    }

    function getCertificateInfoByHash(bytes32 _certHash) public view onlyOwner returns (bool, string memory) {
        CertificateInfo storage cert = certificateList[_certHash];
        if (cert.timestamp == 0) {
            return (false, "");
        }
        if (bytes(cert.ipfsCid).length == 0) {
            return (false, "Certificate CID is empty");
        }

        // Validate timestamp to avoid edge cases (optional)
        require(cert.timestamp > 0, "Invalid timestamp");

        string memory certInfo;
        // Build string safely
        try this.buildCertInfoString(cert) returns (string memory info) {
            certInfo = info;
        } catch {
            return (false, "Error building certificate info string");
        }

        return (true, certInfo);
    }

    // External helper to use try-catch (only external calls support try-catch)
    function buildCertInfoString(CertificateInfo memory cert) external pure returns (string memory) {
        return string(
            abi.encodePacked(
                "Timestamp: ",
                uint2str(cert.timestamp),
                ", Hash: ",
                bytes32ToHexString(cert.certificateHash),
                ", CID: ",
                cert.ipfsCid
            )
        );
    }

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

    function getCertificateCount() public view onlyOwner returns (uint256) {
        return num_certificates;
    }


    // LAST TO FUNCTIONS ARE FROM SPECIFIC TYPE TO STRINGS CONVERTER

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
