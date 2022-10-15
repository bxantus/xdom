# Binding library attic

These files aren't part of the official xdom library distributions, but are kept in the source code
on the _attic_: they aren't used currently but could be useful at a later time or inspire new modules.

- `binding.ts`: aims to be a generic binding lib, where certain computations (the value function) will be updated 
  automatically, when any of the observed properties change. You can attach an update function, where you reuse the 
  refreshed value (like setting the property of an object).   
  I chose not to use it further in xdom, as light bindings provide a much simpler alternative (at the cost of a bit of extra CPU time).
  Without automatic change detection, listing the needed property changes can be really challenging, especially when you
  have deeper object paths, like `trips.current.points[idx].x` (in this case you have to watch trips.current, trips.current.points, idx etc. ).
- `observableObject.ts` wraps any simple js object into a proxy object where setting properties will trigger updates (so bindings 
   can use them). This is not needed for the same reason as bindings.    