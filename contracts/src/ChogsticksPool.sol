// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title ChogsticksPool
/// @notice Pays $CHOG to Chog Genesis holders for how much their Chog was used as a sticker.
/// Usage is counted off-chain and settled weekly: the poster commits a merkle root of
/// (epoch, tokenId, amount) per epoch, and whoever owns the token at claim time collects.
/// The poster can only allocate pool funds to tokens. It cannot withdraw anything.
contract ChogsticksPool {
    using SafeERC20 for IERC20;

    IERC721 public immutable chog;
    IERC20 public immutable chogToken;
    address public immutable poster;

    mapping(uint256 epoch => bytes32) public roots;
    mapping(uint256 epoch => uint256) public epochRemaining;
    mapping(uint256 epoch => mapping(uint256 tokenId => bool)) public claimed;
    /// @notice $CHOG committed to posted epochs and not yet claimed.
    uint256 public allocated;

    event Funded(address indexed from, uint256 amount);
    event RootPosted(uint256 indexed epoch, bytes32 root, uint256 total);
    event Claimed(uint256 indexed epoch, uint256 indexed tokenId, address indexed owner, uint256 amount);

    error NotPoster();
    error RootAlreadyPosted();
    error EmptyRoot();
    error InsufficientPool();
    error NoRoot();
    error AlreadyClaimed();
    error NotTokenOwner();
    error InvalidProof();
    error EpochOverdrawn();

    constructor(IERC721 chog_, IERC20 chogToken_, address poster_) {
        chog = chog_;
        chogToken = chogToken_;
        poster = poster_;
    }

    /// @notice Anyone can top up the pool.
    function fund(uint256 amount) external {
        chogToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Funded(msg.sender, amount);
    }

    /// @notice $CHOG in the pool that no epoch has claimed a share of yet.
    function unallocated() public view returns (uint256) {
        return chogToken.balanceOf(address(this)) - allocated;
    }

    function postRoot(uint256 epoch, bytes32 root, uint256 total) external {
        if (msg.sender != poster) revert NotPoster();
        if (roots[epoch] != bytes32(0)) revert RootAlreadyPosted();
        if (root == bytes32(0)) revert EmptyRoot();
        if (total > unallocated()) revert InsufficientPool();
        roots[epoch] = root;
        epochRemaining[epoch] = total;
        allocated += total;
        emit RootPosted(epoch, root, total);
    }

    function claim(uint256 epoch, uint256 tokenId, uint256 amount, bytes32[] calldata proof) public {
        bytes32 root = roots[epoch];
        if (root == bytes32(0)) revert NoRoot();
        if (claimed[epoch][tokenId]) revert AlreadyClaimed();
        if (chog.ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(epoch, tokenId, amount))));
        if (!MerkleProof.verifyCalldata(proof, root, leaf)) revert InvalidProof();
        if (amount > epochRemaining[epoch]) revert EpochOverdrawn();

        claimed[epoch][tokenId] = true;
        epochRemaining[epoch] -= amount;
        allocated -= amount;
        chogToken.safeTransfer(msg.sender, amount);
        emit Claimed(epoch, tokenId, msg.sender, amount);
    }

    struct ClaimInput {
        uint256 epoch;
        uint256 tokenId;
        uint256 amount;
        bytes32[] proof;
    }

    /// @notice Claim several (epoch, token) shares in one transaction.
    function claimMany(ClaimInput[] calldata items) external {
        for (uint256 i = 0; i < items.length; i++) {
            claim(items[i].epoch, items[i].tokenId, items[i].amount, items[i].proof);
        }
    }
}
