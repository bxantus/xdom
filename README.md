# XDOM

XDOM aims to be an easy to use front-end typescript library for creating user interfaces. With the help of bindings you can use the MVVM (Model-View-ViewModel) pattern, if you want. 

It's fully written in typescript, currently it doesn't even require JSX to work.

XDOM directly manipulates the DOM, it won't create any virtual DOM elements. I found it to be easier to work with HtmlElements directly, especially if you're scheduling CSS transitions and animations, or you need to access direct properties of the elements (like bounding rects for ex.).

## Examples

### Hello world
A simple dom structure displaying a hello message for the configured user.

```ts
import { el } from "xdom.ts"

const userName = "World"
const main = el("div", { class:"main" },
    "Hello",
    el("span", {innerText: userName}),
    "!"
)

document.body.append(main)
```

### Greeting
The following sample displays the same simple greeting message, but both the greeter and user texts are properties of an observable object.
Try to change `greeting.greet` or `greeting.user` from the debug console, to see the changes applied.
> **NOTE**: greeting object is fully typed, and ts language services will offer full code complete for ex. `greeting.$changes.` will list greet and user as possible observable properties.

Binding syntax: `binding(valueFunction, ...observables)`:
- valueFunction will be evaluated each time any of the observables change

You may create more complex value functions using multiple observable properties, if you need to. The code below observes both greet and user, and will update the span's innerText each time, any of them change.

```ts
import { el, binding, makeObservable } from "xdom.ts"

const greeting = makeObservable({
    greet: "Hello",
    user: "Word",
})

const main = el("div", { class:"main" },
    el("span", { innerText: binding(()=>`${greeting.greet} ${greeting.user}!`, 
    greeting.$changes.greet, greeting.$changes.user) }
    ),
)

document.body.append(main);
(globalThis as any).greeting = greeting
```
