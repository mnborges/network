const authenticated = document.querySelector("#network").dataset.username;
const { BrowserRouter, Route, Link, Switch, Redirect } = ReactRouterDOM;

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
async function postData(type, post, id) {
  const csrftoken = Cookies.get("csrftoken");
  console.log(csrftoken);
  console.log(
    JSON.stringify({
      type: type,
      post: post,
      id: id,
    })
  );
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
async function fetchData(page_name, page_number, setNewData) {
  //console.log('fetchDataTest')
  if (page_number === null) page_number = 1;
  let res = await fetch(`/api/${page_name}?page=${page_number}`);
  let result = await res.json();
  if (result.error != null) {
    console.log("Error");
    console.log(result);
  }
  setNewData(result);
  return result;
}
function Homepage() {
  const [data, setData] = React.useState(null);
  React.useEffect(() => {
    fetchData("homepage", 1, setData);
  }, []);
  let topScreen = null;
  const submitNewPost = async (content) => {
    console.log("submit new post");
    await postData("new", content)
      .then((res) => {
        console.log(res);
        fetchData("homepage", 1, setData).catch((e) => alert(e));
      })
      .catch((e) => alert(e));
  };
  // If user is authenticated, they should be able to write a new post
  if (authenticated) {
    topScreen = (
      <div className="form-group p-3 my-3 border">
        <h5 className="txr">Hi @{authenticated} ! Share your thoughts.</h5>
        <PostForm finish={{ submit: submitNewPost }} type="new" />
      </div>
    );
  } // If not authenticated, they should be left with a message
  else
    topScreen = (
      <div className=" p-3 my-3 m-4 text-right">
        <h3 className="pr-5">
          <a href="/login">Log in</a> to share your thoughts.
        </h3>
      </div>
    );
  return (
    data && (
      <div>
        {topScreen}
        <LoadPosts
          data={data}
          pageHandler={(page) => {
            fetchData("homepage", page, setData);
          }}
        />
      </div>
    )
  );
}
//this function cannot be async cause it throws an error
function Profile({ match }) {
  // redirect /following path to correct component
  if (match.url === "/following") return <Following />;
  const [data, setData] = React.useState(null);
  const [follow_state, setFollow] = React.useState(null);
  const [num_followers, setNum] = React.useState(null);
  React.useEffect(() => {
    var data = fetchData(`@${match.url.substring(1)}`, 1, setData);
    data.then((result) => {
      setFollow(
        Boolean(result.profile.followers.find((elem) => elem === authenticated))
      );
      setNum(result.profile.followers.length);
    });
  }, []);
  return (
    data && (
      <div>
        <div className="d-flex flex-row mt-2">
          {/* Profile Picture */}
          <div className="p-2">
            <img
              className="rounded-circle "
              src={data.profile.photo}
              alt={data.profile.username}
              style={{ width: "200px" }}
            />
          </div>
          {/* Profile username + Follow/Unfollow button */}
          <div className="ml-2">
            <h3 className="txr mb-2 mt-2">
              @{data.profile.username}
              {match.url.substring(1) != authenticated && (
                <button
                  className="btn post ml-4"
                  onClick={() => {
                    var update = updateData("follow", data.profile.id)
                      .then(() => {
                        setNum((prev_followers) =>
                          follow_state ? prev_followers - 1 : prev_followers + 1
                        );
                        setFollow((follow_state) => !follow_state);
                      })
                      .catch((e) => {
                        alert(e.message);
                      });
                  }}
                >
                  {follow_state ? "Unfollow" : "Follow"}
                </button>
              )}
            </h3>
            {/* Extra information */}
            <div className="ml-3">
              <p className="lead font-weight-normal">{data.profile.bio}</p>
              <div className="text-muted">
                Joined on {data.profile.date_joined}{" "}
              </div>
              Following:{" "}
              <a href={`/${data.profile.username}/following`}>
                {data.profile.following.length}{" "}
              </a>
              | Followers:{" "}
              <a href={`/${data.profile.username}/followers`}>
                {num_followers}
              </a>
            </div>
          </div>
        </div>
        <LoadPosts
          data={data}
          pageHandler={(page) =>
            fetchData(`@${data.profile.username}`, page, setData)
          }
        />
      </div>
    )
  );
}
function Following() {
  const [data, setData] = React.useState(null);
  React.useEffect(() => {
    fetchData("following", 1, setData);
  }, []);
  return (
    data && (
      <LoadPosts
        data={data}
        pageHandler={(page) => fetchData("following", page, setData)}
      />
    )
  );
}
function ViewPost({ match }) {
  console.log("viewpost");
  const [data, setData] = React.useState(null);
  React.useEffect(() => {
    fetchData(match.params.id, 1, setData);
  }, []);
  const sendReply = async (content) => {
    console.log("sendReply");
    await postData("reply", content, data.post.id)
      .then((res) => {
        console.log(res);
        fetchData(match.params.id, 1, setData).catch((e) => alert(e));
      })
      .catch((e) => alert(e));
  };
  return (
    data && (
      <div>
        <div className="p-2">
          <Post
            post={data.post}
            type={"main"} /*
                    handleOperation={props.handleOperation}
                    handlePost={()=>console.log(post)}*/
          />
          {authenticated && (
            <div className="m-3 p-3">
              <PostForm
                type="reply"
                finish={{ submit: (content) => sendReply(content) }}
              />
            </div>
          )}
          {!authenticated && (
            <div className="p-3 my-3 m-4">
              <h3 className="pr-5">
                <a href="/login">Log in</a> and write a reply.
              </h3>
            </div>
          )}
          {data.post.replies.length > 0 && <h6>Replies</h6>}
        </div>
        <LoadPosts
          data={data}
          pageHandler={(page) => fetchData(match.params.id, page, setData)}
        />
      </div>
    )
  );
}
function LoadPosts(props) {
  /* an "operation" here is something changing the way posts are normally loaded.
        the user might have clicked the link to see the original post of an edited one or
        they might have clicked the reply button, opening a reply form under the post or
        they clicked the edit button which changes post to a textarea with post content in it.
        the intention here is to have only one "operation" at a time so that the page wont get messy
    */
  const [operationActive, setOperationActive] = React.useState(null);
  //const [opAct] = React.useRef(null);
  //const toggleOperationActive = () => operationActive ? setOperationActive(false) : setOperationActive(true)
  //const [redirect, setRedirect] = React.useState(false);

  const openViewPost = (author, id) => {
    console.log(`viewPost ${id} from ${author}`);
    if (props.data.info.page_name != id)
      window.location.href = `/${author}/${id}`;
    else console.log("Page already opened");
    return;
  };
  if (!props.data.posts.length) {
    if (isNaN(parseInt(props.data.info.page_name)))
      return <h5 className="m-3">No posts.</h5>;
    else return <h5 className="m-3">No replies.</h5>;
  }
  return (
    <div className="p-lg-5">
      {Paginator(props)}
      {props.data.posts.map((post) => (
        <Post
          post={post}
          key={post.id}
          opHandler={() => props.pageHandler(props.data.info.current_page)}
          viewPost={(author, id) => openViewPost(author, id)}
          /*operationActive = {{state : operationActive, set : setOperationActive}}*/
        />
      ))}
      {Paginator(props)}
    </div>
  );
}
function Paginator(props) {
  const { num_pages, has_previous, has_next, current_page } = props.data.info;
  if (num_pages > 1) {
    return (
      <ul className="pagination justify-content-center">
        <li className={has_previous ? "page-item" : "invisible"}>
          <a
            className="page-link"
            onClick={() => props.pageHandler(parseInt(current_page) - 1)}
          >
            Previous
          </a>
        </li>
        <li className="page-item disabled">
          <a className="page-link">
            Page {current_page} of {num_pages}{" "}
          </a>
        </li>
        <li className={has_next ? "page-item" : "invisible"}>
          <a
            className="page-link"
            onClick={() => props.pageHandler(parseInt(current_page) + 1)}
          >
            Next
          </a>
        </li>
      </ul>
    );
  } else return null;
}
function Post(props) {
  const likedStyle = { backgroundColor: "#c02000", color: "white" };
  const [likeState, setLikeState] = React.useState(
    props.post.likes.length &&
      props.post.likes.find((elem) => elem === authenticated)
      ? likedStyle
      : null
  );
  const [numLikes, setNumLikes] = React.useState(props.post.likes.length);
  const [postContent, setPostContent] = React.useState(props.post.content);
  const [replyForm, setReplyForm] = React.useState(null);
  const replyNode = React.useRef(null);

  // runs after user click 'like' button
  const toggleLikeState = () => {
    setLikeState(likeState ? null : likedStyle);
    setNumLikes(likeState ? numLikes - 1 : numLikes + 1);
  };
  // runs after user click 'edit' button
  const editContent = () => {
    console.log("edit content");
    let prevContent = postContent;
    const cancelEdit = () => {
      setPostContent(prevContent);
    };
    const saveEdit = (newContent) => {
      postData("edit", newContent, props.post.id)
        .then(() => setPostContent(newContent))
        .catch((e) => alert(e));
    };
    const finishEditing = { cancel: cancelEdit, submit: saveEdit };
    setPostContent(
      <PostForm value={postContent} type={"edit"} finish={finishEditing} />
    );
    return postContent;
  };
  // runs after user clicks "edit" link
  const exhibitOriginal = (e) => {
    console.log("exhibit original post");
    if (!e) e = window.event;
    e.preventDefault();
    e.stopPropagation();
    const { original } = props.post;
    let prevContent = postContent;
    const exitOriginal = () => setPostContent(prevContent);
    setPostContent(
      <div className="text-muted">
        <h6>Original Post</h6>
        <p>{original}</p>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={exitOriginal}
        >
          <strong>&times;</strong> Close
        </button>
      </div>
    );
  };
  const exhibitReplyForm = () => {
    console.log("exhibit reply form");
    const cancelReply = () => setReplyForm(null);
    const sendReply = async (content) => {
      const node = replyNode.current;
      // Animation to be played after user replies to a post
      const message = new Animation(
        new KeyframeEffect(
          node,
          [
            {
              opacity: "100%",
              lineHeight: "100%",
              height: "auto",
            },
            {
              opacity: "0%",
              lineHeight: "50%",
              height: "50%",
            },
            {
              opacity: "0%",
              lineHeight: "0%",
              height: "0%",
            },
          ],
          { delay: 1000, duration: 800 }
        ),
        document.timeline
      );
      // add post to db
      await postData("reply", content, props.post.id)
        .then((res) => {
          console.log(res);
          node.className = "m-3 alert alert-success";
          node.innerHTML = "Post replied successfully";
          message.play();
          message.onfinish = () => setReplyForm(null);
        })
        .catch((e) => alert(e));
    };
    const finishReply = { submit: sendReply, cancel: cancelReply };
    setReplyForm(
      <div className="m-2 pr-4 pl-4 pb-2" ref={replyNode}>
        <h5 className="mb-1">
          <i className="fas fa-reply"></i> Reply
        </h5>
        <PostForm type="reply" info={props.post.info} finish={finishReply} />
      </div>
    );
  };
  const { author, id, content, is_reply, author_photo, timestamp, original } =
    props.post;
  //Group of buttons:Edit (Visible only if authenticated user is the author), Reply, , and Like
  const btngroup = (
    <div className="btn-group float-right">
      {authenticated === author && (
        /* Edit */
        <button
          disabled={typeof content != "string"}
          className="btn btn-light btn-sm"
          title="Edit"
          onClick={(e) =>
            buttonHandler(e, props.post, "edit", (e) => editContent(e))
          }
        >
          <i className="far fa-edit"></i>
        </button>
      )}
      {is_reply === false && props.type != "main" && (
        /* Reply */
        <button
          disabled={!authenticated}
          className="btn btn-light btn-sm"
          title={authenticated ? "Reply" : "Log in to reply to this post"}
          onClick={(e) =>
            buttonHandler(e, props.post, "reply", exhibitReplyForm)
          }
        >
          <i className="fas fa-reply"></i> {props.post.replies.length}
        </button>
      )}
      {/* Like */}
      <button
        disabled={!authenticated}
        style={likeState}
        className="btn btn-light btn-sm"
        title={authenticated ? "Like" : "Log in to like this post"}
        onClick={(e) => buttonHandler(e, props.post, "like", toggleLikeState)}
      >
        <span>&hearts;</span> {numLikes}
      </button>
    </div>
  );
  return (
    <div>
      <div
        className="row post rounded m-1 p-1 "
        onClick={(e) => {
          /* Click on post div should redirect to post page */
          if (!e) e = window.event;
          e.preventDefault();
          e.stopPropagation();
          if (
            typeof postContent == "string" &&
            is_reply == false &&
            props.type != "main"
          ) {
            props.viewPost(author, id);
            console.log(`clicked post ${id}`);
          }
        }}
      >
        <div className="col-lg-2 col-md-3 col-sm-12">
          <img
            className="rounded-circle avatar"
            src={author_photo}
            alt={author}
            height="auto"
            width="100"
          />
        </div>
        <div className="col">
          <div className="txr h5">
            <Link to={`/${author}`}>@{author}</Link>
          </div>
          <i className="ml-3 txo">{timestamp}</i>
          {
            /* 'edited' link should appear if original post is defined */
            original && (
              <small>
                <a
                  href="#"
                  onClick={(e) => exhibitOriginal(e)}
                  className="ml-1 font-italic text-muted"
                >
                  edited
                </a>
              </small>
            )
          }
          <div className="ml-3">
            <pre>
              {postContent} {btngroup}
            </pre>
          </div>
        </div>
      </div>
      {replyForm}
    </div>
  );
}
function buttonHandler(e, post, type, callback) {
  console.log(`${type} post #${post.id}`);
  if (!e) e = window.event;
  e.stopPropagation();
  e.preventDefault();
  switch (type) {
    case "like":
      updateData("like", post.id)
        .then(() => callback())
        .catch((e) => {
          alert(e);
        });
      break;
    case "edit":
      console.log(`edit?`);
      callback();
      break;
    case "reply":
      console.log(`reply?`);
      callback();
      break;
  }
}
function PostForm(props) {
  if (!props.type) throw new Error("Form type unespecified!");
  const { type } = props;
  const [formValue, setFormValue] = React.useState(
    props.value ? props.value : ""
  );
  let color = "blue";
  if (formValue.length > 256) {
    color = "red";
  }
  const submitForm = /*async */ (e) => {
    console.log(props);
    //if (!e) e = window.event;
    e.preventDefault(); //prevents page from reloading after new post
    //e.stopPropagation();
    if (formValue === "") {
      alert("Error! Post content must not be empty.");
      throw new Error("Empty form.");
    }
    props.finish.submit(formValue);
    setFormValue("");
  };
  return (
    <form onSubmit={(e) => submitForm(e)}>
      <fieldset style={(color = { color })}>
        <textarea
          className="form-control"
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder={
            type == "reply" ? "Write your reply..." : "What is in your mind?"
          }
          autoFocus={type != "new" ? true : false}
        />
        {type != "new" && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              props.finish.cancel();
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
}

function Network() {
  if (authenticated) {
    document.querySelector("#follow").addEventListener("click", () => {
      console.log("clicked follow");
      window.location.href = "/following";
    });
    document.querySelector("#profile").addEventListener("click", () => {
      console.log("clicked prof");
      window.location.href = `/${authenticated}`;
    });
  }
  return (
    <div>
      <Switch>
        <Route exact path="/" component={Homepage} />
        <Route exact path={`/:username`} component={Profile} />
        <Route path={`/:username/:id`} component={ViewPost} />
      </Switch>
    </div>
  );
}
function MountNetwork() {
  ReactDOM.unmountComponentAtNode(document.querySelector("#load"));
  ReactDOM.render(
    <BrowserRouter>
      <Network />
    </BrowserRouter>,
    document.querySelector("#load")
  );
}
MountNetwork();
