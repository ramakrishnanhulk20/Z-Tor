// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;



import {FHE, ebool, euint32} from "@fhevm/solidity/lib/FHE.sol";

import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IZTorLiquidityStats} from "./interfaces/IZTorLiquidityStats.sol";



/// @title Encrypted per-pool liquidity counter (FHE layer)

/// @notice Tracks the number of unspent notes per pool as an encrypted

/// euint32. Only the owner is granted decryption rights — there is no

/// global backdoor and no encrypted value is ever emitted in events.

contract ZTorLiquidityStats is IZTorLiquidityStats, ZamaEthereumConfig, Ownable {

    mapping(address => bool) public registeredPools;

    mapping(address => bool) public registrars;

    mapping(address => euint32) private _activeNotes;



    event PoolRegistered(address indexed pool);

    event RegistrarUpdated(address indexed account, bool allowed);



    error NotRegisteredPool();

    error AlreadyRegistered();

    error UnauthorizedRegistrar();



    modifier onlyPool() {

        if (!registeredPools[msg.sender]) revert NotRegisteredPool();

        _;

    }



    constructor() Ownable(msg.sender) {}



    function setRegistrar(address account, bool allowed) external onlyOwner {

        registrars[account] = allowed;

        emit RegistrarUpdated(account, allowed);

    }



    function registerPool(address pool) external {

        if (msg.sender != owner() && !registrars[msg.sender]) revert UnauthorizedRegistrar();

        if (registeredPools[pool]) revert AlreadyRegistered();

        registeredPools[pool] = true;

        emit PoolRegistered(pool);

    }



    function recordDeposit() external override onlyPool {

        euint32 count = _activeNotes[msg.sender];

        if (!FHE.isInitialized(count)) {

            count = FHE.asEuint32(0);

        }

        count = FHE.add(count, 1);

        _activeNotes[msg.sender] = count;

        FHE.allowThis(count);

        FHE.allow(count, owner());

        FHE.makePubliclyDecryptable(count);

    }



    function recordWithdraw() external override onlyPool {

        euint32 count = _activeNotes[msg.sender];

        if (!FHE.isInitialized(count)) {

            count = FHE.asEuint32(0);

        }

        ebool hasNotes = FHE.gt(count, FHE.asEuint32(0));

        count = FHE.select(hasNotes, FHE.sub(count, 1), FHE.asEuint32(0));

        _activeNotes[msg.sender] = count;

        FHE.allowThis(count);

        FHE.allow(count, owner());

        FHE.makePubliclyDecryptable(count);

    }



    /// @notice Encrypted handle of the active-note count for `pool`.

    function activeNotes(address pool) external view returns (euint32) {

        return _activeNotes[pool];

    }

}

