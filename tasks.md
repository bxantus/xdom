## Preparing for 1.0 release
- Remove the use of bindings and from xdom elements
  - Check if we still need observableobject stuff (observable list is needed)
- Wrap light binding creation inside an object (like a class) to better differentiate them from simple functions.
  They will be wrapped inside expressions like `calc(_ => a + b)`, showcasing that the value is calculated.
  > Note: they could receive a frame idx as argument, something similar to notebooks showcased in JSConf 2022
  > this will be probably the DOMHighResTimeStamp passed to the `requestAnimationFrame` callback 
- Finish `visible` handling _(OPTIONAL as interfaces won't be harmed)_: currently it is working fine, but invisible parts of the dom should have their bindings turned off
  except for the current visible binding
- Add more props and event handlers to the element interface (could scan draw&show also dom.d.ts for other props and events)
- Add support for "components" or controls. element builder functions should accept controls as their children too.
  Controls could be represented with an interface having an element property of html element.
  Be sure to attach control object to the underlying html element, via data prop, or a map, so the control can be removed when needed