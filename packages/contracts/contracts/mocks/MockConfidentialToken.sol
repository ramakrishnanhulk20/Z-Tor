// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";

/// @title Mintable ERC-7984 confidential token for tests
contract MockConfidentialToken is ERC7984, ZamaEthereumConfig {
    constructor() ERC7984("Mock Confidential", "mCT", "") {}

    function mint(address to, uint64 amount) external {
        euint64 enc = FHE.asEuint64(amount);
        FHE.allowThis(enc);
        _mint(to, enc);
    }
}
