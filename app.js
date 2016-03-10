var xhttp = new XMLHttpRequest();

xhttp.onreadystatechange = function() {
  if (xhttp.readyState == 4 && xhttp.status == 200) {
    //console.log(xhttp.responseText);
    handleData(xhttp.responseText);
  }
};

xhttp.open("GET", "http://51.254.201.22:10888", true);
xhttp.send();

var listEvents = [];
var sortedListEvents = [];

var nowStr = new Date().toISOString().toString();
var nowYear = parseInt(nowStr.substr(0, nowStr.indexOf('-')));
nowStr = nowStr.slice(nowStr.indexOf('-')+1);
var nowMonth = parseInt(nowStr.substr(0, nowStr.indexOf('-')));
nowStr = nowStr.slice(nowStr.indexOf('-')+1);
var nowDay = parseInt(nowStr.substr(0, nowStr.indexOf('T')));

var now = {
  year: nowYear,
  month: nowMonth,
  day: nowDay
};

function handleData(data){
  var jcal = ICAL.parse(data);
  var comp = new ICAL.Component(jcal);
  handleComponent(comp);
}
function handleComponent(comp){
  var vevents = comp.getAllSubcomponents("vevent");
  vevents.forEach(handleVEvent);
  sortEvents();
  displayEvents();
}

function handleVEvent(vevent){
  var event = {
    summary : vevent.getFirstPropertyValue("summary").toString(),
    dtstamp : vevent.getFirstPropertyValue("dtstamp").toString(),
    dtstart : vevent.getFirstPropertyValue("dtstart").toString(),
    dtend : vevent.getFirstPropertyValue("dtend").toString(),
    location : vevent.getFirstPropertyValue("location").toString(),
    description : vevent.getFirstPropertyValue("description").toString()
  };

  var containsAurion = event.description.indexOf("AURION") > -1;
  var indexOfAurion = event.description.indexOf("AURION");
  var indexOfExported = event.description.indexOf("(Exported");
  var description = containsAurion ? event.description.substr(indexOfAurion + 7, indexOfExported - (indexOfAurion + 7)) : "";

  function addOneToHours(dtstart){
    var charToChange = dtstart.charAt(1);
    if (charToChange == "9") return (parseInt(charToChange)+1) + dtstart.slice(2, dtstart.length);
    return dtstart.charAt(0) + (parseInt(charToChange)+1) + dtstart.slice(2, dtstart.length);
  }

  var modifiedEvent = {
    summary : event.summary,
    dtstart : addOneToHours(event.dtstart.substr(event.dtstart.indexOf('T')+1, 5)),
    dtend : addOneToHours(event.dtend.substr(event.dtend.indexOf('T')+1, 5)),
    location : event.location,
    description : description
  };

  var startHours = modifiedEvent.dtstart.substr(0, modifiedEvent.dtstart.indexOf(':'));
  var startMinutes = modifiedEvent.dtstart.substr(modifiedEvent.dtstart.indexOf(':')+1, modifiedEvent.dtstart.length);
  var endHours = modifiedEvent.dtend.substr(0, modifiedEvent.dtend.indexOf(':'));
  var endMinutes = modifiedEvent.dtend.substr(modifiedEvent.dtend.indexOf(':')+1, modifiedEvent.dtend.length);
  var comparableTimeStart = startHours * 60 + startMinutes;
  var comparableTimeEnd = endHours * 60 + endMinutes;

  var date = event.dtstart.substr(0, event.dtstart.indexOf('T'));
  var dateYear = date.substr(0, date.indexOf('-'));
  date = date.substr(date.indexOf('-')+1, date.length);
  var dateMonth = date.substr(0, date.indexOf('-'));
  var dateDay = date.substr(date.indexOf('-')+1, date.length);

  var properEvent = {
    summary : modifiedEvent.summary,
    date : {year: dateYear, month: dateMonth, day: dateDay},
    duration : comparableTimeEnd - comparableTimeStart,
    timeStart : {hours: startHours + 1, minutes: startMinutes},
    timeEnd : {hours: endHours + 1, minutes: endMinutes},
    dtstart : modifiedEvent.dtstart,
    dtend : modifiedEvent.dtend,
    location : modifiedEvent.location.substr(0, 4),
    description : modifiedEvent.description
  };

  var compare = isSecondDateAfterFirst(now, properEvent.date);
  if (compare == 0 || compare == 1)
    listEvents.push(properEvent);

}

function sortEvents(){
  listEvents.forEach(insertEvent);
}
function insertEvent(event){
  if (sortedListEvents.length === 0) { sortedListEvents.push(event); return; }
  for (var i = 0; i < sortedListEvents.length; i++){
    var compareDate = isSecondDateAfterFirst(event.date, sortedListEvents[i].date);
    if (compareDate === 1){
      sortedListEvents.splice(i, 0, event);
      return;
    }
    if (compareDate === 0){
      var compareTime = isSecondTimeAfterFirst(event.timeStart, sortedListEvents[i].timeStart);
      if (compareTime === 1){
        sortedListEvents.splice(i, 0, event);
        return;
      }
    }
  }
  sortedListEvents.push(event);
}

function isSecondDateAfterFirst(date1, date2){
  if (date1.year > date2.year) return -1;
  if (date1.month > date2.month) return -1;
  if (date1.day > date2.day) return -1;
  if (date1.day == date2.day && date1.month == date2.month && date1.year == date2.year) return 0;
  return 1;
}

function isSecondTimeAfterFirst(time1, time2){
  if (time1.hours > time2.hours) return -1;
  if (time1.minutes > time2.minutes) return -1;
  if (time1.hours == time2.hours && time1.minutes == time2.minutes) return 0;
  return 1;
}

function displayEvents(){
  sortedListEvents.forEach(function(properEvent){
    var e = document.createElement('div');
    e.classList.add('calendarEvent');
    e.innerHTML = "";
    e.innerHTML += "From: " + properEvent.dtstart + " ";
    e.innerHTML += "To: " + properEvent.dtend + " ";
    e.innerHTML += properEvent.date.day + "/" + properEvent.date.month + " ";
    e.innerHTML += " " + properEvent.location;
    e.innerHTML += " " + properEvent.description;
    e.innerHTML += " " + properEvent.summary;
    document.body.appendChild(e);
  });
}