// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Hashes} from "@openzeppelin/contracts/utils/cryptography/Hashes.sol";
import {ChogsticksPool} from "../src/ChogsticksPool.sol";

contract MockChog is ERC721("Chog Genesis", "CHOG") {
    function mint(address to, uint256 id) external {
        _mint(to, id);
    }
}

contract MockToken is ERC20("Chog", "CHOG") {
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract ChogsticksPoolTest is Test {
    MockChog chog;
    MockToken token;
    ChogsticksPool pool;

    address poster = makeAddr("poster");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address funder = makeAddr("funder");

    // Epoch 0 allocation: #21 -> 300, #7 -> 100, #1349 -> 50, #1 -> 50. Total 500.
    uint256[4] ids = [uint256(21), 7, 1349, 1];
    uint256[4] amounts = [uint256(300e18), 100e18, 50e18, 50e18];
    bytes32[4] leaves;
    bytes32 root;

    function leaf(uint256 epoch, uint256 id, uint256 amount) internal pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(epoch, id, amount))));
    }

    function proofFor(uint256 i) internal view returns (bytes32[] memory p) {
        p = new bytes32[](2);
        p[0] = leaves[i ^ 1];
        p[1] = i < 2 ? Hashes.commutativeKeccak256(leaves[2], leaves[3]) : Hashes.commutativeKeccak256(leaves[0], leaves[1]);
    }

    function setUp() public {
        chog = new MockChog();
        token = new MockToken();
        pool = new ChogsticksPool(chog, token, poster);
        chog.mint(alice, 21);
        chog.mint(alice, 7);
        chog.mint(bob, 1349);
        chog.mint(bob, 1);
        token.mint(funder, 1_000e18);
        vm.startPrank(funder);
        token.approve(address(pool), type(uint256).max);
        pool.fund(1_000e18);
        vm.stopPrank();

        for (uint256 i = 0; i < 4; i++) leaves[i] = leaf(0, ids[i], amounts[i]);
        root = Hashes.commutativeKeccak256(
            Hashes.commutativeKeccak256(leaves[0], leaves[1]), Hashes.commutativeKeccak256(leaves[2], leaves[3])
        );
    }

    function post() internal {
        vm.prank(poster);
        pool.postRoot(0, root, 500e18);
    }

    function test_FundAndPost() public {
        assertEq(pool.unallocated(), 1_000e18);
        post();
        assertEq(pool.allocated(), 500e18);
        assertEq(pool.unallocated(), 500e18);
        assertEq(pool.roots(0), root);
    }

    function test_HolderClaims() public {
        post();
        vm.prank(alice);
        pool.claim(0, 21, 300e18, proofFor(0));
        assertEq(token.balanceOf(alice), 300e18);
        assertTrue(pool.claimed(0, 21));
        assertEq(pool.allocated(), 200e18);
        assertEq(pool.epochRemaining(0), 200e18);
    }

    function test_IncomeMovesWithTheNft() public {
        post();
        vm.prank(alice);
        chog.transferFrom(alice, bob, 21);
        vm.prank(alice);
        vm.expectRevert(ChogsticksPool.NotTokenOwner.selector);
        pool.claim(0, 21, 300e18, proofFor(0));
        vm.prank(bob);
        pool.claim(0, 21, 300e18, proofFor(0));
        assertEq(token.balanceOf(bob), 300e18);
    }

    function test_RevertWhen_ClaimTwice() public {
        post();
        vm.startPrank(alice);
        pool.claim(0, 21, 300e18, proofFor(0));
        vm.expectRevert(ChogsticksPool.AlreadyClaimed.selector);
        pool.claim(0, 21, 300e18, proofFor(0));
        vm.stopPrank();
    }

    function test_RevertWhen_NotOwner() public {
        post();
        vm.prank(bob);
        vm.expectRevert(ChogsticksPool.NotTokenOwner.selector);
        pool.claim(0, 21, 300e18, proofFor(0));
    }

    function test_RevertWhen_InflatedAmount() public {
        post();
        vm.prank(alice);
        vm.expectRevert(ChogsticksPool.InvalidProof.selector);
        pool.claim(0, 21, 999e18, proofFor(0));
    }

    function test_RevertWhen_ProofForOtherToken() public {
        post();
        vm.prank(alice);
        vm.expectRevert(ChogsticksPool.InvalidProof.selector);
        pool.claim(0, 7, 300e18, proofFor(0));
    }

    function test_RevertWhen_WrongEpoch() public {
        post();
        vm.prank(alice);
        vm.expectRevert(ChogsticksPool.NoRoot.selector);
        pool.claim(1, 21, 300e18, proofFor(0));
    }

    function test_RevertWhen_NonPosterPosts() public {
        vm.prank(alice);
        vm.expectRevert(ChogsticksPool.NotPoster.selector);
        pool.postRoot(0, root, 500e18);
    }

    function test_RevertWhen_RootPostedTwice() public {
        post();
        vm.prank(poster);
        vm.expectRevert(ChogsticksPool.RootAlreadyPosted.selector);
        pool.postRoot(0, bytes32(uint256(1)), 1);
    }

    function test_RevertWhen_PostMoreThanPool() public {
        vm.prank(poster);
        vm.expectRevert(ChogsticksPool.InsufficientPool.selector);
        pool.postRoot(0, root, 1_000e18 + 1);
    }

    function test_RevertWhen_EmptyRoot() public {
        vm.prank(poster);
        vm.expectRevert(ChogsticksPool.EmptyRoot.selector);
        pool.postRoot(0, bytes32(0), 1);
    }

    function test_EpochsCannotDrainEachOther() public {
        // Poster commits a root whose leaves sum to 500 but declares total 100.
        vm.prank(poster);
        pool.postRoot(0, root, 100e18);
        vm.prank(alice);
        vm.expectRevert(ChogsticksPool.EpochOverdrawn.selector);
        pool.claim(0, 21, 300e18, proofFor(0));
        // A claim within the declared total still works.
        vm.prank(alice);
        pool.claim(0, 7, 100e18, proofFor(1));
        assertEq(pool.unallocated(), 900e18);
    }

    function test_ClaimMany() public {
        post();
        ChogsticksPool.ClaimInput[] memory items = new ChogsticksPool.ClaimInput[](2);
        items[0] = ChogsticksPool.ClaimInput(0, 1349, 50e18, proofFor(2));
        items[1] = ChogsticksPool.ClaimInput(0, 1, 50e18, proofFor(3));
        vm.prank(bob);
        pool.claimMany(items);
        assertEq(token.balanceOf(bob), 100e18);
    }

    function test_PosterCannotWithdraw() public {
        post();
        // There is no withdraw path: the only outflow is claim, which pays token owners.
        uint256 before = token.balanceOf(address(pool));
        vm.prank(poster);
        (bool ok,) = address(pool).call(abi.encodeWithSignature("withdraw(uint256)", 1));
        assertFalse(ok);
        assertEq(token.balanceOf(address(pool)), before);
    }

    function testFuzz_FundAccumulates(uint96 a, uint96 b) public {
        token.mint(alice, uint256(a) + b);
        vm.startPrank(alice);
        token.approve(address(pool), type(uint256).max);
        pool.fund(a);
        pool.fund(b);
        vm.stopPrank();
        assertEq(pool.unallocated(), 1_000e18 + uint256(a) + b);
    }
}
