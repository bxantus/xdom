## Preparing for 1.0 release
- Add more props and event handlers to the element interface (could scan draw&show also dom.d.ts for other props and events)
- Clean up listItems interface
  - it should accept arrays of items, not just observable list
  - template functions may create components as well, not just HTmlElements

## Todo
- Add support for attaching elements to already created dom elements (ex. coming from the server generated html)
  > NOTE: currently you can add children to such elements without extra work. Modifying existing elements what's missing 
- Support light bindings where the result of a (mostly fast) calculated value is transformed (like time formatting) before applying
  to the target property. This would use an alternative notation to calc, like `formatted` or something similar 
- Create tests which really check the DOM too, could use mocha for that