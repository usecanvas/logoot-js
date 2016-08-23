# Logoot

A JavaScript implementation of the
[Logoot CRDT](https://hal.archives-ouvertes.fr/inria-00432368/document). There is
an Elixir companion library to this one at
[usecanvas/logoot_ex](https://github.com/usecanvas/logoot_ex).

**This is a work-in-progress and is not battle-tested.**

## Installation

Browser:

```
bower install --save logoot
```

Node:

```
npm install --save logoot
```

## What is Logoot?

Logoot is a
[conflict-free replicated data type](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)
that can be used to represent a sequence of atoms. Atoms in a Logoot sequence
might be chunks of content or even characters in a string of text.

The key to Logoot is the way in which it generates identifiers for atoms. To
understand this, here are a few definitions to start with:

- `identifier` A pair `<p, s>` where `p` is an integer and `s` is a globally
  unique site identifier. A "site" represents any independent copy of a given
  Logoot CRDT. One web client with independent editable views of the same
  sequence would be two separate sites on that client.
- `position` A list of identifiers.
- `atom identifier` A pair `<pos, c>` where `pos` is a position, and `c` is the
   value of a vector clock at a given site. The site maintains a vector clock
   that increases incrementally with each no atom identifier generated.
- `sequence atom` A pair `<ident, v>` where `ident` is an atom identifier, and
  `v` is any arbitrary value. This could be a single text character or a block
  in a text editor.
- `sequence` A list of sequence atoms. This might represent a document or a
  list of blocks in an editor. Every sequence implicitly has a minimum sequence
  atom and a maximum sequence atom. All other atoms in the sequence are created
  somewhere between these two.

Because of how these atom identifiers are structured, they are *totally
ordered*, as opposed to *causally ordered*. No identifier cares about the
identifier before it once it's been created, and so **tombstones are not
necessary**.

### Generating a Sequence Atom

Let's start with the empty sequence before any user has made edits to it:

```javascript
[
  [[[[0, 0]], 0], null],    // Minimum sequence atom
  [[[[32767, 0]], 1], null] // Maximum sequence atom
]
```

*__Aside:__ Note that the integer in the maximum sequence atom's value is
`32767`. This is chosen somewhat arbitrarily, but it is common for
implementations to use the maximum unsigned 16-bit integer (and the original
paper recommends it). One wouldn't want to choose an integer greater than any
implementation's maximum safe integer value, and all implementations that
communicate with one another must share this same maximum.*

Now, a user at site `1` inserts the first line into their local copy of the
document:

```javascript
[
  [[[[0, 0]], 0], null],    // Minimum sequence atom
  [[[[6589, 1]], 0], "Hello, world!"],
  [[[[32767, 0]], 1], null] // Maximum sequence atom
]
```

Because there is free space between the integer of the minimum sequence atom and
the integer of the maximum sequence atom, Logoot chooses a random integer
between the two (how this is chosen is somewhat arbitrary—it just must be
between them) and ends up with the sequence identifier:

```javascript
[
  [
    [
      6589, // Number between min/max
      1     // Site identifier
    ]
  ],
  0         // Next value of site's vector clock
]
```

As a result, the document is properly sequenced. Ordering of sequence atoms is
done by iterating over their position list and comparing first the integer, and
then the site identifier if the integer is equal.

*Note that vector clock values are not compared. Vector clock values are used to
ensure unique atom identifiers, not for ordering.*

Let's look at a more complex example. Start with a document that looks like
this:

```javascript
[
  [[[[0, 0]]], null],    // Minimum sequence atom
  [[[[1, 1], [3, 2]], 5], "Hello, world from site 2!"],
  [[[[1, 1], [5, 4]], 1], "I came from site 4!"],
  [[[[32767, 0]]], null] // Maximum sequence atom
]
```

Now, at site `3`, the user wants to insert a line between the two user-created
lines in the above sequence. Logoot iterates over the pairs of identifiers in
the "before" and "after" positions. Because the first identifier of each
position is `[1, 1]`, Logoot can not insert an identifier directly between them,
so it moves on to the next pair, `[3, 2]` and `[5, 4]`. Because site 3's
site identifier is greater than site 2's, it can insert the identifier `[3, 3]`
here and preserve ordering, since `[3, 2] < [3, 3] < [5, 4]`.

The resulting sequence would be (assuming 3's vector clock is at `1`):

```javascript
[
  [[[[0, 0]]], null],    // Minimum sequence atom
  [[[[1, 1], [3, 2]], 5], "Hello, world from site 2!"],
  [[[[1, 1], [3, 3]], 1], "Hello from site 3!"],
  [[[[1, 1], [5, 4]], 1], "I came from site 4!"],
  [[[[32767, 0]]], null] // Maximum sequence atom
]
```

Note that if this were actually site `1`, things would be different, because
`[3, 2]` is not less than `[3, 1]`. Instead, Logoot generates a random integer
between 3 and 5 (which is of course `4`), and our resulting identifier would be:

```javascript
[[[1, 1], [4, 1]], 1]
```

Hopefully this provides a good enough explanation of what Logoot is and why it
may be an excellent option for a sequence CRDT. The
[paper](https://hal.archives-ouvertes.fr/inria-00432368/document) presenting it
is a relatively easy read, and you may also want to look at this project's
[Logoot.Sequence module](https://github.com/usecanvas/logoot-js/blob/master/lib/logoot/sequence.js)
and its [tests](https://github.com/usecanvas/logoot-js/blob/master/test/logoot/sequence-test.js).

## TODO

- [ ] Make min and max implicit, do not force user to provide them.
- [ ] Prevent deleting min and max atoms.
- [x] Make idempotent insert atom function.
- [x] Make idempotent delete atom function.
