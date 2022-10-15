# XDOM

XDOM aims to be an easy to use front-end typescript library for creating user interfaces. With the help of light-bindings you can use the MVVM (Model-View-ViewModel) pattern, if you want. 

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
The following sample displays the same simple greeting message, but both the greeter and user texts are properties of a 
greeter object (any js object can be used).   
It uses the concept of light-bindings (or automatic value computations): a calculation is bound to value of the span's text, this
will be recomputed in each frame, and when it changes it will be automatically applied on the span element.

Try to change `greeting.greet` or `greeting.user` from the debug console, to see the changes applied.

You may create more complex calculations, if you need to. As these will run in each frame (while the app is active: 
ex. browser tab in foreground), it is worth using computations which aren't too costly (probably most of them aren't).

```ts
const greeting = {
    greet: "Hello",
    user: "Word",
}

const main = el("div", { class:"main" }, 
    el("span", { text: ()=>`${greeting.greet} ${greeting.user}!` }
    ),
)

document.body.append(main);
(globalThis as any).greeting = greeting
```
