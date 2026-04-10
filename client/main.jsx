import React from 'react';
import { createRoot } from 'react-dom/client';
import { Meteor } from 'meteor/meteor';
import { App } from '/imports/ui/App';
import { Tasks } from '../imports/api/tasks';

import '../imports/api/methods';
import { Tracker } from "meteor/tracker";
import { queueMethod } from 'meteor/jam:offline';
import '../offline';
import _ from 'lodash';
Meteor.startup(async () => {

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
    // await navigator.serviceWorker.register('/sw.js'); // must match the name given to your service work file
    const container = document.getElementById('react-target'); //react-target is the id of the div in main.html where we want to render our React app
    Tracker.autorun((com)=>{
      const sub= Meteor.subscribe("tasks")
      if(sub.ready){

         Tasks.find({}).fetch().forEach((msg) => {
                  liRecords += JSON.stringify(msg) + "\n";

                });
         //console.log(liRecords)
      }
    })


    console.log('add event listener for message from service worker');

    // const sameListsContent=(list1, list2) => {
    //   if (list1.length !== list2.length) {
    //     return false;
    //   }
    //   const cleanedData1 = list1.map(({ _id, createdAt, cnt, ...rest }) => rest);
    //   const cleanedData2 = list2.map(({ _id, createdAt, cnt, ...rest }) => rest);
    //   console.log('Comparing cleaned data (without _id, createdAt, cnt):');
    //   console.log('Cleaned Data 1:', cleanedData1);
    //   console.log('Cleaned Data 2:', cleanedData2);
    //   return JSON.stringify(cleanedData1) === JSON.stringify(cleanedData2);
    // }

    window.addEventListener('message', async message => {
      try {
        console.log('METEROR-FRONT: Received message from service worker:', message.data);
        let m = "";

        let messageObj = JSON.parse(message.data)
        console.log('METEROR-FRONT: \n*********************************************************************\nParsed message object from service worker:\n****************************************\n');
        console.log(messageObj)

        switch (messageObj.type) {
          case "save":
            if (messageObj.data) {
              console.log('METEROR-FRONT: TYPE-SAVE Received message from service worker:', messageObj.data.text);

              const generateUniqueId = () => {
                let generateRandomString = (length) => {
                  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                  let result = '';
                  for (let i = 0; i < length; i++) {
                    result += chars.charAt(Math.floor(Math.random() * chars.length));
                  }
                  return `${new Date().getTime()}-${result}`;
                }
                return `${new Date().getTime()}_${generateRandomString(10)}`;
              }

              let uid = generateUniqueId()

              await Meteor.callAsync('tasks.insert', messageObj.data, uid);

              // if (!Meteor.status().connected) {
              //   console.log('***********OFFLINE NOW,will do insert when go back online')
              //   queueMethod('tasksRemote.insert', messageObj.data.text, uid)
              // }
              // else {
                // console.log('***********ONLINE NOW, will do insert to remote now')
                   
                console.log('METEROR-FRONT: will call tasksRemote.insert for save')
                await Meteor.callAsync('tasksRemote.insert', messageObj.data, uid);
                
                console.log('METEROR-FRONT: will call tasksExternal.insert for save')
                await Meteor.callAsync('tasksExternal.insert', messageObj);
              // }

              console.log('Task saved:', messageObj.data);
            } else {
              console.error('No task data found in message');
            }
            break;
          case "update":
            if (messageObj.data) {
              console.log('updating')
              await Meteor.callAsync('tasks.update', messageObj.data);



              // if (!Meteor.status().connected) {
              //   console.log('************OFFLINE NOW,will queue taskRemote.update')
              //   queueMethod('tasksRemote.update', messageObj.data.cnt, messageObj.data.text)
              // }
              // else {
              //   console.log('************ONLINE NOW, will call taskRemote.update')
                await Meteor.callAsync('tasksRemote.update', messageObj.data);
              // }

                console.log('METEROR-FRONT: will call tasksExternal.update ')
                await Meteor.callAsync('tasksExternal.update', messageObj);


              console.log('Task updated:', messageObj.data);
            } else {
              console.error('update error');
            }
            break;
          case "delete":
            if (messageObj.data) {
              console.log('deleting')
              await Meteor.callAsync('tasks.remove', messageObj.data._id);
              // if (!Meteor.status().connected) {
              //   console.log('************OFFLINE NOW,will queue taskRemote.remove')
              //   queueMethod('tasksRemote.remove', messageObj.data.cnt)
              // }
              // else {
                // console.log('************ONLINE NOW, will call taskRemote.remove')
                await Meteor.callAsync('tasksRemote.remove', messageObj.data._id);
              // }
                console.log('METEROR-FRONT: will call tasksExternal.remove ')
                await Meteor.callAsync('tasksExternal.remove', messageObj);


              console.log('Task deleted:', messageObj.data);
            } else {
              console.error('delete error');
            }
            break;
          case "refresh":
            // console.log(tasks)
            console.log(messageObj.collection)
            console.log(`METEOR-FRONT: Received refresh message from service worker, will fetch latest tasks and send back to pwa`)
            // const sub = await subscribeAndWait('tasks')
            // console.log(sub.ready())
            liRecords = await Meteor.callAsync('tasks.read');
            // .forEach((msg) => {
            //       liRecords += JSON.stringify(msg) + "\n";

            // });
            console.log('Fetched latest tasks from Meteor local collection:')
            console.log(liRecords)
            console.log('Sending liRecords from meteor to pwa')
            window.parent.parent.postMessage(JSON.stringify({ 'type': 'refresh','from':'meteor-front', 'data': liRecords }), "*");

            //ONLINE PART
            const remoteData = await Meteor.callAsync('tasksRemote.read');
              console.log('remote collection data fetched from meteor server:') 
              console.log(remoteData)
            // if (!sameListsContent(liRecords, remoteData)) {
            //   console.warn('Data mismatch between local and remote, sending remote data to pwa for refresh')
              window.parent.parent.postMessage(JSON.stringify({ 'type': 'refresh','from':'meteor-back', 'data': remoteData }), "*");

              const retrievedData= await Meteor.callAsync('tasksExternal.read', messageObj.collection);
              console.log('Data fetched from pwa-backend via Meteor method:', retrievedData);

              if(retrievedData){
                window.parent.parent.postMessage(JSON.stringify({ 'type': 'refresh','from':'pwa-backend', 'data': retrievedData }), "*");
              }
              else{
                console.warn('No data retrieved from pwa-backend, NOT sending remote data from  pwa-backend to pwa for refresh')
              }
            // }
            // else{
            //   console.log('✅Data is consistent between local and remote, no need to further call pwa-backend')
            //   window.parent.parent.postMessage(JSON.stringify({ 'type': 'refresh','from':'meteor-back', 'data': remoteData }), "*");
            //   window.parent.parent.postMessage(JSON.stringify({ 'type': 'refresh','from':'pwa-backend', 'data': remoteData }), "*");
            // }
            break;

          default:
            console.log('Unknown message type');
        }

        // Tasks.find().forEach((msg) => {
        //   m += JSON.stringify(msg) + "\n";
        // });
        // console.log(m);
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

