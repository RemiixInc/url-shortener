const form = document.querySelector("form");
const response = document.getElementById("response");

form.addEventListener("submit", event => {
  event.preventDefault();
  const slug = form.elements.slug.value;
  const token = form.elements.token.value;
  const body = { slug: slug, token: token }
  fetch("/api/delete", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
    .then(response => response.json())
    .then(json => {
      if (json.success === true) {
        response.innerHTML = `<p>Slug Deleted.</p>`;
      } else {
        response.innerHTML = `<p><b>Error: </b>${json.error}</p>`;
      }
      form.reset();
    });
});