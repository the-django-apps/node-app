var indoor1 = document.getElementById('list-indoor')
var indoorOption = $('#list-indoor-list')
var outdoorOption = $('#list-outdoor-list')
var indoorList = $('#list-indoor')
var outdoorList = $('#list-outdoor')

if (' <%-optionFlag%>' === 'indoor') {
  indoorOption.addClass("active")
  indoorOption.addClass("show")
  indoorList.addClass("active")
  indoorList.addClass("show")
  outdoorOption.removeClass("active")
  outdoorOption.removeClass("show")
  outdoorList.removeClass("active")
  outdoorList.removeClass("show")
} else if ('<%-optionFlag%>' === 'outdoor') {
  outdoorOption.addClass("active")
  outdoorOption.addClass("show")
  outdoorList.addClass("active")
  outdoorList.addClass("show")
  indoorOption.removeClass("active")
  indoorOption.removeClass("show")
  indoorList.removeClass("active")
  indoorList.removeClass("show")
}

function setOrUnsetDiscount(discountValue) {
   console.log(discountValue)
  if(discountValue === true) {
     $('#discount').val('/admin/discount?discount=set')
  }else {
     $('#discount').val('/admin/discount?discount=unset')
  }
}
setOrUnsetDiscount(<%-discount%>)