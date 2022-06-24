import { assertEquals } from "https://deno.land/std@0.96.0/testing/asserts.ts";
import { ObservableList } from "../src/objects/observableList.ts";

Deno.test("list.of", ()=> {
    const list = ObservableList.of(1, 2, 3)
    assertEquals([...list], [1, 2, 3])
})

Deno.test("list.from", ()=> {
    const list = ObservableList.from([5, 6,  10])
    assertEquals([...list], [5, 6, 10])
})

Deno.test("list access", ()=>{
    const list = ObservableList.from([5, 6,  10])
    assertEquals(list.at(0), 5)
    assertEquals(list.at(1), 6)
    assertEquals(list.at(2), 10)
    assertEquals(list.at(3), undefined)
    assertEquals(list.length, 3)
})

Deno.test("toString", ()=>{
    const list = ObservableList.of(1, 2, 3)
    assertEquals(list.toString(), "list[1,2,3]")
})

Deno.test("list.push changes", ()=> {
    const list = ObservableList.of(1, 2, 3)
    let newValues:number[] = []
    list.$changes.list.subscribe(()=> {
        newValues = [...list]
    })
    assertEquals([...list], [1, 2, 3])
    
    list.push(100)
    assertEquals([...list], [1, 2, 3, 100])
    assertEquals(newValues, [1, 2, 3, 100])
    list.push(200)
    assertEquals(newValues, [1, 2, 3, 100, 200])
})