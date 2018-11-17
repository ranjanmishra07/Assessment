const express = require('express');

const app = express();
const PORT = 8080;

app.use('/process/*', (req, res) => {
  const durationTime = Math.floor(Math.random() * 16) + 15;
  setTimeout((() => {
    res.json({
      time: Date.now(),
      method: req.method,
      path: req.path,
      headers: req.headers,
      query: req.query,
      body: req.body,
      duration: `${durationTime} ms`,
    });
  }), durationTime * 1000);
});

let requests = [];
let getRequests = [];
let postRequests = [];
let putRequests = [];
const requestTrimThreshold = 5000;
const requestTrimSize = 4000;
app.use((req, res, next) => {
  requests.push(Date.now());
  if (requests.length > requestTrimThreshold) {
    requests = requests.slice(0, requests.length - requestTrimSize);
  }
  if (req.method === 'GET') {
    getRequests.push(Date.now());
    if (getRequests.length > requestTrimThreshold) {
      getRequests = getRequests.slice(0, getRequests.length - requestTrimSize);
    }
  } else if (req.method === 'POST') {
    postRequests.push(Date.now());
    if (postRequests.length > requestTrimThreshold) {
      postRequests = postRequests.slice(0, postRequests.length - requestTrimSize);
    }
  } else if (req.method === 'PUT') {
    putRequests.push(Date.now());
    if (putRequests.length > requestTrimThreshold) {
      putRequests = putRequests.slice(0, putRequests.length - requestTrimSize);
    }
  }
  next();
});

function timelyStats(timeDuration, requestsType) {
  const now = Date.now();
  const timeAgo = now - (timeDuration);
  let count = 0;
  for (let i = requestsType.length - 1; i >= 0; i -= 1) {
    if (requestsType[i] >= timeAgo) {
      ++count;
    } else {
      break;
    }
  }
  return count;
}
app.use('/stats', (req, res) => {
  const timeSinceSeverStartup = `${process.uptime() * 1000} ms`;
  const requestsMadeSinceServerStartup = requests.length;
  const avgResTimeSinceServerStartup = `${process.uptime() / requestsMadeSinceServerStartup} s`;
  const requestsMade = `${getRequests.length} GET Requests,
                        ${postRequests.length} POST Requests,
                        ${putRequests.length} PUT Requests`;
  const requestsMadeLastMinute = `${timelyStats(1000 * 60, getRequests)} GET Requests,
                                  ${timelyStats(1000 * 60, postRequests)} POST Requests,
                                  ${timelyStats(1000 * 60, postRequests)} PUT Requests,`;
  const requestsMadeLastHour = `${timelyStats(1000 * 60 * 24, getRequests)} GET Requests,
                                  ${timelyStats(1000 * 60 * 24, postRequests)} POST Requests,
                                  ${timelyStats(1000 * 60 * 24, postRequests)} PUT Requests,`;
  res.json({
    timeSinceSeverStartup,
    method: req.method,
    requestsMadeSinceServerStartup,
    requestsMade,
    avgResTimeSinceServerStartup,
    requestsMadeLastMinute,
    requestsMadeLastHour,
    resTimeForEachReq: requests[requests.length - 1] - requests[requests.length - 2],
  });
});

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
