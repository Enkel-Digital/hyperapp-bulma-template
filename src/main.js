/* Defaults to a hyperapp demo application */

import { h, text, app } from "hyperapp";

const AddTodo = (state) => ({
  ...state,
  value: "",
  todos: state.todos.concat(state.value),
});

const NewValue = (state, event) => ({
  ...state,
  value: event.target.value,
});

app({
  init: { todos: [], value: "" },
  view: ({ todos, value }) =>
    h("main", {}, [
      h("h1", {}, text("To do list")),
      h("input", { type: "text", oninput: NewValue, value }),
      h(
        "ul",
        {},
        todos.map((todo) => h("li", {}, text(todo)))
      ),
      h("button", { onclick: AddTodo }, text("New!")),
    ]),

  node: document.getElementById("app"),
});
