## Preparing for 1.0 release
- Finish `visible` handling _(OPTIONAL as interfaces won't be harmed)_: currently it is working fine, but invisible parts of the dom should have their bindings turned off
  except for the current visible binding
- Add more props and event handlers to the element interface (could scan draw&show also dom.d.ts for other props and events)
- Add support for "components" or controls. element builder functions should accept controls as their children too.
  Controls could be represented with an interface having an element property of html element.
  Be sure to attach control object to the underlying html element, via data prop, or a map, so the control can be removed when needed

## Todo
- Support light bindings where the result of a (mostly fast) calculated value is transformed (like time formatting) before applying
  to the target property. This would use an alternative notation to calc, like `formatted` or something similar 