/* Defaults to a hyperapp demo application */

import { app, text } from "hyperapp";
import { main, h1, input, ul, li, button } from "@hyperapp/html";

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
    main([
      h1(text("To do list")),
      input({ type: "text", class: "input", oninput: NewValue, value }),
      ul(todos.map((todo) => li(text(todo)))),
      button(
        { class: "button is-success is-light is-fullwidth", onclick: AddTodo },
        text("New!")
      ),
    ]),

  node: document.getElementById("app"),
});
