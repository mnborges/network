function ViewPost() {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    fetchData(1).then(({ post }) => {
      setData(post);
      setLoading(false);
    });
  }, [loading]);

  if (loading) return null;
  return (
    data && (
      <div className="p-2">
        <Post post={data} main={true} />
        <hr />
        {data.replies.length > 0 && <p className="h6">Replies</p>}
        {!data.replies.length && <p className="h6">No replies.</p>}
      </div>
    )
  );
}
if (document.querySelector("#view_post_component")) {
  ReactDOM.render(<ViewPost />, document.querySelector("#view_post_component"));
}
