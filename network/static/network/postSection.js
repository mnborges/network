const { CSSTransition } = ReactTransitionGroup;

const ButtonGroup = ({
  allow = { edit: false, reply: false, view: false },
  handler = {},
  liked = false,
  counter = { like: 0, reply: 0 },
}) => {
  // style of like button if user likes it
  const likedStyle = { backgroundColor: "#c02000", color: "white" };
  return (
    <div className="btn-group float-right">
      {allow.edit && (
        <button
          className="btn btn-light btn-sm"
          title="Edit"
          onClick={handler.edit}
        >
          <i className="far fa-edit" />
        </button>
      )}
      {allow.reply && (
        <button
          disabled={!authenticated}
          className="btn btn-light btn-sm"
          title={authenticated ? "Reply" : "Log in to reply to this post"}
          onClick={handler.reply}
        >
          <i className="fas fa-reply mr-1" />
          {counter.reply}
        </button>
      )}
      <button
        style={liked ? likedStyle : null}
        disabled={!authenticated}
        className="btn btn-light btn-sm"
        title={authenticated ? "Like" : "Log in to like this post"}
        onClick={handler.like}
      >
        <span className="mr-1">&hearts;</span>
        {counter.like}
      </button>
      {allow.view && (
        <a
          href={`/${allow.view}`}
          className="btn btn-light btn-sm"
          title={"View post page"}
        >
          <i className="fa-solid fa-up-right-from-square" />
        </a>
      )}
    </div>
  );
};
// post is the object returned from api, and main indicates whether post is part of a list or is the main post of "view post" page
const Post = ({ post, main = false }) => {
  // using react useState hook to be able to change post content whenever a user edits their post or clicks to view original post
  const [postContent, setPostContent] = React.useState(post.content);
  const [replyFormVisible, setReplyFormVisible] = React.useState(
    !main ? false : true
  );
  const [likeCount, setLikeCount] = React.useState(post.likes.length);
  const [replyCount, setReplyCount] = React.useState(post.replies.length);
  const [isLiked, setIsLiked] = React.useState(
    Boolean(post.likes.find((elem) => elem === authenticated))
  );
  // handler for the like button
  const likeHandler = async () => {
    await updateData("like", post.id).catch((e) => {
      throw new Error(e.message);
    });
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    setIsLiked(!isLiked);
    return;
  };
  // handler for the 'edit' button
  const editPostContent = () => {
    // save previous content into a variable in case user cancels edit function
    const prevContent = postContent;
    // if user submits the form, send a call to the api to update database then update postContent state
    const saveEdit = (newContent) => {
      postData("edit", newContent, post.id)
        .then(() => setPostContent(newContent))
        .catch((e) => alert(e));
      setPostContent(newContent);
    };
    setPostContent(
      <PostForm
        // here value is post.content instead of postContet because user might've clicked to view original post before 'edit'
        value={post.content}
        type={"edit"}
        finish={{ cancel: () => setPostContent(prevContent), submit: saveEdit }}
      />
    );
    return postContent;
  };
  // handler for the "edited" 'tag'
  const exhibitOriginal = (e) => {
    const prevContent = postContent;
    setPostContent(
      <div className="text-muted">
        <h6>Original Post</h6>
        <p>{post.original}</p>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => setPostContent(prevContent)}
        >
          <strong>&times;</strong> Close
        </button>
      </div>
    );
  };
  return (
    <>
      <div className="d-flex flex-row post rounded m-1 p-1">
        <div className="d-flex justify-content-center mh-100 w-25 h-75">
          <img
            className=" img-fluid rounded-circle avatar"
            src={post.author_photo ? post.author_photo : "media/empty.png"}
            alt={post.author}
            height="auto"
            width="100"
          />
        </div>
        <div className="w-75">
          <div className="txr h5 m-0">
            <a href={`/${post.author}`}>@{post.author}</a>
          </div>
          <div className="ml-3 txo">
            <em>{post.timestamp}</em>
            {post.original && (
              <small>
                <button
                  className="m-0 btn btn-link text-muted"
                  onClick={exhibitOriginal}
                >
                  edited
                </button>
              </small>
            )}
          </div>
          <div className="ml-3 text-wrap">
            {postContent}
            <ButtonGroup
              handler={{
                edit: editPostContent,
                like: likeHandler,
                reply: () => {
                  if (!main) setReplyFormVisible(!replyFormVisible);
                },
              }}
              allow={{
                reply: !post.is_reply && !main, // reply button only visible if post is not a reply and page is not "view_post"
                edit: authenticated === post.author, // edit only visible is the authenticated user is the post author
                view: main || post.is_reply ? false : post.id,
              }}
              liked={isLiked}
              counter={{ reply: replyCount, like: likeCount }}
            />
          </div>
        </div>
      </div>
      {
        <CSSTransition
          timeout={300}
          in={replyFormVisible}
          classNames="reply-transition"
          unmountOnExit
        >
          <div className="m-2 pr-4 pl-4 pb-2">
            <p className="mb-1 h5">
              <i className="fas fa-reply"></i> Reply
            </p>
            <PostForm
              type="reply"
              finish={{
                cancel: () => setReplyFormVisible(false),
                submit: (content) => {
                  postData("reply", content, post.id).then(() => {
                    if (!main) setReplyFormVisible(false);
                    setReplyCount(replyCount + 1);
                  });
                },
              }}
            />
          </div>
        </CSSTransition>
      }
    </>
  );
};
// Paginator component receives information about the page from parent and renders buttons to handle page changes
const Paginator = ({ info, pageHandler }) => {
  const { num_pages, has_previous, has_next, current_page } = info;
  if (num_pages > 1) {
    return (
      <ul className="pagination justify-content-center my-4">
        <li className={has_previous ? "page-item" : "invisible"}>
          <a
            className="page-link"
            onClick={() => pageHandler(parseInt(current_page) - 1)}
          >
            <i className="mr-2 fa-solid fa-angle-left" />
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
            onClick={() => pageHandler(parseInt(current_page) + 1)}
          >
            Next
            <i className="ml-2 fa-solid fa-angle-right" />
          </a>
        </li>
      </ul>
    );
  } else return null;
};
function PostSection() {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState(null);
  // this state controls what page to fetch from api, it is initiated with the value recieved from query or 1
  const [pageNumber, setPageNumber] = React.useState(
    !queries.page ? 1 : queries.page
  );
  // fetch data from api (this runs when page is first loaded and when loading state changes)
  React.useEffect(() => {
    if (loading) {
      fetchData(pageNumber).then((result) => {
        setLoading(false);
        setData(result);
      });
    }
  }, [loading]);
  const handlePaginator = (value) => {
    history.pushState({ page: value }, "", `?page=${value}`);
    setPageNumber(value);
    // this makes useEffect fetch data again
    setLoading(true);
  };

  if (loading) return null;
  return (
    data && (
      <div className="row justify-content-center">
        <div className="col-xl-10 col-lg-8 col-sm-10">
          <Paginator info={data.info} pageHandler={handlePaginator} />
          {data.posts.map((post) => (
            <Post key={post.id} post={post} />
          ))}
          <Paginator info={data.info} pageHandler={handlePaginator} />
        </div>
      </div>
    )
  );
}
// unmount and rerender react component when browser history changes (need to fetch data again)
window.onpopstate = () => {
  queries = getQueries();
  MountPostsSection();
};
function MountPostsSection() {
  ReactDOM.unmountComponentAtNode(document.querySelector("#posts_section"));
  ReactDOM.render(<PostSection />, document.querySelector("#posts_section"));
}
MountPostsSection();
