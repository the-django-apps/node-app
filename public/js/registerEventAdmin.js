function submitUncheckboxValues() {
    var perms = []
    $(".userInEventFlag").each(function() {
      var participantId = this.value
      if(!($(this).prop("checked"))) {
        console.log('hello')
        perms.push(participantId)
      }
      
    });
    $("#unchecked-checkboxes").val(JSON.stringify(perms));
  }



  function tickCheckboxOfParticipant(userInEventFlag,id) {
    // var newuserInEventFlagArray = userInEventFlagArray.split(',')
    // var allCheckboxes = document.getElementsByClassName('userInEventFlag')
    
    // for(var i = 0; i < newuserInEventFlagArray.length ; i++) {
    
    //   if(newuserInEventFlagArray[i] === 'false') {
       
    //     allCheckboxes[i].checked = true;
    //   }
    // }
    var tickCheckbox = document.getElementById(id)

    if(userInEventFlag === 'false') {
      tickCheckbox.checked = true
    }

  }