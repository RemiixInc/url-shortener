const form = document.querySelector("form");
const response = document.getElementById("response");

form.addEventListener("submit", event => {
  event.preventDefault();
  const slug = form.elements.slug.value;
  const body = { slug: slug }
  fetch("/api/stats", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
    .then(response => response.json())
    .then(json => {
      if (json.success === true) {
        response.innerHTML = `<p>The slug "${json.slug}" has ${json.stats} uses and redirects to <a href="${json.url}">${json.url}</a>.</p>`;
      } else {
        response.innerHTML = `<p><b>Error: </b>${json.error}</p>`;
      }
      form.reset();
    });
});