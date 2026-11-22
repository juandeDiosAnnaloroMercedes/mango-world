// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MANGO Coin
/// @notice Fixed-supply ERC-20 for the independent MANGO WORLD project.
/// @dev All supply is minted once to an explicitly selected initial holder.
///      There is no owner, public mint, pause, blacklist, or upgrade function.
contract MangoCoin is ERC20 {
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10 ** 18;

    constructor(address initialHolder) ERC20("MANGO Coin", "MANGO") {
        require(initialHolder != address(0), "MangoCoin: zero initial holder");
        _mint(initialHolder, MAX_SUPPLY);
    }
}
