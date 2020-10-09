function setDateOfEditIndoorEvent(setDate,index) {
    var date = new Date(setDate)
    var day = document.getElementById('day'+index)
    var month = document.getElementById('month'+index)
    var year = document.getElementById('year'+index)
   
    if(day) {
        day.value = date.getDate()
    }
    if(month){
        month.value = date.getMonth() + 1
    }
    if(year){
        year.value = date.getFullYear()
    }
   
   
}
function setDateOfEditOutdoorEvent(setDate,index) {
    var date = new Date(setDate)
    var oday = document.getElementById('oday'+index)
    var omonth = document.getElementById('omonth'+index)
    var oyear = document.getElementById('oyear'+index)

    if(oday){
        oday.value = date.getDate()
    }
    if(omonth){
        omonth.value = date.getMonth() + 1
    }
    if(oyear){
        oyear.value = date.getFullYear()
    }    
}

function allowOrNotRegIndoor(regFlag,index) {
    var reg =  document.getElementById('reg'+index)
    
    if(reg) {
        if(regFlag === 'false') {
            reg.selectedIndex = "1"
        }else {
            reg.selectedIndex = "0"
        }  
    }
    
}


function allowOrNotRegOutdoor(regFlag,index) {
    var oreg = document.getElementById('oreg'+index)
    
    if(oreg){
        if(regFlag === 'false') {
            oreg.selectedIndex = "1"
        }else {
            oreg.selectedIndex = "0"
        }  
    }
      
}


function setOrUnsetDiscount(discountValue) {
    if (discountValue === true) {
       $('#discount').val('/admin/discount?discount=set')
    } else {
       $('#discount').val('/admin/discount?discount=unset')
    }
 }

