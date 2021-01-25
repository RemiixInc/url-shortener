function copytoken() {
  document.getElementById("token").select();
  document.execCommand("copy");
  var notyf = new Notyf();
  notyf.success("Delete Token Copied to Clipboard");
}