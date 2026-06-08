import React from 'react';
import { createRoot } from 'react-dom/client';
import { Meteor } from 'meteor/meteor';
import { App } from '/imports/ui/App';
import { Tracker } from "meteor/tracker";
import { queueMethod } from 'meteor/jam:offline';
import '../imports/api/offline';
import _ from 'lodash';
import { DeviceMessages } from '../imports/api/deviceMessages';

const injectUserID = () => {
  const FAKE_USER_ID = 'fake-user-12345';
  const FAKE_USER_OBJECT = {
    _id: FAKE_USER_ID,
    username: 'dev_mock_user',
    emails: [{ address: 'mock@example.com', verified: true }],
    profile: { name: 'Development Mock Account' }
  };

  // 2. Create a local reactive dependency to satisfy Tracker blocks
  const userIdDep = new Tracker.Dependency();

  // 3. Override Meteor's core authentication methods
  Meteor.userId = () => {
    userIdDep.depend(); // Registers this function as reactive
    return FAKE_USER_ID;
  };

  Meteor.user = () => {
    userIdDep.depend();
    return FAKE_USER_OBJECT;
  };

  Meteor.loggingIn = () => {
    return false;
  };

  // 4. Force an initial flush to let packages know a user exists right away
  Tracker.nonreactive(() => {
    userIdDep.changed();
  });

  console.log(" Injected reactive fake user session:", FAKE_USER_ID);
}
Meteor.startup(async () => {

  injectUserID()
  document.addEventListener('deviceready', function () {
    // cordova.plugins.backgroundMode is now available
    console.log('Device is ready, cordova.plugins.backgroundMode is available');
    cordova.plugins.backgroundMode.setEnabled(true);
    // setInterval(()=>{
    // cordova.plugins.backgroundMode.isActive()?console.log('Background mode is active') : console.log('Background mode is not active');
    // },5000)

    const deviceUuid = window.device.uuid;
    // Reactively track network connectivity states
    Tracker.autorun(() => {
      const status = Meteor.status();

      if (Meteor.isCordova && status.connected) {
        // Announce device existence and tie session ID to hardware UUID
        Meteor.call('devices.registerHeartbeat', deviceUuid, (err) => {
          if (err) console.error("Tracking registration failed:", err);
        });
      }
    });

    Meteor.subscribe('device.messages', deviceUuid);

    Tracker.autorun(() => {
      // This triggers automatically whenever sendToDevice() is called on the server
      const latestMessage = DeviceMessages.findOne({ deviceUuid: deviceUuid }, { sort: { createdAt: -1 } });
      console.log('Tracker autorun triggered for device messages. Latest message:', latestMessage);
      if (latestMessage) {
        console.log("Received payload from server:", latestMessage.payload);
        // Execute hardware/UI logic here!
      }
    });
  }, false);
  console.log('Meteor client started');
  let liRecords = [];
  const subscribeAndWait = (name, ...args) => {
    return new Promise((resolve, reject) => {
      const handle = Meteor.subscribe(name, ...args, {
        onReady: () => resolve(handle),
        onError: (err) => reject(err)
      });
    });
  };

  try {
    await navigator.serviceWorker.register('/sw.js'); // must match the name given to your service work file
    const container = document.getElementById('react-target'); //react-target is the id of the div in main.html where we want to render our React app
    const handle = Meteor.subscribe('collectionUp');

    if (handle.ready()) {
      console.log("Subscription ready. Check IndexedDB now!");
    }

    window.addEventListener('message', async message => {
      try {
        if(['meteor-data-performance','ddp-event','minimongo-get-collections'].includes(message.data.eventType)){          return        }
        if(typeof(message.data)==='string'&& message.data.startsWith('Meteor._setImmediate')){return}
        let m = "";
        console.log('🔴METEROR-FRONT: Received message from pwa:\n'+message.data);
        let messageObj = JSON.parse(message.data)
        const deviceId = window.device ? window.device.uuid : 'browser-dev-id';
        switch (messageObj.type) {
          case "save":
            if (messageObj.data) {
                    
              await Meteor.applyAsync('collectionUp.insert', [{ ...messageObj.data }, deviceId], { noRetry: true }
                , (err, res) => { if (err) { console.log('method failed', err) } });
              if (!Meteor.status().connected) {
                console.log('***********OFFLINE NOW,queue Method collectionUp.insert for later')
                queueMethod('collectionUp.insert', { ...messageObj.data }, deviceId)
              }
            } else {
              console.error('No collectionUp data found in message');
            }
            break;
          case "update":
            if (messageObj.data) {
              console.log('updating')

              // Optimistically update local cache
              await Meteor.applyAsync('collectionUp.update', [{...messageObj.data}, deviceId], { noRetry: true });

              if (!Meteor.status().connected) {
                // Spread the arguments array so jam:offline handles the data parameter perfectly
                queueMethod('collectionUp.update', {...messageObj.data}, deviceId);
              }


              console.log('CollectionUp updated:', messageObj.data);
            } else {
              console.error('update error');
            }
            break;
          case "delete":
            // Strict check: Ensure messageObj.data exists AND contains an _id
            if (messageObj.data && messageObj.data._id) {
              console.log('deleting collectionUp ID:', messageObj.data._id);

              const targetId = messageObj.data._id;
              const deleteArgs = [targetId, deviceId];

              // { noRetry: true } prevents this promise from hanging indefinitely while offline,
              // allowing the code execution to smoothly fall through to your queue logic.
              await Meteor.applyAsync('collectionUp.remove', deleteArgs, { noRetry: true });


              // Check connection status to queue the replay mechanism
              if (!Meteor.status().connected) {
                console.log('***********OFFLINE NOW, queueing Method collectionUp.remove for later');

                // Pass the plain targetId string cleanly to the queue
                queueMethod('collectionUp.remove', targetId, deviceId);
              } else {
                console.log('***********Nothing need to Queue')
              }

              console.log('CollectionUp deleted from local view:', messageObj.data);
            } else {
              console.error('Delete error: messageObj.data or _id property is missing.');
            }
            break;
          case "refresh":
            // console.log(collectionUp)
            console.log(messageObj.collection)
            console.log(`METEOR-FRONT:  will fetch latest collectionUp `)

            liRecords = await Meteor.callAsync('collectionUp.read');

            console.log('METEOR-FRONT: Fetched latest collectionUp from Meteor local collection:')
            console.log(liRecords)
            console.log('🟥METEOR-FRONT:Sending liRecords from meteor to pwa')
            let iframe = document.getElementById("dse-front");
            if (iframe) {
              iframe?.contentWindow?.postMessage(JSON.stringify({ 'type': 'refresh', 'from': 'meteor-front', 'data': liRecords }), '*');

            }

            break;

          default:
            console.log('Unknown message type');
        }


        return m;
      }
      catch { (err) => { console.log(err) } }
    });


    const root = createRoot(container);
    root.render(<App />);
  }
  catch (error) {
    console.error('Service Worker registration failed:', error);
  }
});

