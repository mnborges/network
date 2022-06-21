/**
 *
 * @param {string} type - type of post update ('like' or 'follow')
 * @param {number} id - post id
 * @returns {Promise} - srv answer
 */
export async function updateData(type, id) {
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
/**
 * @param {string} type - type of action to perform, 'reply' or 'new' adds post to database; 'edit' changes existing post
 * @param {string} post - post content
 * @param {number} id - id of post to be edited or replied to
 * @returns {Promise} - server answer
 */
export async function postData(type, post, id) {
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

export async function fetchData(page_name, page_number) {
  if (page_number === null) page_number = 1;
  let res = await fetch(`/api/${page_name}?page=${page_number}`);
  let result = await res.json();
  if (result.error != null) {
    console.log("Error");
  }
  return result;
}
