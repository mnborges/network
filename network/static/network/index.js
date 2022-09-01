// username of current authenticated user
const authenticated = document.querySelector("#network").dataset.username;
const page = window.location.pathname.substring(1);
// separate search string by "?" then reduce resulting array to an object {key<query> : value }
const getQueries = () =>
  window.location.search.split("?").reduce((acc, cur) => {
    if (cur.length)
      acc[cur.substring(0, cur.indexOf("="))] = cur.substring(
        cur.indexOf("=") + 1
      );
    return acc;
  }, {});

var queries = getQueries();

async function fetchData(pageNumber) {
  if (pageNumber === null) pageNumber = 1;
  let res = await fetch(`/api/${page ? page : "homepage"}?page=${pageNumber}`);
  let result = await res.json();
  if (result.error != null) {
    console.log(result.error);
  }
  return result;
}
// API call to update something in the database
async function updateData(type, id) {
  const csrftoken = Cookies.get("csrftoken");
  const request = new Request("/api/update", {
    headers: { "X-CSRFToken": csrftoken },
  });
  let response = await fetch(request, {
    method: "PUT",
    mode: "same-origin",
    body: JSON.stringify({
      type: type,
      id: id,
    }),
  });
  let result = await response.json();
  if (result.error) {
    console.log(result.error);
    throw new Error(`${result.error} Status: ${response.status}`);
  } else {
    console.log(result.message);
  }
  return result;
}
// API call to post something in the databate
async function postData(type, post, id) {
  const csrftoken = Cookies.get("csrftoken");
  const request = new Request("/api", {
    headers: { "X-CSRFToken": csrftoken },
  });
  if (id === undefined) id = "";
  let response = await fetch(request, {
    method: "POST",
    mode: "same-origin",
    body: JSON.stringify({
      type: type,
      post: post,
      id: id,
    }),
  });
  let result = await response.json();
  if (result.error) {
    console.log(result.error);
    throw new Error(`${result.error} Status: ${response.status}`);
  } else {
    console.log(result.message);
  }
  return result;
}

// Form component to be rendered when user clicks reply or edit, the later should have previous post content as value
const PostForm = ({ type = "new", value = "", finish }) => {
  // type: 'edit', 'reply' or 'new'
  if (!type) throw new Error("Form type unespecified!");
  const [formValue, setFormValue] = React.useState(value);
  let color = "blue";
  if (formValue.length > 256) {
    color = "red";
  }
  const submitForm = (e) => {
    e.preventDefault();
    const isEmpty = !Boolean(formValue.trim());
    if (isEmpty) return alert("Not allowed to submit an empty post.");
    finish?.submit(formValue);
    setFormValue("");
  };
  return (
    <form onSubmit={(e) => submitForm(e)}>
      <fieldset style={(color = { color })}>
        <textarea
          className="form-control"
          required
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder={
            type == "reply" ? "Write your reply..." : "What is in your mind?"
          }
          autoFocus
        />
        {type !== "new" && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              finish?.cancel();
            }}
            className="btn post txr mt-2 mr-2"
          >
            Cancel
          </button>
        )}
        <input
          className="btn post txr mt-2"
          disabled={formValue.length > 256}
          type="submit"
          value={type != "edit" ? "Post" : "Save"}
        />
        <span className="float-right">{256 - formValue.length}</span>
      </fieldset>
    </form>
  );
};

const HomepageTopScreen = () => {
  const submitNewPost = {
    submit: (content) => {
      postData("new", content).then(() => window.location.reload());
    },
  };
  if (!authenticated) {
    return (
      <div className=" p-3 my-3 m-4 text-right">
        <p className="pr-5 h3">
          <a href="/login">Log in</a> to share your thoughts.
        </p>
      </div>
    );
  }
  return (
    <>
      <p className="mt-4 txr font-weight-normal h5">
        Hello @{authenticated}! Share your thoughts
      </p>
      <PostForm finish={submitNewPost} />
      <hr />
    </>
  );
};

if (document.querySelector("#post_form_section")) {
  ReactDOM.render(
    <HomepageTopScreen />,
    document.querySelector("#post_form_section")
  );
}
