const MAX_POS = 32767;
const ABS_MIN_ATOM_IDENT = [[[0, 0]], 0];
const ABS_MAX_ATOM_IDENT = [[[MAX_POS, 0]], 1];

/**
 * A sequence of atoms identified by atom identifiers.
 *
 * Across all replicas, a sequence is guaranteed to converge to the same value
 * given all operations have been received in causal order.
 *
 * @module Logoot.Sequence
 */

/**
 * The result of a comparison operation.
 * @typedef {(-1|0|1)} comparison
 */

/**
 * An array `[int, site]` where `int` is an integer and `site` is a site
 * identifier.
 *
 * The site identifier may be any comparable value.
 *
 * @typedef {Array<number, *>} ident
 */

/**
 * A list of `ident`s.
 * @typedef {Array<ident>} position
 */

/**
 * An array `[pos, vector]` where `pos` is a position and `vector` is the value
 * of a vector clock at the site that created the associated atom.
 *
 * @typedef {Array<position, number>} atomIdent
 */

/**
 * An array `[atomIdent, value]` where `atomIdent` is the globally unique
 * identifier for this atom and `value` is the atom's value.
 *
 * @typedef {Array<atomIdent, *>} atom
 */

/**
 * An ordered sequence of `atom`s, whose first atom will always be
 * `[ABS_MIN_ATOM_IDENT, null]` and whose last atom will always be
 * `[ABS_MAX_ATOM_IDENT, null]`.
 *
 * @typedef {Array<atom>} sequence
 */

export const min = ABS_MIN_ATOM_IDENT;
export const max = ABS_MAX_ATOM_IDENT;

/**
 * Compare two atom identifiers, returning `1` if the first is greater than the
 * second, `-1` if it is less, and `0` if they are equal.
 *
 * @function
 * @param {atomIdent} atomIdentA The atom to compare another atom against
 * @param {atomIdent} atomIdentB The atom to compare against the first
 * @returns {comparison}
 */
export function compareAtomIdents(atomIdentA, atomIdentB) {
  return comparePositions(atomIdentA[0], atomIdentB[0]);
}

/**
 * Return the "empty" sequence, which is a sequence containing only the min and
 * max default atoms.
 *
 * @function
 * @returns {sequence}
 */
export function emptySequence() {
  return [[ABS_MIN_ATOM_IDENT, null], [ABS_MAX_ATOM_IDENT, null]];
}

/**
 * Generate an atom ID between the two given atom IDs for the given site ID.
 *
 * @function
 * @param {*} siteID The ID of the site at which the atom originates
 * @param {number} clock The value of the site's vector clock
 * @param {atomIdent} prevAtomIdent The atom identify before the new one
 * @param {atomIdent} nextAtomIdent The atom identify after the new one
 * @return {atomIdent}
 */
export function genAtomIdent(siteID, clock, prevAtomIdent, nextAtomIdent) {
  return [genPosition(siteID, prevAtomIdent[0], nextAtomIdent[0]), clock];
}

/**
 * Insert an atom into a sequence using the given function.
 *
 * The function will receive the sequence, an index to insert at, and the atom
 * as arguments.
 *
 * If the atom is already in the sequence, the **original sequence object** will
 * be returned.
 *
 * @function
 * @param {sequence} sequence The sequence to insert the atom into
 * @param {atom} atom The atom to insert into the sequence
 * @param {function(sequence, number, atom) : sequence} insertFunc The function
 *   that will be called on to do the insert
 * @return {sequence}
 */
export function insertAtom(sequence, atom, insertFunc) {
  const sequenceLength = sequence.length;

  for (let i = 0; i < sequenceLength; i++) {
    const prev = sequence[i];
    const next = sequence[i + 1];

    const position = atom[0][0];
    const prevPosition = prev[0][0];
    const nextPosition = next[0][0];

    const comparisons =
      [comparePositions(position, prevPosition),
       comparePositions(position, nextPosition)];

    if (comparisons[0] === 1 && comparisons[1] === -1) {
      return insertFunc(sequence, i + 1, atom);
    } else if (comparisons[0] === 1 && comparisons[1] === 1) {
      continue;
    } else if (comparisons[0] === -1 && comparisons[1] === 1 ||
               comparisons[0] === -1 && comparisons[1] === -1) {
      throw new Error('Sequence out of order!');
    } else {
      return sequence;
    }
  }
}

/**
 * Compare two positions, returning `1` if the first is greater than the second,
 * `-1` if it is less, and `0` if they are equal.
 *
 * @function
 * @private
 * @param {position} posA The position to compare another position against
 * @param {position} posB The position to compare against the first
 * @returns {comparison}
 */
function comparePositions(posA, posB) {
  if (posA.length === 0 && posB.length === 0) return 0;
  if (posA.length === 0) return -1;
  if (posB.length === 0) return 1;

  switch (compareIdents(posA[0], posB[0])) {
    case 1:
      return 1;
    case -1:
      return -1;
    case 0:
      return comparePositions(posA.slice(1), posB.slice(1));
  }
}

/**
 * Compare two idents, returning `1` if the first is greater than the second,
 * `-1` if it is less, and `0` if they are equal.
 *
 * @function
 * @private
 * @param {ident} identA The ident to compare another ident against
 * @param {ident} identB The ident to compare against the first
 * @returns {comparison}
 */
function compareIdents([identAInt, identASite], [identBInt, identBSite]) {
  if (identAInt > identBInt) return 1;
  if (identAInt < identBInt) return -1;
  if (identASite > identBSite) return 1;
  if (identASite < identBSite) return -1;
  return 0;
}

/**
 * Generate a position for an site ID between two other positions.
 *
 * @function
 * @private
 * @param {*} siteID The ID of the site at which the position originates
 * @param {position} prevPos The position before the new one
 * @param {position} nextPos The position after the new one
 */
function genPosition(siteID, prevPos, nextPos) {
  prevPos = prevPos.length > 0 ? prevPos : min[0];
  nextPos = nextPos.length > 0 ? nextPos : max[0];

  const prevHead = prevPos[0];
  const nextHead = nextPos[0];

  const [prevInt, prevSiteID] = prevHead;
  const [nextInt, _nextSiteID] = nextHead;

  switch (compareIdents(prevHead, nextHead)) {
    case -1: {
      const diff = nextInt - prevInt;

      if (diff > 1) {
        return [[randomIntBetween(prevInt, nextInt), siteID]];
      } else if (diff === 1 && siteID > prevSiteID) {
        return [[prevInt, siteID]];
      } else {
        return [prevHead].concat(
          genPosition(siteID, prevPos.slice(1), nextPos.slice(1)));
      }
    } case 0: {
      return [prevHead].concat(
              genPosition(siteID, prevPos.slice(1), nextPos.slice(1)));
    } case 1: {
      throw new Error('"Next" position was less than "previous" position.')
    }
  }
}

/**
 * Return a random number between two others.
 *
 * @function
 * @private
 * @param {number} min The floor (random will be greater-than)
 * @param {number} max The ceiling (ranodm will be less-than)
 * @returns {number}
 */
function randomIntBetween(min, max) {
  return Math.floor(Math.random() * (max - (min + 1))) + min + 1;
}
