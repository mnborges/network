function Profile() {
  const [data, setData] = React.useState(null);
  const [follow_state, setFollow] = React.useState(null);
  const [numFollower, setNumFollowers] = React.useState(null);
  React.useEffect(() => {
    fetchData(1).then(({ profile = {} }) => {
      setData(profile);
      setFollow(
        Boolean(profile.followers.find((elem) => elem === authenticated))
      );
      setNumFollowers(profile.followers.length);
    });
  }, []);
  return (
    data && (
      <>
        <div className="d-flex flex-row my-4">
          {/* Profile Picture */}
          <div className="p-2">
            <img
              className="rounded-circle img-fluid "
              src={data.photo}
              alt={data.username}
              style={{ width: "200px" }}
            />
          </div>
          {/* Profile username + Follow/Unfollow button */}
          <div className="ml-2">
            <h3 className="txr mb-2 mt-2">
              @{page}
              {page != authenticated && authenticated && (
                <button
                  className="btn post ml-4"
                  onClick={() => {
                    updateData("follow", data.id)
                      .then(() => {
                        setNumFollowers((prev_followers) =>
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
                  <i
                    className={`mx-1 fa-solid fa-user-${
                      follow_state ? "minus" : "plus"
                    }`}
                  />
                </button>
              )}
            </h3>
            {/* Extra information */}
            <div className="ml-3">
              <p className="lead font-weight-normal">{data.bio}</p>
              <div className="text-muted">Joined on {data.date_joined} </div>
              Following:{" "}
              <a href={`/${data.username}/following`}>
                {data.following.length}{" "}
              </a>
              | Followers:{" "}
              <a href={`/${data.username}/followers`}>{numFollower}</a>
            </div>
          </div>
        </div>
      </>
    )
  );
}
if (document.querySelector("#profile_component")) {
  ReactDOM.render(<Profile />, document.querySelector("#profile_component"));
}
