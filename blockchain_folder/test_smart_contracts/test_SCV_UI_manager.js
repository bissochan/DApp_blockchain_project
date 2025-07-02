// STILL IT WORK FOR NOW

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SCV_UI_manager", function () {
  let scvUIManager;
  let storageManager;
  let owner;
  let entity1;
  let entity2;
  let nonWhitelistedEntity;

  beforeEach(async function () {
    // Get test accounts
    [owner, entity1, entity2, nonWhitelistedEntity] = await ethers.getSigners();

    // Deploy SCV_UI_manager first (to get its address for storage manager)
    const SCVUIManager = await ethers.getContractFactory("SCV_UI_manager");
    scvUIManager = await SCVUIManager.deploy(owner.address);
    await scvUIManager.waitForDeployment();

    // Deploy SCV_storage_manager with UI manager address as authorized manager
    const StorageManager = await ethers.getContractFactory("SCV_storage_manager");
    storageManager = await StorageManager.deploy(await scvUIManager.getAddress());
    await storageManager.waitForDeployment();

    // Ensure SCV_UI_manager is set as the owner of SCV_storage_manager
    expect(await storageManager.owner()).to.equal(await scvUIManager.getAddress());

    // Set storage manager in UI manager
    await scvUIManager.connect(owner).setStorageManager(await storageManager.getAddress());

    // Deploy SCV_token_manager with UI manager as owner
    const TokenManager = await ethers.getContractFactory("SCV_token_manager");
    const tokenManager = await TokenManager.deploy(
        "SCV Token", 
        "SCVT", 
        0, 
        1000, 
        await scvUIManager.getAddress()
    );
    await tokenManager.waitForDeployment();

    // Set token manager in UI manager
    await scvUIManager.connect(owner).setTokenManager(await tokenManager.getAddress());

    // Add owner to whitelist if not already added
    if (!(await scvUIManager.isWhitelisted(owner.address))) {
        await scvUIManager.addWhiteListEntity(owner.address);
    }

    // Mint tokens for entity1 to ensure sufficient balance for lookups
    const TOKEN_PER_LOOKUP = 10n;
    await scvUIManager.connect(owner).mintUserTokens(entity1.address, TOKEN_PER_LOOKUP * 10n); // Mint extra tokens for multiple lookups
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await scvUIManager.owner()).to.equal(owner.address);
    });

    it("Should set the storage manager correctly", async function () {
      expect(await scvUIManager.storageManager()).to.equal(await storageManager.getAddress());
      expect(await storageManager.owner()).to.equal(await scvUIManager.getAddress());
    });

    it("Should revert if owner is zero address", async function () {
      const SCVUIManager = await ethers.getContractFactory("SCV_UI_manager");
      await expect(
        SCVUIManager.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid owner address");
    });
  });


  describe("Storage Manager Management", function () {
    it("Should allow owner to set storage manager", async function () {
      const newStorageManager = await (await ethers.getContractFactory("SCV_storage_manager")).deploy(await scvUIManager.getAddress());
      await newStorageManager.waitForDeployment();

      await expect(
        scvUIManager.connect(owner).setStorageManager(await newStorageManager.getAddress())
      )
        .to.emit(scvUIManager, "StorageManagerUpdated")
        .withArgs(await newStorageManager.getAddress());

      expect(await scvUIManager.storageManager()).to.equal(await newStorageManager.getAddress());
    });

    it("Should revert if non-owner tries to set storage manager", async function () {
      await expect(
        scvUIManager.connect(entity1).setStorageManager(await storageManager.getAddress())
      ).to.be.revertedWith("Only owner: not authorized");
    });

    it("Should revert if storage manager address is zero", async function () {
      await expect(
        scvUIManager.connect(owner).setStorageManager(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid storage manager address");
    });
  });

  describe("Whitelist Management", function () {
    it("Should allow owner to add entity to whitelist", async function () {
      await expect(
        scvUIManager.connect(owner).addWhiteListEntity(entity1.address)
      )
        .to.emit(scvUIManager, "EntityWhitelisted")
        .withArgs(entity1.address);

      expect(await scvUIManager._certifiedWhitelisted(entity1.address)).to.be.true;
      expect(await scvUIManager.isWhitelisted(entity1.address)).to.be.true;
    });

    it("Should allow owner to remove entity from whitelist", async function () {
      // First add entity
      await scvUIManager.connect(owner).addWhiteListEntity(entity1.address);
      
      // Then remove entity
      await expect(
        scvUIManager.connect(owner).removeWhiteListEntity(entity1.address)
      )
        .to.emit(scvUIManager, "EntityRemovedFromWhitelist")
        .withArgs(entity1.address);

      expect(await scvUIManager._certifiedWhitelisted(entity1.address)).to.be.false;
      expect(await scvUIManager.isWhitelisted(entity1.address)).to.be.false;
    });

    it("Should revert if non-owner tries to add entity", async function () {
      await expect(
        scvUIManager.connect(entity1).addWhiteListEntity(entity2.address)
      ).to.be.revertedWith("Only owner: not authorized");
    });

    it("Should revert if trying to add zero address", async function () {
      await expect(
        scvUIManager.connect(owner).addWhiteListEntity(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });

    it("Should revert if trying to add already whitelisted entity", async function () {
      await scvUIManager.connect(owner).addWhiteListEntity(entity1.address);
      
      await expect(
        scvUIManager.connect(owner).addWhiteListEntity(entity1.address)
      ).to.be.revertedWith("Entity already whitelisted");
    });

    it("Should revert if trying to remove non-whitelisted entity", async function () {
      await expect(
        scvUIManager.connect(owner).removeWhiteListEntity(entity1.address)
      ).to.be.revertedWith("Entity not in whitelist");
    });
  });

  describe("Certificate Storage", function () {
    const testHash = ethers.keccak256(ethers.toUtf8Bytes("test certificate"));
    const testCid = "QmTest123456789";

    beforeEach(async function () {
      // Add entity1 to whitelist
      await scvUIManager.connect(owner).addWhiteListEntity(entity1.address);
    });

    it("Should allow whitelisted entity to store certificate", async function () {
      const testHash = ethers.keccak256(ethers.toUtf8Bytes("test certificate"));
      const testCid = "QmTest123456789";

      // Add entity1 to whitelist if not already added
      if (!(await scvUIManager.isWhitelisted(entity1.address))) {
        await scvUIManager.connect(owner).addWhiteListEntity(entity1.address);
      }

      // Store certificate
      await expect(
        scvUIManager.connect(entity1).storeCertificate(entity1.address, testHash, testCid)
      )
        .to.emit(scvUIManager, "CertificateStored");

      // Verify certificate was stored in storage manager
      const [exists, info] = await scvUIManager.getCertificateInfoView(testHash);
      expect(exists).to.be.true;
      expect(info).to.include("CID: " + testCid);
      expect(info).to.include("Timestamp:");
      expect(info).to.include("Hash:");
    });

    it("Should return correct certificate ID", async function () {
      const testHash = ethers.keccak256(ethers.toUtf8Bytes("test certificate"));
      const testCid = "QmTest123456789";

      // Add entity1 to whitelist if not already added
      if (!(await scvUIManager.isWhitelisted(entity1.address))) {
        await scvUIManager.connect(owner).addWhiteListEntity(entity1.address);
      }

      // Store certificate
      await scvUIManager.connect(entity1).storeCertificate(entity1.address, testHash, testCid);

      // Verify certificate exists using SCV_UI_manager
      const [exists, info] = await scvUIManager.getCertificateInfoView(testHash);
      expect(exists).to.be.true;
      expect(info).to.include("CID: " + testCid);
      expect(info).to.include("Hash: 0x" + testHash.slice(2)); // Ensure 0x prefix is included
    });

    it("Should revert if non-whitelisted entity tries to store certificate", async function () {
      await expect(
        scvUIManager.connect(nonWhitelistedEntity).storeCertificate(
          nonWhitelistedEntity.address, 
          testHash, 
          testCid
        )
      ).to.be.revertedWith("Only whitelisted entity: not authorized");
    });

    it("Should revert if entity address doesn't match sender", async function () {
      await expect(
        scvUIManager.connect(entity1).storeCertificate(entity2.address, testHash, testCid)
      ).to.be.revertedWith("Entity mismatch");
    });

    it("Should revert if CID is empty", async function () {
      await expect(
        scvUIManager.connect(entity1).storeCertificate(entity1.address, testHash, "")
      ).to.be.revertedWith("Empty CID");
    });

    it("Should revert if hash is zero", async function () {
      await expect(
        scvUIManager.connect(entity1).storeCertificate(
          entity1.address, 
          ethers.ZeroHash, 
          testCid
        )
      ).to.be.revertedWith("Invalid hash");
    });

    it("Should revert if storage manager is not set", async function () {
      // Deploy new contract without setting storage manager
      const SCVUIManager = await ethers.getContractFactory("SCV_UI_manager");
      const newContract = await SCVUIManager.deploy(owner.address);
      await newContract.waitForDeployment();
      
      // Add entity to whitelist
      await newContract.connect(owner).addWhiteListEntity(entity1.address);

      await expect(
        newContract.connect(entity1).storeCertificate(entity1.address, testHash, testCid)
      ).to.be.revertedWith("Storage manager not set");
    });

    it("Should revert if trying to store duplicate certificate", async function () {
      // Store certificate first time
      await scvUIManager.connect(entity1).storeCertificate(entity1.address, testHash, testCid);

      // Try to store same certificate again
      await expect(
        scvUIManager.connect(entity1).storeCertificate(entity1.address, testHash, "QmDifferentCid")
      ).to.be.revertedWith("Certificate already exists");
    });
  });

  describe("Certificate Query Functions", function () {
    const testHash = ethers.keccak256(ethers.toUtf8Bytes("query test certificate"));
    const testCid = "QmQueryTest123";

    beforeEach(async function () {
      await scvUIManager.connect(owner).addWhiteListEntity(entity1.address);
      await scvUIManager.connect(entity1).storeCertificate(entity1.address, testHash, testCid);

    });

    it("Should return certificate info for existing certificate", async function () {
      const result = await scvUIManager.connect(entity1).getCertificateInfo(testHash);
      const receipt = await result.wait(); // Wait for the transaction to be mined
    
      expect(receipt.status).to.emit(scvUIManager, "CertificateQueriedCorrectly")
        .withArgs(entity1.address, testHash, testCid);

      const [exists, info] = await scvUIManager.connect(owner).getCertificateInfoView(testHash);

      expect(exists).to.be.true;
      expect(info).to.include("Timestamp: ");
      expect(info).to.include("Hash: ", testHash);
      expect(info).to.include("CID: " + testCid);
    });

    it("Should return false for non-existing certificate", async function () {
      const nonExistentHash = ethers.keccak256(ethers.toUtf8Bytes("non-existent"));
      await expect(
        scvUIManager.connect(entity1).getCertificateInfo(nonExistentHash)
      ).to.be.revertedWith("Certificate not found");
    });

    it("Should revert if storage manager not set", async function () {
      const SCVUIManager = await ethers.getContractFactory("SCV_UI_manager");
      const newContract = await SCVUIManager.deploy(owner.address);
      await newContract.waitForDeployment();

      await expect(
        newContract.getCertificateInfo(testHash)
      ).to.be.revertedWith("Storage manager not set");
    });
  });

  describe("Storage Manager Authorization", function () {
    it("Should only allow UI manager to add certificates to storage manager", async function () {
      const testHash = ethers.keccak256(ethers.toUtf8Bytes("direct test"));
      const testCid = "QmDirectTest";

      await expect(
        storageManager.connect(entity1).addCertificate(testCid, testHash)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should only allow UI manager to query certificates from storage manager", async function () {
      const testHash = ethers.keccak256(ethers.toUtf8Bytes("query test"));

      await expect(
        storageManager.connect(entity1).getCertificateInfoByHash(testHash)
      ).to.be.revertedWith("Not authorized");
    });
  });


  describe("Integration Tests", function () {
    it("Should handle complete workflow", async function () {
      const testHash = ethers.keccak256(ethers.toUtf8Bytes("integration test"));
      const testCid = "QmIntegrationTest123";
    
      // 1. Add entity to whitelist
      await scvUIManager.connect(owner).addWhiteListEntity(entity1.address);
    
      // 2. Store certificate
      await scvUIManager.connect(entity1).storeCertificate(entity1.address, testHash, testCid);
    
      // 3. Verify certificate exists through UI manager
      const result = await scvUIManager.connect(entity1).getCertificateInfo(testHash);
      const receipt = await result.wait(); // Wait for the transaction to be mined
    
      expect(receipt.status).to.equal(1);
      expect(receipt.events).to.emit("CertificateStored")
        .withArgs(entity1.address, testHash, testCid);

      const [exists, info] = await scvUIManager.connect(owner).getCertificateInfoView(testHash);

      expect(exists).to.be.true;
      expect(info).to.include(testCid);
    
      // 4. Remove entity from whitelist
      await scvUIManager.connect(owner).removeWhiteListEntity(entity1.address);
    
      // 5. Verify entity can no longer store certificates
      await expect(
        scvUIManager.connect(entity1).storeCertificate(
          entity1.address,
          ethers.keccak256(ethers.toUtf8Bytes("should fail")),
          "QmShouldFail"
        )
      ).to.be.revertedWith("Only whitelisted entity: not authorized");
    
      // 6. Verify existing certificate is still queryable
      const res = await scvUIManager.connect(entity1).getCertificateInfo(testHash);
      const rec = await res.wait(); // Wait for the transaction to be mined
    
      expect(rec.status).to.emit(scvUIManager, "CertificateQueriedCorrectly")
        .withArgs(entity1.address, testHash, testCid);

      const [stillExists] = await scvUIManager.connect(owner).getCertificateInfoView(testHash);

      expect(stillExists).to.be.true;
    });

    it("Should handle multiple entities and certificates", async function () {
      const hash1 = ethers.keccak256(ethers.toUtf8Bytes("cert1"));
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("cert2"));
      const cid1 = "QmCert1";
      const cid2 = "QmCert2";

      // Add both entities to whitelist
      await scvUIManager.connect(owner).addWhiteListEntity(entity1.address);
      await scvUIManager.connect(owner).addWhiteListEntity(entity2.address);

      // Store certificates from both entities
      await scvUIManager.connect(entity1).storeCertificate(entity1.address, hash1, cid1);
      await scvUIManager.connect(entity2).storeCertificate(entity2.address, hash2, cid2);

      // Query both certificates
      const result1 = await scvUIManager.connect(entity1).getCertificateInfo(hash1);
      const result2 = await scvUIManager.connect(entity2).getCertificateInfo(hash2);
      const receipt1 = await result1.wait(); // Wait for the transaction to be mined
      const receipt2 = await result2.wait(); // Wait for the transaction to be mined

      expect(receipt1.status).to.emit(scvUIManager, "CertificateStored")
        .withArgs(entity1.address, hash1, cid1);
      expect(receipt2.status).to.emit(scvUIManager, "CertificateStored")
        .withArgs(entity2.address, hash2, cid2);

      const [exists1, info1] = await scvUIManager.connect(owner).getCertificateInfoView(hash1);
      const [exists2, info2] = await scvUIManager.connect(owner).getCertificateInfoView(hash2);
      
      
      expect(exists1).to.be.true;
      expect(exists2).to.be.true;
      expect(info1).to.include(cid1);
      expect(info2).to.include(cid2);
    });

    it("Should maintain proper timestamps", async function () {
      const testHash = ethers.keccak256(ethers.toUtf8Bytes("timestamp test"));
      const testCid = "QmTimestampTest";

      await scvUIManager.connect(owner).addWhiteListEntity(entity1.address);
      
      const blockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
      await scvUIManager.connect(entity1).storeCertificate(entity1.address, testHash, testCid);
      
      const result = await scvUIManager.connect(entity1).getCertificateInfo(testHash);
      const receipt = await result.wait(); // Wait for the transaction to be mined
    
      expect(receipt.status).to.emit(scvUIManager, "CertificateStored")
        .withArgs(entity1.address, testHash, testCid);

      const [exists, info] = await scvUIManager.connect(owner).getCertificateInfoView(testHash);

      // info is a string, we need to parse it to extract the timestamp
      expect(exists).to.be.true;
      const timestampMatch = info.match(/Timestamp: (\d+)/);
      const timestamp = timestampMatch ? parseInt(timestampMatch[1], 10) : 0;
      expect(timestamp).to.be.gte(blockTimestamp);
    });
  });
});
