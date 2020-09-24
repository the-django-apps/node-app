if($(".loadImg").length === 0) {
    $(".loader").hide();
    $("#noImg").show()
  }
  $(".loadImg").on('load', function() {
    $(".loader").hide();
  })
  $(document).ready(async function () {

    function toBase64(arr) {
      //arr = new Uint8Array(arr) if it's an ArrayBuffer
      return btoa(
        arr.reduce((data, byte) => data + String.fromCharCode(byte), "")
      );
    }
    const galleryapifunction = async function () {
      const response = await fetch(
        "http://127.0.0.1:3000/admin/gallery/api",
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const myData = await response.json();

      for (let i = 0; i < myData["gallery"].length; i++) {
        var x = await document.getElementById(i);
        
        
        // x.setAttribute("width", "354");
        // x.setAttribute("height", "228");

        x.src =
          (await "data:image/jpeg;base64,") +
          toBase64(myData["gallery"][i].photo.data);
        // x.style.padding = "5px 3px";
      }
    };
    await galleryapifunction();
    //dynamic gallery script end //

    var gallery = document.querySelector("#gallery");
    var getVal = function (elem, style) {
      return parseInt(
        window.getComputedStyle(elem).getPropertyValue(style)
      );
    };
    var getHeight = function (item) {
      return item.querySelector(".content").getBoundingClientRect().height;
    };
    var resizeAll = function () {
      var altura = getVal(gallery, "grid-auto-rows");
      var gap = getVal(gallery, "grid-row-gap");
      gallery.querySelectorAll(".gallery-item").forEach(function (item) {
        var el = item;
        el.style.gridRowEnd =
          "span " + Math.ceil((getHeight(item) + gap) / (altura + gap));
      });
    };
    gallery.querySelectorAll("img").forEach(function (item) {
      // item.classList.add("byebye");
      // if (item.complete) {
      //   // console.log(item.src);
      // } else {
      item.addEventListener("load", function () {
        var altura = getVal(gallery, "grid-auto-rows");
        var gap = getVal(gallery, "grid-row-gap");
        var gitem = item.parentElement.parentElement;
        gitem.style.gridRowEnd =
          "span " + Math.ceil((getHeight(gitem) + gap) / (altura + gap));
        // item.classList.remove("byebye");
      });
      // }
    });
    window.addEventListener("resize", resizeAll);
    gallery.querySelectorAll(".gallery-item").forEach(function (item) {
      item.addEventListener("click", function () {
        item.classList.toggle("full");
      });
    });
  });