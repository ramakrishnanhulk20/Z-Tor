// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ZTorConfidentialPool} from "./ZTorConfidentialPool.sol";
import {ZTorLiquidityStats} from "./ZTorLiquidityStats.sol";
import {ZTorRegistry} from "./ZTorRegistry.sol";
import {IZTorVerifier} from "./interfaces/IZTorVerifier.sol";

/// @title Permissionless pool factory for custom denominations
/// @notice Anyone can spin up a new fixed-denomination pool. Each amount
/// gets its own anonymity set — the UI should warn that privacy is weaker
/// until the pool sees more deposits.
contract ZTorPoolFactory {
    using Strings for uint256;

    /// @dev Denominations are confidential-token units (6 decimals).
    uint256 public constant MIN_ETH = 10_000; // 0.01 WETH after wrap
    uint256 public constant MAX_ETH = 10_000_000; // 10 WETH
    uint256 public constant MIN_USDC = 1_000_000; // 1 USDC
    uint256 public constant MAX_USDC = 100_000_000_000; // 100,000 USDC

    ZTorRegistry public immutable registry;
    ZTorLiquidityStats public immutable stats;
    IZTorVerifier public immutable verifier;
    IERC7984 public immutable cWeth;
    IERC7984 public immutable cUsdc;
    uint256 public immutable anonymityDelay;
    uint32 public immutable treeLevels;

    event PoolCreated(string poolId, address indexed pool, uint256 denomination);

    error DenominationOutOfRange();
    error PoolAlreadyExists();

    constructor(
        ZTorRegistry _registry,
        ZTorLiquidityStats _stats,
        IZTorVerifier _verifier,
        IERC7984 _cWeth,
        IERC7984 _cUsdc,
        uint256 _anonymityDelay,
        uint32 _treeLevels
    ) {
        registry = _registry;
        stats = _stats;
        verifier = _verifier;
        cWeth = _cWeth;
        cUsdc = _cUsdc;
        anonymityDelay = _anonymityDelay;
        treeLevels = _treeLevels;
    }

    function createEthPool(uint256 denomination) external returns (address pool) {
        if (denomination < MIN_ETH || denomination > MAX_ETH) revert DenominationOutOfRange();
        string memory poolId = string.concat("eth-", denomination.toString());
        if (registry.poolExists(poolId)) revert PoolAlreadyExists();

        pool = address(
            new ZTorConfidentialPool(
                verifier,
                stats,
                cWeth,
                denomination,
                anonymityDelay,
                treeLevels
            )
        );
        registry.register(poolId, pool);
        stats.registerPool(pool);
        emit PoolCreated(poolId, pool, denomination);
    }

    function createUsdcPool(uint256 denomination) external returns (address pool) {
        if (denomination < MIN_USDC || denomination > MAX_USDC) revert DenominationOutOfRange();
        string memory poolId = string.concat("usdc-", denomination.toString());
        if (registry.poolExists(poolId)) revert PoolAlreadyExists();

        pool = address(
            new ZTorConfidentialPool(
                verifier,
                stats,
                cUsdc,
                denomination,
                anonymityDelay,
                treeLevels
            )
        );
        registry.register(poolId, pool);
        stats.registerPool(pool);
        emit PoolCreated(poolId, pool, denomination);
    }
}
