pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";

// Proves membership of Poseidon(nullifier, secret) in the commitment tree
// without revealing which leaf it is.
template MerkleProof(levels) {
    signal input leaf;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal output root;

    component hashers[levels];
    signal computed[levels + 1];
    computed[0] <== leaf;

    for (var i = 0; i < levels; i++) {
        // Each index must be a bit.
        pathIndices[i] * (1 - pathIndices[i]) === 0;

        hashers[i] = Poseidon(2);
        // index 0: (computed, sibling) — index 1: (sibling, computed)
        hashers[i].inputs[0] <== computed[i] + pathIndices[i] * (pathElements[i] - computed[i]);
        hashers[i].inputs[1] <== pathElements[i] + pathIndices[i] * (computed[i] - pathElements[i]);
        computed[i + 1] <== hashers[i].out;
    }

    root <== computed[levels];
}

template Withdraw(levels) {
    // Public
    signal input root;
    signal input nullifierHash;
    signal input recipient;
    signal input relayer;
    signal input fee;

    // Private
    signal input nullifier;
    signal input secret;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    component commitmentHasher = Poseidon(2);
    commitmentHasher.inputs[0] <== nullifier;
    commitmentHasher.inputs[1] <== secret;

    component nullifierHasher = Poseidon(1);
    nullifierHasher.inputs[0] <== nullifier;
    nullifierHasher.out === nullifierHash;

    component tree = MerkleProof(levels);
    tree.leaf <== commitmentHasher.out;
    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }
    tree.root === root;

    // Bind recipient, relayer, and fee into the proof so none of them can
    // be tampered with in flight (e.g. a relayer redirecting funds or
    // raising its own fee). The squares force the constraints to stay.
    signal recipientSquare;
    recipientSquare <== recipient * recipient;
    signal relayerSquare;
    relayerSquare <== relayer * relayer;
    signal feeSquare;
    feeSquare <== fee * fee;
}

component main {public [root, nullifierHash, recipient, relayer, fee]} = Withdraw(20);
