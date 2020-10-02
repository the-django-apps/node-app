function toBase64(arr) {
  //arr = new Uint8Array(arr) if it's an ArrayBuffer
  return btoa(arr.reduce((data, byte) => data + String.fromCharCode(byte), ""));
}

const galleryapifunction = async function (flag) {
  const response = await fetch(
    "http://127.0.0.1:3000/admin/gallery/" + flag + "/api"
  );
  const myData = await response.json();

  console.log(myData);
  var x = document.getElementById("image");

  x.src = "data:image/jpeg;base64," + toBase64(myData.photo.data);
};

galleryapifunction(document.getElementById("mydiv").dataset.test);
