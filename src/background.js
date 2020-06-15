global.browser = require('webextension-polyfill');

var current;
var timeout;
var running = false;
// var sound = new Audio('resources/sound.mp3');
// sound.play();

const states = {
  READY: 'ready',
  RUNNING: 'running',
};

var state = states.READY;

const timeDefault = {
  // setting default values
  easy: '900', // 15 mins
  medium: '1200', // 20 mins
  hard: '1800', // 30 mins
};

var difficultyToTimeMap = {
  easy: timeDefault.easy,
  medium: timeDefault.medium,
  hard: timeDefault.hard,
};

var getOptionsData = function() {
  chrome.storage.sync.get(
    {
      easy: timeDefault.easy,
      medium: timeDefault.medium,
      hard: timeDefault.hard,
    },
    function(items) {
      difficultyToTimeMap.easy = items.easy;
      difficultyToTimeMap.medium = items.medium;
      difficultyToTimeMap.hard = items.hard;
      console.log(items);
    }
  );
};
getOptionsData();

// update on options changed
chrome.storage.onChanged.addListener(function(changes, areaName) {
  getOptionsData();
});

function popNotification() {
  var message_index = Math.round(Math.random() * (messages.length - 1));
  var message = '"' + messages[message_index] + '"';
  chrome.storage.sync.get({ reqClick: 'yes' }, function(items) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'Timer.png',
      title: chrome.i18n.getMessage('timeUp'),
      message: message,
      contextMessage: new Date().toLocaleTimeString(), // in gray text
      eventTime: Date.now(), // add a event time stamp
      isClickable: true, // show hand pointer when hover
      requireInteraction: items.reqClick === 'yes', // if true, do not close until click
    });
  });
}

// Send a request from the extension to a content script
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
  chrome.tabs.sendMessage(tabs[0].id, { greeting: 'hello' }, function(response) {
    console.log(response.farewell);
  });
});

// Receive messages from content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log(sender.tab ? 'from a content script:' + sender.tab.url : 'from the extension');
  if (request.action === 'stop_icon') {
    alert('stop icon');
    chrome.browserAction.setIcon({ path: 'icons/icon_stop_128.png' });
    chrome.tabs.query({ active: true, windowType: 'normal', currentWindow: true }, function(d) {
      var tabId = d[0].id;
      chrome.browserAction.setIcon({ path: 'icons/icon_stop_128.png', tabId: tabId });
    });
  }
  if (request.action === 'send_data') {
    sendResponse({ data: difficultyToTimeMap });
  }
  // if (request.greeting == 'hello') sendResponse({ farewell: 'goodbye' });
});

// start timer
function start() {
  chrome.browserAction.setIcon({ path: 'icons/icon_stop_128.png' });
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'timer_start' }, function(response) {
      console.log(response.message);
    });
  });
  state = states.RUNNING;
}

// stop timer
function stop() {
  chrome.browserAction.setIcon({ path: 'icons/icon_play_128.png' });
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'timer_stop' }, function(response) {
      console.log(response.message);
    });
  });
  state = states.READY;
}

// icon clicked
chrome.browserAction.onClicked.addListener(function() {
  switch (state) {
    case states.READY:
      start();
      break;
    case states.RUNNING:
      stop();
      break;
  }
});
// chrome.notifications.onClicked.addListener(function(notificationid) {
//   chrome.notifications.clear(notificationid);
// });

// chrome.tabs.onActivated.addListener(function(activeInfo) {
//   alert('onActivated');
//   chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//     let url = tabs[0].url;
//     // use `url` here inside the callback because it's asynchronous!
//     alert(url);
//   });
// });

// chrome.tabs.onUpdated.addListener(function(tabID, info, tab) {
//   alert('onUpdated');
// });
