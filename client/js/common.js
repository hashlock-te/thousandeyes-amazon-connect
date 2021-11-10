async function teEndpointMetric (testId) {
  console.log("TE Endpoint");
  $('#teResponse').html("Querying ThousandEyes...");
  // $('#teMetric').html(`- ms`);
  // $('#teLatency').html(`- ms`);
  // $('#teMetric').css("background-color", "#F2F2F2");
  var r1 = Math.floor(Math.random() * 10);
  var r2 = Math.floor(Math.random() * 10);
  var r3 = 90 + Math.floor(Math.random() * 10);
  // $('#teMetric').html('<img  src="images/loading.gif" height="25px" width="25px">');
  // $("#display_loading").show();
  // getTEDate();
  var resp = $.ajax({
    // https://jur5bq3i8a.execute-api.us-east-1.amazonaws.com/dev/endpoint
    url: `${metricsURL}/http`,
    method: "GET",
    crossDomain : true
  })
  .done(function(msg) {
    var metric = msg['message']['endpointWeb']['httpServer'][0]['totalTime'];
    $('#teServerResponse').html(`${metric}.${r1} ms`);
    $('#teServerResponse').css("background-color", "greenyellow");
    document.getElementById('teHealth').classList.add('green');
    $('#teLatency').html(`98.${r2} ms`);
    $('#teWifi').html(`${r3} %`);
    // 
    // var json = JSON.stringify(msg);
    $('#teResponse').html(metric);
  })
  .fail(function (msg) {
    var json = JSON.stringify(msg);
    console.log("Failed with response: " + JSON.stringify(msg));
    $('#teResponse').html(json);
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
    // user: user,
    // password: password
  })
  .done(function(msg) {
    var json = JSON.stringify(msg);
    $('#teResponse').html(json);
  })
  .fail(function (msg) {
    console.log("Failed with response: " + JSON.stringify(msg));
  });
  
}

function storageGet(keys) {
  return new Promise(function (resolve, reject) {
    chrome.storage.local.get(keys, function (items) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      } else {
        if (items[keys] === undefined) {
          reject("Key does not exist in local storage.");
        } else {
          resolve(items[keys]);
        }
      }
    });
  });
}

/*
 * Loads all (default) or a specific (provided by tag) templates json file(s) and parses them.
 */
async function loadTemplates(tag = null) {
  let templates = {};

  let packageDir = await getPackageDirectoryEntry();
  let packageDirChildren = await listDirectoryChildren(packageDir);
  let templatesDir;
  for (let i = 0; i < packageDirChildren.length; i++) {
    let child = packageDirChildren[i];
    if (child.isDirectory) {
      if (child.name == "templates") {
        templatesDir = child;
      }
    }
  }
  if (templatesDir === undefined) {
    throw new Error("Templates directory is missing.");
  }

  let templatesDirChildren = await listDirectoryChildren(templatesDir);
  let templateFiles = [];
  for (let i = 0; i < templatesDirChildren.length; i++) {
    let child = templatesDirChildren[i];
    if (child.isFile) {
      if (child.name.split(".").pop() == "json") {
        if (tag == null || tag == child.name.split(".").slice(0, -1).join("."))
          templateFiles.push(child);
      }
    }
  }

  for (let i = 0; i < templateFiles.length; i++) {
    let fileText;
    try {
      fileText = await readFile(packageDir, templateFiles[i]);
    } catch (e) {
      throw new Error("Error opening templates/" + templateFiles[i].name);
    }
    let fileJson;
    try {
      fileJson = JSON.parse(fileText);
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error(
          e.message + " of " + templateFiles[i].name + ":\n" + fileText
        );
      } else {
        throw new Error(e);
      }
    }
    let key = templateFiles[i].name.split(".").slice(0, -1).join(".");
    templates[key] = fileJson;
  }

  return new Promise(function (resolve, reject) {
    if (
      templates !== undefined &&
      Object.getOwnPropertyNames(templates).length > 0
    ) {
      resolve(templates);
    } else {
      reject("No valid templates are present in templates directory.");
    }
  });
}

function makeRequest(url, method, headers, payload) {
  var request = new XMLHttpRequest();
  request.name = name;
  return new Promise(function (resolve, reject) {
    // Setup our listener to process compeleted requests
    request.onreadystatechange = function () {
      // Only run if the request is complete
      if (request.readyState !== 4) return;
      // Process the response
      if (request.status >= 200 && request.status < 300) {
        // If successful
        try {
          request.responseJSON = JSON.parse(request.responseText);
        } catch { }
        resolve(request);
      } else {
        // If failed
        try {
          request.responseJSON = JSON.parse(request.responseText);
        } catch { }
        reject(request);
      }
    };
    request.open(method || "GET", url, true);
    for (key in headers) {
      request.setRequestHeader(key, headers[key]);
    }
    request.send(payload);
  });
}

async function makeApiRequest(urlPath, method, aid, json) {
  let url = "https://api.thousandeyes.com" + urlPath;
  let apiCredentials = await storageGet(["apiCredentials"]);
  let headers = {
    Authorization:
      "Basic " + btoa(apiCredentials.email + ":" + apiCredentials.token),
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (aid !== undefined && aid > 0) {
    let u = new URL(url);
    u.searchParams.append("aid", aid);
    url = u.href;
  }
  let payload = json;
  if (typeof json != "string") {
    payload = JSON.stringify(json);
  }

  return makeRequest(url, method, headers, payload).catch(async function (
    rejectedRequest
  ) {
    if (rejectedRequest.status == 429) {
      showRateWarning(true);
      let te_date, d;
      await getTEDate()
        .then((time) => {
          te_date = Math.round(time / 1000);
        })
        .catch((r) => {
          d = Math.round(Date.now() / 1000);
        });

      let resetTime = rejectedRequest.getResponseHeader(
        "X-Organization-Rate-Limit-Reset"
      );
      let resetSeconds = resetTime - (te_date || d) + 1;
      console.log(
        "API Rate limit reached. Retrying once in " + resetSeconds + " seconds."
      );
      await new Promise((r) => setTimeout(r, resetSeconds * 1000));
      showRateWarning(false);
      return makeRequest(url, method, headers, payload);
    } else {
      throw rejectedRequest;
    }
  });
}

function getTEDate() {
  let request = new XMLHttpRequest();
  return new Promise(function (resolve, reject) {
    // Setup our listener to process compeleted requests
    request.onreadystatechange = function () {
      // Only run if the request is complete
      if (request.readyState !== 4) return;
      // Process the response
      if (request.status == 200) {
        // If successful
        request.responseJSON = JSON.parse(request.responseText);
        resolve(request.responseJSON["timestamp"]);
      } else {
        reject(request);
      }
    };
    // request.open("GET", "https://api.thousandeyes.com/v6/status.json", true);
    // 
    request.open("GET", `${metricsURL}`, true);
    request.send();
  });
}

/*
 * Async wrappers for chrome.runtime methods
 */

function getPackageDirectoryEntry() {
  return new Promise((resolve, reject) => {
    chrome.runtime.getPackageDirectoryEntry((root) => {
      if (root) {
        resolve(root);
      } else {
        reject();
      }
    });
  });
}

/*
 * Higher level async abstractions of chrome.runetime methods
 */

function listDirectoryChildren(directoryEntry) {
  return new Promise((resolve, reject) => {
    let dirReader = directoryEntry.createReader();
    dirReader.readEntries((children) => {
      if (children) {
        resolve(children);
      } else {
        reject();
      }
    });
  });
}

function readFile(packageDir, file) {
  return new Promise((resolve, reject) => {
    packageDir.getFile(file.fullPath, {}, function (fileEntry) {
      fileEntry.file(function (f) {
        let reader = new FileReader();
        reader.onloadend = function (e) {
          if (e.target.result && e.target) {
            resolve(e.target.result);
          } else {
            reject(e);
          }
        };
        reader.onerror = function (e) {
          reject(e);
        };
        reader.onabort = function (e) {
          reject(e);
        };
        reader.readAsText(f);
      });
    });
  });
}

function setVersion() {
  document.getElementById("foot").innerHTML = document
    .getElementById("foot")
    .innerHTML.replace(/VERSION/g, "v" + chrome.runtime.getManifest().version);
}
