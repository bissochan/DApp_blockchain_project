const { expect, use } = require("chai");
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

        it("should not allow querying certificate info without enough tokens", async function () {
            const certificateHash = "Test Certificate 3";
            const ipfsCid = "QmTestCID3";

            // Ensure user2 is whitelisted
            if (await uiManager.certifiedWhitelisted(user2.address) === false) {
                await uiManager.addWhiteListEntity(user2.address);
                expect(await uiManager.certifiedWhitelisted(user2.address)).to.be.true;
            }

            // Store a certificate first
            await uiManager.connect(user2).storeCertificate(user2.address, certificateHash, ipfsCid);

            // Ensure user2 has less than TOKEN_PER_LOOKUP tokens
            const user2BalanceBefore = await tokenManager.balanceOf(user2.address);

            // if it has more than 10 tokens, burn some tokens for testing
            if (user2BalanceBefore >= 10n) {
                await uiManager.connect(owner).burnUserTokens(user2.address, 20n); // Burn 10 tokens for testing    
            }

            // Attempt to query the certificate info without enough tokens
            await expect(
                uiManager.connect(user2).getCertificateInfo(certificateHash)
            ).to.be.revertedWith("Insufficient tokens for lookup");
        });

        it ("should not allow querying non-existent certificate info", async function () {
            const nonExistentCertificateHash = "NonExistentCertificate";

            // Ensure user1 has enough tokens
            const user1BalanceBefore = await tokenManager.balanceOf(user1.address);

            if (user1BalanceBefore < 10n) {
                // If user1 has less than 10 tokens, mint more tokens for testing
                await uiManager.connect(owner).mintUserTokens(user1.address, 20n); // Mint 20 tokens for testing
            }

            // //print getCertificateInfoView function
            // const [exists, info] = await uiManager.getCertificateInfoView(nonExistentCertificateHash);
            
            // console.log("Certificate Exists:", exists);
            // console.log("Certificate Info:", info);

            // Attempt to query a non-existent certificate
            await expect(
                uiManager.connect(user1).getCertificateInfo(nonExistentCertificateHash)
            ).to.be.revertedWith("Certificate not found");
        });
    });

    describe("Token Management", function () {
        // Test for// === Token Management ===
        // function mintUserTokens(
        //     address _user,
        //     uint256 _amount
        // ) external onlyOwner returns (bool) {
        //     require(_user != address(0), "Invalid address");
        //     require(_amount > 0, "Amount must be greater than zero");

        //     return tokenManager.mint(_user, _amount);
        // }
        it("should allow owner to mint tokens for a user", async function () {
            const mintAmount = 100n; // Mint 100 tokens

            const user1BalanceBefore = await tokenManager.balanceOf(user1.address);

            await uiManager.connect(owner).mintUserTokens(user1.address, mintAmount);

            const user1BalanceAfter = await tokenManager.balanceOf(user1.address);
            expect(user1BalanceAfter).to.equal(user1BalanceBefore + mintAmount);
        });

        it("should not allow non-owner to mint tokens for a user", async function () {
            const mintAmount = 100n; // Mint 100 tokens

            await expect(
                uiManager.connect(user1).mintUserTokens(user2.address, mintAmount)
            ).to.be.revertedWith("Only owner: not authorized");
        });

        it("should not allow minting tokens to the zero address", async function () {
            const mintAmount = 100n; // Mint 100 tokens

            await expect(
                uiManager.connect(owner).mintUserTokens(ethers.ZeroAddress, mintAmount)
            ).to.be.revertedWith("Invalid address");
        });

        // Test for// function burnUserTokens(
        //     address _user,
        //     uint256 _amount
        // ) external onlyOwner returns (bool) {
        it("should allow owner to burn tokens from a user", async function () {
            const burnAmount = 50n; // Burn 50 tokens

            // Ensure user1 has enough tokens to burn
            let user1BalanceBefore = await tokenManager.balanceOf(user1.address);
            if (user1BalanceBefore < burnAmount) {
                await uiManager.connect(owner).mintUserTokens(user1.address, 100n); // Mint 100 tokens for testing
            }
            user1BalanceBefore = await tokenManager.balanceOf(user1.address); // Re-fetch balance after minting

            await uiManager.connect(owner).burnUserTokens(user1.address, burnAmount);

            const user1BalanceAfter = await tokenManager.balanceOf(user1.address);
            expect(user1BalanceAfter).to.equal(user1BalanceBefore - burnAmount);
        });

        it("should not allow non-owner to burn tokens from a user", async function () {
            const burnAmount = 50n; // Burn 50 tokens

            // Ensure user2 has enough tokens to burn
            const user2BalanceBefore = await tokenManager.balanceOf(user2.address);
            if (user2BalanceBefore < burnAmount) {
                await uiManager.connect(owner).mintUserTokens(user2.address, 100n); // Mint 100 tokens for testing
            }

            await expect(
                uiManager.connect(user1).burnUserTokens(user2.address, burnAmount)
            ).to.be.revertedWith("Only owner: not authorized");
        });

        it("should not allow burning tokens from the zero address", async function () {
            const burnAmount = 50n; // Burn 50 tokens

            await expect(
                uiManager.connect(owner).burnUserTokens(ethers.ZeroAddress, burnAmount)
            ).to.be.revertedWith("Invalid address");
        });
    });

    describe("New User", function () {
        // when a new user is added, it receives some tokens as a welcome gift
        // function newUser(
        //     address _user
        // ) external onlyOwner returns (bool) {
        //     require(_user != address(0), "Invalid user address");
        //     require(
        //         tokenManager.balanceOf(_user) == 0,
        //         "User already has tokens"
        //     );

        //     // Mint initial tokens for the new user
        //     return tokenManager.mint(_user, TOKEN_INITIAL_PER_USER);
        // }
        it("should allow owner to add a new user and mint initial tokens", async function () {
            const newUserAddress = user2.address; // Use user2 as the new user

            // Ensure user2 has no tokens before adding
            const user2BalanceBefore = await tokenManager.balanceOf(newUserAddress);
            expect(user2BalanceBefore).to.equal(0n);

            // Add new user
            await uiManager.connect(owner).newUser(newUserAddress);

            // Check if the new user received initial tokens
            const user2BalanceAfter = await tokenManager.balanceOf(newUserAddress);
            expect(user2BalanceAfter).to.equal(100n * 10n ** 0n); // Assuming 100 tokens as initial per user
        });

        it("should not allow non-owner to add a new user", async function () {
            const newUserAddress = user2.address; // Use user2 as the new user

            await expect(
                uiManager.connect(user1).newUser(newUserAddress)
            ).to.be.revertedWith("Only owner: not authorized");
        });

        it("should not allow adding a new user with zero address", async function () {
            await expect(
                uiManager.connect(owner).newUser(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid user address");
        });

        it("should not allow adding a user who already has tokens", async function () {
            const newUserAddress = user1.address; // Use user1 as the new user

            // Ensure user1 has some tokens before adding
            const user1BalanceBefore = await tokenManager.balanceOf(newUserAddress);
            if (user1BalanceBefore === 0n) {
                await uiManager.connect(owner).newUser(newUserAddress); // Mint initial tokens for user1
            }

            // Attempt to add user1 again
            await expect(
                uiManager.connect(owner).newUser(newUserAddress)
            ).to.be.revertedWith("User already has tokens");
        });

    });

    describe("Storage Management", function () {
        // function getAllCertificates() external view onlyOwner returns (string memory) {
        //     // This function should return all certificate hashes stored in the storage manager
        //     // Assuming the storage manager has a function to get all certificates
        //     // This is a placeholder, actual implementation may vary based on storage manager design
        //     return storageManager.getAllCertificates();
        // }

        it("should allow the owner to see all certificates if not empty", async function () {
            // Ensure user1 is whitelisted and has stored a certificate
            const certificateHash = "Test Certificate 4";
            const ipfsCid = "QmTestCID4";

            if (await uiManager.certifiedWhitelisted(user1.address) === false) {
                await uiManager.addWhiteListEntity(user1.address);
                expect(await uiManager.certifiedWhitelisted(user1.address)).to.be.true;
            }
            await uiManager.connect(user1).storeCertificate(user1.address, certificateHash, ipfsCid);
            // Call the function to get all certificates
            const allCertificates = await uiManager.connect(owner).getAllCertificates();
            // Check if the stored certificate is in the returned string
            expect(allCertificates).to.include(ipfsCid);
        });

        it("should allow the owner to see all certificates if empty", async function () {
            // Call the function to get all certificates when no certificates are stored
            const allCertificates = await uiManager.connect(owner).getAllCertificates();
            // Check if the returned string is empty or contains a specific message
            expect(allCertificates).to.equal("No certificates found");
        });

        it("should not allow non-owner to see all certificates", async function () {
            await expect(uiManager.connect(user1).getAllCertificates())
                .to.be.revertedWith("Only owner: not authorized");
        });

        it("should allow the owner to get the number of certificates", async function () {
            await expect(uiManager.connect(owner).getNumCertificates())
                .to.not.be.reverted;
        });

        it("should not allow non-owner to get the number of certificates", async function () {
            await expect(uiManager.connect(user1).getNumCertificates())
                .to.be.revertedWith("Only owner: not authorized");
        });

        it("should allow the owner to get certificate info by Hash without paying token", async function () {
            const certificateHash = "some_certificate_hash";

            //publish a certificate first
            const ipfsCid = "QmTestCID4";

            // Ensure user1 is whitelisted
            if (await uiManager.certifiedWhitelisted(user1.address) === false) {
                await uiManager.addWhiteListEntity(user1.address);
                expect(await uiManager.certifiedWhitelisted(user1.address)).to.be.true;
            }

            // Store certificate
            await uiManager.connect(user1).storeCertificate(user1.address, certificateHash, ipfsCid);

            // Get certificate info without paying tokens
            const [exists, info] = await uiManager.getCertificateInfoView(certificateHash);
            expect(exists).to.be.true;
            expect(info).to.include("Timestamp: ");
            expect(info).to.include("Hash: ");
            expect(info).to.include("CID: " + ipfsCid);
        });

        it("should not allow non-owner to get certificate info by Hash without paying token", async function () {
            const certificateHash = "some_certificate_hash";

            await expect(uiManager.connect(user1).getCertificateInfoView(certificateHash))
                .to.be.revertedWith("Only owner: not authorized");
        });

    });

});
