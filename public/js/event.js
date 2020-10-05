function discountCheck(eventLength, eventName) {
  var eventsTotal = 0
  for (var i = 0; i < eventLength; i++) {
    var rergisteredEvent = document.getElementsByClassName(eventName + i)
    if (rergisteredEvent[2].checked) {
      if (<%- discount %> && totalSelectedEvent > 1) {
        var discountOnEvent = (parseInt(rergisteredEvent[0].innerHTML) * rergisteredEvent[1].innerHTML.slice(0, parseInt(rergisteredEvent[1].innerHTML.length) - 1)) / 100
        eventsTotal += parseInt(rergisteredEvent[0].innerHTML) - discountOnEvent
      } else {
        eventsTotal += parseInt(rergisteredEvent[0].innerHTML)
      }
    }
  }
  return eventsTotal
}

$("#registration-form").submit(function (e) {
  totalSelectedEvent = 0
  var allInputs = document.getElementsByTagName('input')
  for (value in allInputs) {
    if (allInputs[value].checked) {
      totalSelectedEvent++
    }
  }
  var indoorDiscount = discountCheck(<%- indoorevents.length %>, 'indoor')
  var outdoorDiscount = discountCheck(<%- outdoorevents.length %>, 'outdoor')
  return confirm(" Your total price is (" + (indoorDiscount + outdoorDiscount) + "Rs)" + "\n Do you like to register?");
})