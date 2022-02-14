import { makeObservable, any } from "../src/binding/observableObject.ts"
import { binding, Binding, getValue, bind, BindingRepository } from "../src/binding/binding.ts"
import { assertEquals } from "https://deno.land/std@0.96.0/testing/asserts.ts";

interface TestProps {
    s:string
    count:number
    changes?:number
}

Deno.test("create observable and change props", ()=> {
    const obj = makeObservable<TestProps>({s:"my test", count: 1, changes: 10})
    const changes:number[] = []
    obj.$changes.count.subscribe( () => {
        console.log("Count changed to: ", obj.count)
        changes.push(obj.count)
    })
    assertEquals(obj.count, 1)
    assertEquals(obj.s, "my test")
    obj.count = 10
    assertEquals(obj.count, 10)
    obj.count = 15
    obj.count = 15
    assertEquals(obj.count, 15)
    assertEquals(changes, [10, 15])
})

Deno.test("all prop observer", ()=> {
    const obj = makeObservable<TestProps>({s:"my test", count: 1})
    let changeCounter = 0
    obj.$changes[any].subscribe(()=> {
        console.log("obj changed")
        changeCounter++
    })       
    obj.count = 10
    assertEquals(obj.count, 10)
    obj.count = 15
    obj.count = 15
    assertEquals(obj.count, 15)

    assertEquals(changeCounter, 2)
})

Deno.test("simple binding", ()=> {
    const obj = makeObservable<TestProps>({s:"my test", count: 1})
    const tickerTextBinding = binding(()=> `${obj.s}.${obj.count}`, 
                                        obj.$changes.s, obj.$changes.count)

    const updates:string[] = []
    tickerTextBinding.onUpdate( updates.push.bind(updates) ) 
    assertEquals(updates, ["my test.1"])

    obj.count++
    obj.count++
    obj.count++
    obj.s = "changed"
    tickerTextBinding.dispose()
    obj.count++ // shouldn't update any more after dispose

    assertEquals(updates, ["my test.1", "my test.2", "my test.3", "my test.4", "changed.4"])
})

interface Widget {
    class:string
    innerText:string
}

Deno.test("widget like binding", ()=> {
    const item = makeObservable({ text:"hello", icon:"info" })
    const gameState = makeObservable({ lives: 5, name: "Boti"})

    const createWidget = (props:{class:string|Binding<string>, innerText:string|Binding<string>}):Widget => {
        const widget = {
            class: getValue(props.class),
            innerText: getValue(props.innerText),
        }
        
        bind(widget, "class", props.class)
        bind(widget, "innerText", props.innerText)

        return widget
    }

    const w = createWidget({
        class: binding(()=>item.icon, item.$changes.icon),
        innerText : binding(()=> `${item.text} ${gameState.name}(${gameState.lives})`, item.$changes.text, gameState.$changes[any])
    })

    assertEquals(w.innerText, "hello Boti(5)")
    gameState.lives = 1
    assertEquals(w.innerText, "hello Boti(1)")
    item.text = "Bye"
    assertEquals(w.innerText, "Bye Boti(1)")
})

Deno.test("widget like binding with bindingrepo", ()=> {
    const item = makeObservable({ text:"hello", icon:"info" })
    const gameState = makeObservable({ lives: 5, name: "Boti"})

    const repo = new BindingRepository<Widget>()

    const createWidget = (props:{class:string|Binding<string>, innerText:string|Binding<string>}):Widget => {
        const widget = {
            class: getValue(props.class),
            innerText: getValue(props.innerText),
        }
        
        bind(widget, "class", props.class, repo)
        bind(widget, "innerText", props.innerText, repo)

        return widget
    }

    const w = createWidget({
        class: binding(()=>item.icon, item.$changes.icon),
        innerText : binding(()=> `${item.text} ${gameState.name}(${gameState.lives})`, item.$changes.text, gameState.$changes[any])
    })

    assertEquals(w.innerText, "hello Boti(5)")
    gameState.lives = 1
    assertEquals(w.innerText, "hello Boti(1)")

    repo.clearBindings(w) // should stop all bindings, and clear subscriptions

    item.text = "Bye"
    assertEquals(w.innerText, "hello Boti(1)")
})