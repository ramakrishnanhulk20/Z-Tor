// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title Official pool directory
/// @notice Maps human-readable pool ids (e.g. "eth-0.1") to pool addresses
/// so the web app discovers deployments from a single address.
contract ZTorRegistry is Ownable {
    mapping(bytes32 => address) private _pools;
    string[] private _poolIds;
    mapping(address => bool) public registrars;

    event PoolRegistered(string poolId, address indexed pool);
    event RegistrarUpdated(address indexed account, bool allowed);

    error PoolAlreadyRegistered();
    error ZeroPool();
    error UnknownPool();
    error UnauthorizedRegistrar();

    constructor() Ownable(msg.sender) {}

    function setRegistrar(address account, bool allowed) external onlyOwner {
        registrars[account] = allowed;
        emit RegistrarUpdated(account, allowed);
    }

    function register(string calldata poolId, address pool) external {
        if (msg.sender != owner() && !registrars[msg.sender]) revert UnauthorizedRegistrar();
        if (pool == address(0)) revert ZeroPool();
        bytes32 key = keccak256(bytes(poolId));
        if (_pools[key] != address(0)) revert PoolAlreadyRegistered();
        _pools[key] = pool;
        _poolIds.push(poolId);
        emit PoolRegistered(poolId, pool);
    }

    /// @notice Replace a pool address after a redeploy (owner only).
    function setPool(string calldata poolId, address pool) external onlyOwner {
        if (pool == address(0)) revert ZeroPool();
        bytes32 key = keccak256(bytes(poolId));
        if (_pools[key] == address(0)) revert UnknownPool();
        _pools[key] = pool;
        emit PoolRegistered(poolId, pool);
    }

    function poolExists(string calldata poolId) external view returns (bool) {
        return _pools[keccak256(bytes(poolId))] != address(0);
    }

    function poolFor(string calldata poolId) external view returns (address) {
        address pool = _pools[keccak256(bytes(poolId))];
        if (pool == address(0)) revert UnknownPool();
        return pool;
    }

    function allPoolIds() external view returns (string[] memory) {
        return _poolIds;
    }
}
