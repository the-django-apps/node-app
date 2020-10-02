$(document).ready(function () {
  function toBase64(arr) {
    //arr = new Uint8Array(arr) if it's an ArrayBuffer
    return btoa(
      arr.reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
  }
  const galleryapifunction = async function () {
    const response = await fetch('http://127.0.0.1:3000/admin/gallery/api', {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const myData = await response.json()
    for (let i = 0; i < myData['gallery'].length; i++) {
      var x = document.getElementById(myData['gallery'][i]._id)
      x.setAttribute("width", "354");
      x.setAttribute("height", "228");
      x.src = 'data:image/jpeg;base64,' + toBase64(myData['gallery'][i].photo.data)
      x.style.padding = "5px 3px";
    }
  }
  galleryapifunction()
})