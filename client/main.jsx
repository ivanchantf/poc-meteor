import React from 'react';
import { createRoot } from 'react-dom/client';
import { Meteor } from 'meteor/meteor';
import { App } from '/imports/ui/App';
import { Tasks } from '../imports/api/tasks';
import { Tracker } from "meteor/tracker";
import { queueMethod } from 'meteor/jam:offline';
import '../imports/api/offline';
import _ from 'lodash';


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

    // if (Meteor.isCordova) {
    //   const deviceId = window.device.uuid;
    //   console.log('Device ID obtained:', deviceId);
    //   // Send it to the backend immediately upon startup
    //   Meteor.call('devices.register', deviceId, (error, result) => {
    //     if (error) {
    //       console.error('Failed to send device ID to server:', error);
    //     } else {
    //       console.log('Device ID successfully registered on server');
    //     }
    //   });
    // }

    
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
    const handle = Meteor.subscribe('tasks');

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
       

              // const generateUniqueId = () => {
              //   let generateRandomString = (length) => {
              //     const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
              //     let result = '';
              //     for (let i = 0; i < length; i++) {
              //       result += chars.charAt(Math.floor(Math.random() * chars.length));
              //     }
              //     return `${new Date().getTime()}-${result}`;
              //   }
              //   return `${new Date().getTime()}_${generateRandomString(10)}`;
              // }

              // let uid = generateUniqueId()
             
              await Meteor.applyAsync('tasks.insert', [{ ...messageObj.data }, deviceId], { noRetry: true }
                , (err, res) => { if (err) { console.log('method failed', err) } });
              if (!Meteor.status().connected) {
                console.log('***********OFFLINE NOW,queue Method tasks.insert for later')
                queueMethod('tasks.insert', { ...messageObj.data }, deviceId)
              }


                  // const pushToDSEBackend = async () => {
                  //   console.log('Pushing data to DSE backend:', messageObj.data);
                  //               await Meteor.applyAsync('pushToDSEBackend', [messageObj.data]);
    
                  //               if (!Meteor.status().connected) {
                  //                 // Spread the arguments array so jam:offline handles the data parameter perfectly
                  //                 queueMethod('pushToDSEBackend', messageObj.data);
                  //               }
                  // }
                  // pushToDSEBackend()


            } else {
              console.error('No task data found in message');
            }
            break;
          case "update":
            if (messageObj.data) {
              console.log('updating')
              const updateArgs = [{...messageObj.data}, deviceId];

              // Optimistically update local cache
              await Meteor.applyAsync('tasks.update', updateArgs, { noRetry: true });

              if (!Meteor.status().connected) {
                // Spread the arguments array so jam:offline handles the data parameter perfectly
                queueMethod('tasks.update', {...updateArgs}, deviceId);
              }


              console.log('Task updated:', messageObj.data);
            } else {
              console.error('update error');
            }
            break;
          case "delete":
            // Strict check: Ensure messageObj.data exists AND contains an _id
            if (messageObj.data && messageObj.data._id) {
              console.log('deleting task ID:', messageObj.data._id);

              const targetId = messageObj.data._id;
              const deleteArgs = [targetId, deviceId];

              // { noRetry: true } prevents this promise from hanging indefinitely while offline,
              // allowing the code execution to smoothly fall through to your queue logic.
              await Meteor.applyAsync('tasks.remove', deleteArgs, { noRetry: true });


              // Check connection status to queue the replay mechanism
              if (!Meteor.status().connected) {
                console.log('***********OFFLINE NOW, queueing Method tasks.remove for later');

                // Pass the plain targetId string cleanly to the queue
                queueMethod('tasks.remove', targetId, deviceId);
              } else {
                console.log('***********Nothing need to Queue')
              }

              console.log('Task deleted from local view:', messageObj.data);
            } else {
              console.error('Delete error: messageObj.data or _id property is missing.');
            }
            break;
          case "refresh":
            // console.log(tasks)
            console.log(messageObj.collection)
            console.log(`METEOR-FRONT:  will fetch latest tasks `)

            liRecords = await Meteor.callAsync('tasks.read');

            console.log('METEOR-FRONT: Fetched latest tasks from Meteor local collection:')
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

