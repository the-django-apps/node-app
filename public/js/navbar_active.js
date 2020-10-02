let page = window.location.href;
let page1 = page.split("//")[1];
let page2 = page1.split("/")[1];

let element = document.getElementById("brand_navbar");
let element1 = document.getElementById("gallery_navbar");
let element2 = document.getElementById("about_navbar");
let element3 = document.getElementById("event_navbar");
let element3_1 = document.getElementById("event_navbar_dropdown1");
let element3_2 = document.getElementById("event_navbar_dropdown2");
let element4 = document.getElementById("contact_navbar");
let element5 = document.getElementById("signup_navbar");
let element6 = document.getElementById("login_navbar");
let element7 = document.getElementById("account_navbar");
let element7_1 = document.getElementById("account_navbar_dropdown1");
let element7_2 = document.getElementById("account_navbar_dropdown2");

switch (page2) {
  case "gallery":
    element1.classList.add("activenavbar", "active");
    break;
  case "eventRegistration?eventFlag=eventRegistration":
    element3.classList.add("activenavbar", "active");
    element3_1.classList.add("activenavbardropdown");
    break;
  case "eventDashboard?eventFlag=eventDashboard":
    element3.classList.add("activenavbar", "active");
    element3_2.classList.add("activenavbardropdown");
    break;
  case "myaccount?accountOption=registeredEvents":
    element7.classList.add("activenavbar", "active");
    element7_1.classList.add("activenavbardropdown");
    break;
  case "myaccount?accountOption=resetPassword":
    element7.classList.add("activenavbar", "active");
    element7_2.classList.add("activenavbardropdown");
    break;
  case "about":
    element2.classList.add("activenavbar", "active");
    break;
  case "contact":
    element4.classList.add("activenavbar", "active");
    break;
  case "signup":
    element5.classList.add("activenavbar", "active");
    break;
  case "login":
    element6.classList.add("activenavbar", "active");
    break;
}
