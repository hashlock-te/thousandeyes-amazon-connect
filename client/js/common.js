async function teAgentInfo (hostName, accountGroupName, testName) {
  console.log("Querying /agentinfo...");
  let agentInfo = {};
  await $.ajax({
    url: `${metricsURL}/agentinfo?hostName=${hostName}&accountGroupName=${accountGroupName}&testName=${testName}`,
    method: "GET",
    crossDomain : true
  })
  .done(function(msg) {
    setCookie ("accountId", msg.message.accountId, 999);
    setCookie ("agentId", msg.message.agentId, 999);
    setCookie ("testId", msg.message.testId, 999);
    agentInfo = msg.message;
  })
  .fail(function (msg) {
    console.log("ThousandEyes /agentinfo failed: " + JSON.stringify(msg));
  });

  return agentInfo
}

async function teEndpointMetric (accountId, agentId, testId) {
  console.log("Querying ThousandEyes metrics...");
  $.ajax({
    url: `${metricsURL}/http?aid=${accountId}&agentId=${agentId}&testId=${testId}`,
    method: "GET",
    crossDomain : true
  })
  .done(function(msg) {
    var metric = msg.message.totalTime;
    $('#teServerResponse').html(`${metric} ms`);
    switch (metric) {
      case metric > 1000:
        $('#teServerResponse').css("background-color", "red");
        break;
      case metric > 500:
        $('#teServerResponse').css("background-color", "yellow");
        break;
      default:
        $('#teServerResponse').css("background-color", "greenyellow");
        break;
    }
    document.getElementById('teHealth').classList.add('green');
  })
  .fail(function (msg) {
    console.log("ThousandEyes query failed with response: " + JSON.stringify(msg));
  });

  $.ajax({
    url: `${metricsURL}/connection?aid=${accountId}&agentId=${agentId}&testId=${testId}`,
    method: "GET",
    crossDomain : true
  })
  .done(function(msg) {
    if (msg.message.wirelessProfile) {
      var quality = msg.message.wirelessProfile.quality;
      $('#teWifi').html(`${msg.message.wirelessProfile.quality} %`);
      switch (quality) {
        case quality < 50:
          $('#teWifi').css("background-color", "red");
          break;
        case quality < 75:
          $('#teWifi').css("background-color", "yellow");
          break;
        default:
          $('#teWifi').css("background-color", "greenyellow");
          break;
      }
    }
    else if (msg.message.hardwareType) {
      $('#teWifi').html(`${msg.message.hardwareType}`);
      $('#teWifi').css("background-color", "greenyellow");
    }
  })
  .fail(function (msg) {
    console.log("Failed with response: " + JSON.stringify(msg));
  });


  $.ajax({
    url: `${metricsURL}/network?aid=${accountId}&agentId=${agentId}&testId=${testId}`,
    method: "GET",
    crossDomain : true
  })
  .done(function(msg) {
    if (msg.message.avgLatency) {
      var latency = msg.message.avgLatency;
      $('#teLatency').html(`${latency} mS`);
      switch (latency) {
        case latency > 300:
          $('#teLatency').css("background-color", "red");
          break;
        case latency > 100:
          $('#teLatency').css("background-color", "yellow");
          break;
        default:
          $('#teLatency').css("background-color", "greenyellow");
          break;
      }
    } else {
      $('#teLatency').html(`- mS`);
      $('#teLatency').css("background-color", "#f2f2f2");
      console.log (msg.message)
    }
  })
  .fail(function (msg) {
    console.log("Failed with response: " + JSON.stringify(msg));
  });
}

async function teStatus () {
  console.log("TE Status");
  $('#teResponse').html("Querying ThousandEyes...");
  // getTEDate();
  var resp = $.ajax({
    url: `${metricsURL}/status`,
    method: "GET",
    crossDomain : true,
  })
  .done(function(msg) {
    var json = JSON.stringify(msg);
    $('#teResponse').html(json);
  })
  .fail(function (msg) {
    console.log("Failed with response: " + JSON.stringify(msg));
  });
  
}

// Storing values locally allows us to set/get cookie values 
// when running in a local dev environment.
let cookieCache = {};

function setCookie (name, value, days = null) {
  console.log (`Setting cookie ${name} to ${value}`);
  var expires = "";
  cookieCache[name] =  value;
  if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days*24*60*60*1000));
      expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie (name) {
  // console.log (`Getting cookie ${name}...`);
  var val = null;
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for(var i=0;i < ca.length;i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) val = c.substring(nameEQ.length,c.length);
  }

  // Check the cache. 
  if (!val) {
    val = cookieCache[name];
  }
  return val;
}

// function storageGet(keys) {
//   return new Promise(function (resolve, reject) {
//     chrome.storage.local.get(keys, function (items) {
//       if (chrome.runtime.lastError) {
//         reject(chrome.runtime.lastError.message);
//       } else {
//         if (items[keys] === undefined) {
//           reject("Key does not exist in local storage.");
//         } else {
//           resolve(items[keys]);
//         }
//       }
//     });
//   });
// }