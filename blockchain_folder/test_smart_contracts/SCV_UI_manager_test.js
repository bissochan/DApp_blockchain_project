const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SCV_UI_manager", function () {
  let owner, user1, user2;

  // AAA IMPORTANT:
    // UI_Manager is the main contract that manages the UI and links to other contracts
    // Storage_Manager is responsible for storing certificates and other data the owner is the UI_Manager
    // Token_Manager is responsible for managing the token system, including minting and transferring tokens
    // The UI_Manager contract is the owner of both Storage_Manager and Token_Manager
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
      0, 
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
        expect(totalSupply).to.equal(1000n * 10n ** 0n); // 1000 tokens with 3 decimals
    });

    it("should have correct token name and symbol", async function () {
        expect(await tokenManager.name()).to.equal("SCV Token");
        expect(await tokenManager.symbol()).to.equal("SCVT");
    });

    it("should have correct token decimals", async function () {
        expect(await tokenManager.decimals()).to.equal(0);
    });

    it("should have correct initial owner balance", async function () {
        const ownerBalance = await tokenManager.balanceOf(uiManager.getAddress());
        expect(ownerBalance).to.equal(1000n * 10n ** 0n); // The owner contract (UI_manager) should have all tokens initially
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

    describe("Certificate Publishing", function () {
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
                // console.error("User1 is not whitelisted, adding to whitelist.");
                await uiManager.addWhiteListEntity(user1.address);
                expect(await uiManager.certifiedWhitelisted(user1.address)).to.be.true;
            }


            // Store certificate
            await expect(
                uiManager.connect(user1).storeCertificate(user1.address, certificateHash, ipfsCid)
            ).to.emit(uiManager, "CertificateStored")
              .withArgs(user1.address, certificateHash, ipfsCid);

              
            // allCertificateInfo = await uiManager.getAllCertificates();
            // console.log("All Certificate Info:", allCertificateInfo);
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

        it("should grant reward tokens for storing certificate", async function () {
            // TOKEN_PER_REWARD is defined in the contract, it is 20 tokens per reward, declared as a constant bigint
            const TOKEN_PER_REWARD = 20n * 10n ** 0n; // 20 tokens with 0 decimals

            // Ensure user1 has a balance before storing the certificate, debug balances
            // console.log("User1 Address:", user1.address);
            // console.log("UI Manager Address:", await uiManager.getAddress());
            let user1BalanceBefore = await tokenManager.connect(user1).balanceOf(user1.address);

            const certificateHash = "Test Certificate";
            const ipfsCid = "QmTestCID";

            // Ensure user1 is whitelisted
            if (await uiManager.certifiedWhitelisted(user1.address) === false) {
                await uiManager.addWhiteListEntity(user1.address);
                expect(await uiManager.certifiedWhitelisted(user1.address)).to.be.true;
            }

            // Store certificate
            await uiManager.connect(user1).storeCertificate(user1.address, certificateHash, ipfsCid);

            // Check user1's balance after storing the certificate4
            try {
                user1BalanceAfter = await tokenManager.connect(user1).balanceOf(user1.address);
            }catch (error) {
                console.error("Error fetching user1 balance after storing certificate:", error);
            }
            // // print balances for debugging
            // console.log("User1 Balance Before:", user1BalanceBefore.toString());
            // console.log("User1 Balance After:", user1BalanceAfter.toString());

            // // print types of balances
            // console.log("User1 Balance Before Type:", typeof user1BalanceBefore);
            // console.log("User1 Balance After Type:", typeof user1BalanceAfter);

            // Check if the balance increased by TOKEN_PER_REWARD
            expect(user1BalanceAfter).to.equal(user1BalanceBefore + TOKEN_PER_REWARD);
        });
    });

    describe("Buying Tokens", function () {
        //  test for// === Buying Tokens ===
            /*
            // buy tokens with ether
        function buyTokens() external payable returns (bool) {
            require(msg.value > 0, "Send some ether to buy tokens");
            require(address(tokenManager) != address(0), "Token manager not set");

            // Calculate the number of tokens to mint based on the ether sent
            uint256 tokensToMint = (msg.value * TOKEN_PER_ETHER) / 1 ether;

            // Mint tokens for the sender
            return tokenManager.mint(msg.sender, tokensToMint);
        }
            */

        it("should receive Ether and transfer correct tokens", async () => {
            const ethersAmount = 1.0
            const amountToSend = ethers.parseEther(ethersAmount.toString()); // 0.1 ETH

            // Ensure user1 has a balance before buying tokens, debug balances
            let user1BalanceBefore = await tokenManager.balanceOf(user1.address);

            // 💬 Balance BEFORE
            const balanceBefore = await ethers.provider.getBalance(uiManager.getAddress());
            // print balance before for debugging
            // console.log("🟡 Contract balance BEFORE:", ethers.formatEther(balanceBefore), "ETH");

            // Execute buyTokens from user
            const tx = await uiManager.connect(user1).buyTokens({ value: amountToSend });
            await tx.wait();

            // 💬 Balance AFTER
            const balanceAfter = await ethers.provider.getBalance(uiManager.getAddress());
            // print balance after for debugging
            // console.log("🟢 Contract balance AFTER:", ethers.formatEther(balanceAfter), "ETH");

            // ✅ Assert that balance increased by ~0.1 ETH
            expect(balanceAfter - balanceBefore).to.equal(amountToSend);

            // Check if user1 received the correct amount of tokens
            const tokensPerEther = 10000n; // Assuming 10,000 tokens per ether, adjust as per your contract logic
            const expectedTokens = BigInt(ethersAmount) * tokensPerEther
            const user1BalanceAfter = await tokenManager.balanceOf(user1.address);  

            // // print user1 balance after for debugging
            // console.log("🟢 User1 balance AFTER:", user1BalanceAfter.toString()
            // );
            
            // Check if the user balance increased by the expected amount
            // expect(user1BalanceAfter).to.equal(expectedTokens);
            expect(user1BalanceAfter).to.equal(user1BalanceBefore + expectedTokens, "User1 balance did not increase by the expected amount of tokens");
        });

        // it("should allow user to buy tokens with ether", async function () {
        //     const userBalanceBefore = await tokenManager.balanceOf(user1.address);

        //     const contractBalanceBefore = await ethers.provider.getBalance(await uiManager.getAddress());

        //     const etherToSend = 1.0; // 1 ether

        //     const tokensPerEther = 10000n; // Assuming 10 tokens per ether, adjust as per your contract logic

        //     // User buys tokens
        //     await uiManager.connect(user1).buyTokens({ value: ethers.parseEther(etherToSend.toString()) });

        //     // Calculate expected tokens to be minted
        //     const expectedTokens = BigInt(etherToSend) * tokensPerEther;

        //     // Check if the user balance increased by the expected amount
        //     const userBalanceAfter = await tokenManager.balanceOf(user1.address);

        //     expect(userBalanceAfter).to.equal(userBalanceBefore + expectedTokens);

        //     // Optionally, check if the contract's balance increased
        //     const contractBalanceAfter = await ethers.provider.getBalance(await uiManager.getAddress());

        //     console.log("Contract Balance Before:", contractBalanceBefore.toString());
        //     console.log("Contract Balance After:", contractBalanceAfter.toString());
        //     console.log("Ether Sent:", ethers.parseEther(etherToSend.toString()).toString());

        //     expect(contractBalanceAfter).to.equal(contractBalanceBefore + ethers.parseEther(etherToSend.toString()));
        // });

        it("should not allow buying tokens with zero ether", async function () {
            await expect(
                uiManager.connect(user1).buyTokens({ value: 0 })
            ).to.be.revertedWith("Send some ether to buy tokens");
        });
    });
    describe("Certificate Querying", function () {
        // Test for// === Certificate Querying ===
        //     function getCertificateInfo(
        //     string memory _certificateHash
        // ) external storageManagerSet returns (bool, string memory) {
        //     // Convert string to bytes32 for consistency with storage manager
        //     bytes32 _certificateHash = keccak256(abi.encodePacked(_certificateHash));

        //     // Ensure the storage manager is set before querying
        //     require(address(storageManager) != address(0), "Storage manager not set");
        //     require(_certificateHash != bytes32(0), "Invalid certificate hash");
            
        //     // Check if the token manager is set and if the user has enough tokens
        //     require(address(tokenManager) != address(0), "Token manager not set");
        //     // Check if the user has enough tokens for the lookup
        //     require(
        //             tokenManager.balanceOf(msg.sender) >= TOKEN_PER_LOOKUP,
        //             "Insufficient tokens for lookup"
        //     );
        //     // send tokens to the contract
        //     tokenManager.transferFrom(msg.sender, address(this), TOKEN_PER_LOOKUP);
        

        //     return storageManager.getCertificateInfoByHash(_certificateHash);
        // }
        it("should allow entity to query certificate info by paying tokens", async function () {
            const certificateHash = "Test Certificate 2";
            const ipfsCid = "QmTestCID2";

            // Ensure user1 is whitelisted
            if (await uiManager.certifiedWhitelisted(user1.address) === false) {
                await uiManager.addWhiteListEntity(user1.address);
                expect(await uiManager.certifiedWhitelisted(user1.address)).to.be.true;
            }

            // Store a certificate first
            await uiManager.connect(user1).storeCertificate(user1.address, certificateHash, ipfsCid);

            // Query the certificate info
            // Should return true and this: string memory certInfo = string(
            //     abi.encodePacked(
            //         "Timestamp: ",
            //         uint2str(cert.timestamp),
            //         ", Hash: ",
            //         bytes32ToHexString(cert.certificateHash),
            //         ", CID: ", cert.ipfsCid
            //     )
            // );
            
            // allCertificateInfo = await uiManager.getAllCertificates();
            // console.log("All Certificate Info:", allCertificateInfo);

            // numberOfCertificates = await uiManager.getNumCertificates();
            // console.log("Number of Certificates:", numberOfCertificates.toString());

            //get the balance of uiManager contract
            // const uiManagerBalanceBefore = await tokenManager.balanceOf(await uiManager.getAddress());
            // console.log("UI Manager Balance Before:", uiManagerBalanceBefore.toString());

            // Get the user balance before the lookup
            const userBalanceBefore = await tokenManager.balanceOf(user1.address);

            if (userBalanceBefore < 10n) {
                // If user1 has less than 10 tokens, mint more tokens for testing
                await tokenManager.connect(owner).mint(user1.address, 20n); // Mint 20 tokens for testing
            }


            // Call the transaction (no return tuple)
            const tx = await uiManager.connect(user1).getCertificateInfo(certificateHash);
            await tx.wait();

            // Then call a separate view function to get the actual certificate info
            const [exists, info] = await uiManager.getCertificateInfoView(certificateHash);

            expect(exists).to.be.true;
            expect(info).to.include("Timestamp: ");
            expect(info).to.include("Hash: ");
            expect(info).to.include("CID: " + ipfsCid);

            const TOKEN_PER_LOOKUP = 10n; // Assuming 10 tokens per lookup, adjust as per your contract logic
            const userBalanceAfter = await tokenManager.balanceOf(user1.address);
            // Check if the user balance decreased by TOKEN_PER_LOOKUP
            expect(userBalanceAfter).to.equal(
                userBalanceBefore - TOKEN_PER_LOOKUP,
                "User1 balance did not decrease by the expected amount of tokens"
            );

        });
    });
});
