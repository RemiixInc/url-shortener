// Import packages
const express = require("express");
const app = express();
const lowdb = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("db.json");
const db = lowdb(adapter);
const ratelimit = require("express-rate-limit-ide");
const bodyParser = require("body-parser");

// Ratelimit the API
const apilimiter = ratelimit({
  windowMs: 60000, // 1m
  max: 30, // 60 requests per minute
  message: {
    success: false,
    error: "Too many requests received. Try again in a minute."
  }
});
app.use("/api/", apilimiter);

// Serve static files in the public folder
app.use(express.static("public"));

// Parse json sent in requests
var jsonParser = bodyParser.json();

// Set JSON indentation
app.set("json spaces", 2);

// Homepage
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Stats Page
app.get("/stats", (req, res) => {
  res.sendFile(__dirname + "/views/stats.html");
});

// Delete Page
app.get("/delete", (req, res) => {
  res.sendFile(__dirname + "/views/delete.html");
});

// API Homepage
app.get("/api", (req, res) => {
  res.sendFile(__dirname + "/views/api.html");
});

// Create API
app.post("/api/create", jsonParser, (req, res) => {
  // Get variables from request body
  var url = req.body.url;
  var slug = req.body.slug;

  // Check if URL exists
  if (!url)
    return res
      .status(400)
      .json({ success: false, error: "No URL was provided." });

  // Check if input is URL
  if (checkurl(url) === false)
    return res
      .status(400)
      .json({ success: false, error: "The URL provided is invalid" });

  // Check if URL points to the URL shorteners domain
  if (url.includes(req.get("host")))
    return res.status(400).json({
      success: false,
      error: "Long URLs cannot point to the URL shortener domain."
    });

  // Generate delete token
  var token = random(30);

  // If there is a custom slug
  if (slug) {
    // Check if slug is taken
    if (
      db
        .get("urls")
        .find({ slug: slug })
        .value()
    )
      return res.status(400).json({
        success: false,
        error: "The requested slug is already in use."
      });

    // Add to db
    db.get("urls")
      .push({ slug: slug, url: url, token: token, stats: 0 })
      .write();
    // Return URL
    return res
      .status(200)
      .json({ success: true, slug: slug, url: url, token: token });

    // If there is no custom slug
  } else {
    // Generate random stuff
    var slug = random(5);

    // Check if slug is taken (better handler for this coming soon)
    if (
      db
        .get("urls")
        .find({ slug: slug })
        .value()
    )
      slug = random(5);

    // Add to db
    db.get("urls")
      .push({ slug: slug, url: url, token: token, stats: 0 })
      .write();

    // Return URL
    return res
      .status(200)
      .json({ success: true, slug: slug, url: url, token: token });
  }
});

app.post("/api/stats", jsonParser, (req, res) => {
  // Get variables from request body
  var slug = req.body.slug;

  // Check if slug is provided
  if (!slug)
    return res.status(400).json({ success: false, error: "Slug is missing." });

  // Check if slug in the database
  const result = db
    .get("urls")
    .find({ slug: slug })
    .value();

  // If no slug exists with that name
  if (!result)
    return res.status(400).json({ success: false, error: "Invalid slug." });

  // Return info
  return res.status(200).json({
    success: true,
    slug: result.slug,
    url: result.url,
    stats: result.stats
  });
});

// Delete API
app.post("/api/delete", jsonParser, (req, res) => {
  var token = req.body.token;
  var slug = req.body.slug;

  // Check if slug and token are provided
  if (!slug || !token)
    return res
      .status(400)
      .json({ success: false, error: "Slug or token is missing." });

  // Check if slug and token exist in the database
  const result = db
    .get("urls")
    .find({ slug: slug, token: token })
    .value();

  // If token or slug doesn't exist
  if (!result)
    return res
      .status(400)
      .json({ success: false, error: "Invalid slug or token." });

  // Delete slug
  db.get("urls")
    .remove({ slug: slug, token: token })
    .write();

  // Send success message
  return res.status(200).json({ success: true });
});

// Slugs redirect + 404
app.get("*", (req, res) => {
  // Get current path and slice off the first slash
  var slug = req.path.slice(1);

  //  Get info for current url
  var result = db
    .get("urls")
    .find({ slug: slug })
    .value();

  // If there is no matching slug, return 404 page
  if (!result) return res.status(404).sendFile(__dirname + "/views/404.html");

  // Add 1 to the stats count for that slug
  db.get("urls")
    .find({ slug: slug })
    .assign({ stats: result.stats + 1 })
    .write();

  // Redirect to URL
  return res.redirect(result.url);
});

// Start app
const listener = app.listen(8080, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

// Check URL
function checkurl(string) {
  var url = "";
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

// Random character generator
function random(length) {
  var result = "";
  var characters = "abcdefghijkmnopqrstuvwxyz0123456789";
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Set defaults for database
db.defaults({
  urls: []
}).write();