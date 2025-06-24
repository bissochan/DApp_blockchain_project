// SPDX-License-Identifier: MIT
// This contract would manage our main system

pragma solidity >=0.8.2 <0.9.0;


interface ISCVStorageManager {
    function addCertificate(string memory _cid, bytes32 _certHash) external returns (uint);
    function getCertificateInfoByHash(bytes32 _certHash) external view returns (bool, string memory);
}

contract SCV_storage_manager is ISCVStorageManager {
    // Manager address (e.g., SCV_UI_manager)
    address public managerAddress;

    constructor(address _manager) {
        managerAddress = _manager;
    }

    modifier onlyManager() {
        require(msg.sender == managerAddress, "Not authorized");
        _;
    }

    struct CertificateInfo {
        bytes32 certificateHash;
        string ipfsCid;
        uint256 timestamp;
    }

    mapping(bytes32 => CertificateInfo) private certificateList;

    function addCertificate(string memory _cid, bytes32 _certHash) public onlyManager returns (uint256) {
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

        // TODO checks this implementation
        // Return a pseudo ID (e.g., hash of CID % 256)
        return uint256(keccak256(abi.encodePacked(_cid))) % 256;
    }

    function getCertificateInfoByHash(bytes32 _certHash) public view onlyManager returns (bool, string memory) {
        CertificateInfo storage cert = certificateList[_certHash];
        if (cert.timestamp == 0) {
            return (false, "");
        }

        // TODO: revise the returned information
        string memory certInfo = string(
            abi.encodePacked(
                "Timestamp: ",
                uint2str(cert.timestamp),
                ", Hash: ",
                bytes32ToHexString(cert.certificateHash),
                ", CID: ", cert.ipfsCid
            )
        );
        return (true, certInfo);
    }

    // LAST TO FUNCTIONS ARE FROM SPECIFIC TYPE TO STRINGS CONVERTER

    // Helper: Convert uint to string
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length - 1;
        while (_i != 0) {
            bstr[k--] = bytes1(uint8(48 + _i % 10));
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
