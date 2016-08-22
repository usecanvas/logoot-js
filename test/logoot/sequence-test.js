const Sequence = require('../../lib/logoot/sequence');
const assert = require('assert');
const { describe, it } = require('mocha');

describe('Sequende', function() {
  describe('.compareAtomIdents', function() {
    it('returns -1 when less-than', function() {
      assert.equal(
        Sequence.compareAtomIdents(Sequence.min, Sequence.max),
        -1
      );
    });

    it('returns 0 when equal', function() {
      assert.equal(
        Sequence.compareAtomIdents(Sequence.min, Sequence.min),
        0
      );
    });

    it('returns 1 when greater-than', function() {
      assert.equal(
        Sequence.compareAtomIdents(Sequence.max, Sequence.min),
        1
      );
    });
  });

  describe('.emptySequence', function() {
    it('returns the empty sequence', function() {
      assert.deepEqual(
        Sequence.emptySequence(),
        [
          [[[[0, 0]], 0], null],
          [[[[32767, 0]], 1], null]
        ]
      )
    });
  });
});
