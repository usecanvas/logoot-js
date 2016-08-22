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
