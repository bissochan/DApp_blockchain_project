const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SCV_UI_manager", function () {
  let owner, user1, user2;
  let UIManager, uiManager;
  let StorageManager, storageManager;
  let TokenManager, tokenManager;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // 1. Deploy UI Manager with owner address
    UIManager = await ethers.getContractFactory("SCV_UI_manager");
    uiManager = await UIManager.deploy(owner.address);
    await uiManager.waitForDeployment(); // Updated for ethers v6

    // 2. Deploy Storage Manager with UI manager as owner
    StorageManager = await ethers.getContractFactory("SCV_storage_manager");
    storageManager = await StorageManager.deploy(await uiManager.getAddress()); // Updated for ethers v6
    await storageManager.waitForDeployment(); // Updated for ethers v6

    // 3. Deploy Token Manager with UI manager as owner
    // constructor parameters: name, symbol, decimals, initial supply, UI manager address
    TokenManager = await ethers.getContractFactory("SCV_token_manager");
    tokenManager = await TokenManager.deploy(
      "SCV Token", 
      "SCVT", 
      3, 
      1000, 
      await uiManager.getAddress() // Updated for ethers v6
    );
    await tokenManager.waitForDeployment(); // Updated for ethers v6

    // 4. Link contracts to UI Manager
    await uiManager.setStorageManager(await storageManager.getAddress()); // Updated for ethers v6
    await uiManager.setTokenManager(await tokenManager.getAddress()); // Updated for ethers v6

    // 5. Set initial whitelisted entity (owner, user1, or user2)
    // Assuming we want to whitelist the owner for initial setup
    await uiManager.addWhiteListEntity(owner.address);
  });

describe("Deployment", function () {
    it("should set the correct owner of UI manager", async function () {
    expect(await uiManager.owner()).to.equal(owner.address);
    });

    it("should set UI manager as owner in storage manager", async function () {
    expect(await storageManager.owner()).to.equal(await uiManager.getAddress());
    });

    it("should set UI manager as owner in token manager", async function () {
    expect(await tokenManager.owner()).to.equal(await uiManager.getAddress());
    });

    it("should link storage and token managers correctly", async function () {
    expect(await uiManager.storageManager()).to.equal(await storageManager.getAddress());
    expect(await uiManager.tokenManager()).to.equal(await tokenManager.getAddress());
    });

    it ("should have correct initial token supply", async function () {
        const totalSupply = await tokenManager.totalSupply();
        expect(totalSupply).to.equal(1000n * 10n ** 3n); // 1000 tokens with 3 decimals
    });

    it("should have correct token name and symbol", async function () {
        expect(await tokenManager.name()).to.equal("SCV Token");
        expect(await tokenManager.symbol()).to.equal("SCVT");
    });

    it("should have correct token decimals", async function () {
        expect(await tokenManager.decimals()).to.equal(3);
    });

    it("should have correct initial owner balance", async function () {
        const ownerBalance = await tokenManager.balanceOf(uiManager.getAddress());
        expect(ownerBalance).to.equal(1000n * 10n ** 3n); // The owner contract (UI_manager) should have all tokens initially
    });
});

describe("Access Control", function () {

    it("should allow only owner to set storage manager", async function () {
        await expect(
        uiManager.connect(user1).setStorageManager(user1.address)
        ).to.be.revertedWith("Only owner: not authorized");
    
        await uiManager.setStorageManager(user1.address);
        expect(await uiManager.storageManager()).to.equal(user1.address);
    });
    
    it("should allow only owner to set token manager", async function () {
        await expect(
        uiManager.connect(user1).setTokenManager(user1.address)
        ).to.be.revertedWith("Only owner: not authorized");
    
        await uiManager.setTokenManager(user1.address);
        expect(await uiManager.tokenManager()).to.equal(user1.address);
    });

    // test for : function addWhiteListEntity( 
    //     address _entity
    // ) external onlyOwner returns (bool) {
    //     require(_entity != address(0), "Invalid address");
    //     require(!_certifiedWhitelisted[_entity], "Entity already whitelisted");

    //     _certifiedWhitelisted[_entity] = true;
    //     emit EntityWhitelisted(_entity);
    //     return true;
    // }
    it("should allow only owner to add whitelisted entity", async function () {
        await expect(
            uiManager.connect(user1).addWhiteListEntity(user1.address)
        ).to.be.revertedWith("Only owner: not authorized");

        await uiManager.addWhiteListEntity(user1.address);
        expect(await uiManager.certifiedWhitelisted(user1.address)).to.be.true;
    });

    // test for : function removeWhiteListEntity(function removeWhiteListEntity(
    //     address _entity
    // ) external onlyOwner returns (bool) {
    //     require(_certifiedWhitelisted[_entity], "Entity not in whitelist");

    //     delete _certifiedWhitelisted[_entity];
    //     emit EntityRemovedFromWhitelist(_entity);
    //     return true;
    // }
        it("should allow only owner to remove whitelisted entity", async function () {
            if (await uiManager.certifiedWhitelisted(user1.address) === false) {
                await uiManager.addWhiteListEntity(user1.address);
                expect(await uiManager.certifiedWhitelisted(user1.address)).to.be.true;
            }
            await expect(
                uiManager.connect(user1).removeWhiteListEntity(user1.address)
            ).to.be.revertedWith("Only owner: not authorized");

            await uiManager.removeWhiteListEntity(user1.address);
            expect(await uiManager.certifiedWhitelisted(user1.address)).to.be.false;
     });
    });

    describe("Functionality", function () {
        // Test for// === Certificate Publishing ===
        // function storeCertificate(
        //     address _entity,
        //     string memory _certificateHash,
        //     string memory _ipfsCid
        // ) public onlyWhitelistedEntity storageManagerSet returns (bool) {
        //     require(_entity == msg.sender, "Entity mismatch");
        //     require(bytes(_ipfsCid).length > 0, "Empty CID");
        //     require(_certificateHash != bytes32(0), "Invalid hash");

        //     // Forward to storage manager (returns uint256 ID)
        //     uint256 certId = storageManager.addCertificate(
        //         _ipfsCid,
        //         _certificateHash
        //     );

        //     emit CertificateStored(_entity, _certificateHash, _ipfsCid);

        //     // Reward the entity with tokens for storing the certificate
        //     if (address(tokenManager) != address(0)) {
        //         tokenManager.mint(_entity, TOKEN_PER_REWARD);
        //     }

        //     return true;
        // }
        it("should allow whitelisted entity to store certificate", async function () {
            const certificateHash = "Test Certificate";
            const ipfsCid = "QmTestCID";

            // Ensure user1 is whitelisted
            try {
                expect(await uiManager.certifiedWhitelisted(user1.address)).to.be.true;
            } catch (error) {
                console.error("User1 is not whitelisted, adding to whitelist.");
                await uiManager.addWhiteListEntity(user1.address);
                expect(await uiManager.certifiedWhitelisted(user1.address)).to.be.true;
            }
            // Store certificate
            await expect(
                uiManager.connect(user1).storeCertificate(user1.address, certificateHash, ipfsCid)
            ).to.emit(uiManager, "CertificateStored")
              .withArgs(user1.address, certificateHash, ipfsCid);
        });

        it("should not allow non-whitelisted entity to store certificate", async function () {
            const certificateHash = "Test Certificate";
            const ipfsCid = "QmTestCID";

            // Ensure user2 is not whitelisted
            expect(await uiManager.certifiedWhitelisted(user2.address)).to.be.false;

            // Attempt to store certificate
            await expect(
                uiManager.connect(user2).storeCertificate(user2.address, certificateHash, ipfsCid)
            ).to.be.revertedWith("Only whitelisted entity: not authorized");
        });
    });
});
