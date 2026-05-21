import { Meteor } from 'meteor/meteor';

 import { Tasks } from '../imports/api/tasks';
import '../imports/api/tasksPublications';

import dotenv from 'dotenv';
import '../imports/api/offline';
import { Mongo, MongoInternals } from 'meteor/mongo';
import { logToFileByDate } from './util';

const remoteUrl = "mongodb://192.168.75.51:27017/test";
let remoteDriver = new MongoInternals.RemoteCollectionDriver(remoteUrl);
export const TasksRemote = new Mongo.Collection("tasks_remote", {
  _driver: remoteDriver
})
import dns from 'dns';

// export const hasInternet = () => {
//   return new Promise((resolve) => {
//     // We resolve 'google.com' (or any stable domain)
//     // lookup() checks if the machine can reach a DNS server
//     dns.lookup('google.com', (err) => {
//       if (err && err.code === 'ENOTFOUND') {
//         resolve(false);
//       } else {
//         // If no error, or a different error (like timeout), 
//         // we assume the network interface is active.
//         resolve(true);
//       }
//     });
//   });
// };
// let actionQueue = [];
// let isProcessing = false; // The "Lock"

// const queueAction = (apiTask) => {
//   actionQueue.push(apiTask);
  
//   // Only start the processor if it isn't already running
//   if (!isProcessing) {
//     attemptQueueProcessing();
//   }
// };

// const attemptQueueProcessing = async () => {
//   // 1. Check if we're already busy or if the queue is empty
//   if (isProcessing || actionQueue.length === 0) return;

//   // 2. Set the lock
//   isProcessing = true;

//   // 3. Verify connection
//   if (!(await hasInternet())) {
//     console.log("Offline: Retrying in 5s...");
//     isProcessing = false; // Release lock so we can try again later
//     setTimeout(attemptQueueProcessing, 5000);
//     return;
//   }

//   console.log("Online! Processing queue...");

//   // 4. Process the queue while it has items
//   while (actionQueue.length > 0) {
//     const task = actionQueue[0]; // Look at the first task
    
//     try {
//       await task(); 
//       actionQueue.shift(); // Remove only AFTER successful execution
//       console.log(`Task finished, ${actionQueue.length} tasks left in queue.`);
//     } catch (error) {
//       console.error("Task failed. Stopping to preserve order.", error);
//       logToFileByDate(error, `Error execute Task in attemptQueueProcessing: - task: ${task}`);
//       isProcessing = false; 
//       // Optionally: retry this specific task in 5s
//       setTimeout(attemptQueueProcessing, 5000);
//       return; 
//     }
//   }

//   // 5. Final release of lock
//   isProcessing = false;
// };


// Meteor.startup(async () => {



//   Meteor.publish("tasks_remote", () => {
//     return TasksRemote.find();
//   });

//   Meteor.methods({

//     /**************************METEOR BACKEND -> MONGO DB  ***************************/
//     async 'tasksRemote.insert'(data, uid) {
//       console.log('Meteor backend performing INSERT')
//       console.log('tasksRemote.insert called with data:', data, 'and uid:', uid);
//         if (!data || !uid) {
//             throw new Meteor.Error('Task data and uid are required');
//         }
//         //   let collectionRemoteInstance ;
//         // if(Mongo.Collection.get(collectionRemoteName)){
//         //     collectionRemoteInstance = Mongo.Collection.get(collectionRemoteName);
//         // }
//         // else{
//         //   console.log(`Creating new remote collection instance for ${collectionRemoteName}`)
//         //     collectionRemoteInstance = new Mongo.Collection(collectionRemoteName, { _driver: remoteDriver });
//         // }


//         // const countRecords = await  Tasks.find().countAsync()+1;
//         // console.log(countRecords)
//         const taskId = await TasksRemote.insertAsync({ ...data,  _id:uid,createdAt: new Date() });
//         console.log('TaskRemote added with ID:', uid); // Add this line

//     },



//     async 'tasksRemote.update'(data) {
//               if (!data._id || !data) {
//                   throw new Meteor.Error('Task _id and data are required');
//               }
//               await TasksRemote.updateAsync({ _id: data._id }, data)
//               console.log('TaskRemote updated ID & data:', data._id, '  ', data); // Add this line
//     },


//     async 'tasksRemote.remove'(id) {
//       if (!id) {
//         throw new Meteor.Error('Task id is required');
//       }
//       await TasksRemote.removeAsync({ _id: id });
//       console.log('TaskRemote removed ID :', id); // Add this line
//     },


//     async 'tasksRemote.read'() {
//       // console.log(`tasksRemote.read: Reading from remote collection: ${collectionRemoteName}`);
//       //     let collectionRemoteInstance ;
//       //     collectionRemoteInstance = MongoInternals.defaultRemoteCollectionDriver().mongo.db.collection(collectionRemoteName);
//       //   if(typeof(collectionRemoteInstance) !=='undefined' && Object.keys(collectionRemoteInstance).length > 0){
//       //       console.log(`Collection instance already exists for ${collectionRemoteName}`)
//       //       console.log(collectionRemoteInstance)
//       //   }
//       //   else{
//       //     console.log(`Creating new remote collection instance for ${collectionRemoteName}`)
//       //       collectionRemoteInstance = new Mongo.Collection(collectionRemoteName, { _driver: remoteDriver });
//       //   }
//       return TasksRemote.find({}).fetch()
//     },

//     /**************************METEOR BACKEND -> PWA(DSE) BACKEND  ***************************/
//     async 'tasksExternal.insert'(messageObj) {
//       console.log('In tasksExternal.insert, received messageObj:', messageObj);
//       queueAction(async () => {
//         console.log("METEOR BACKEND -> PWA(DSE) BACKEND:insert...");
//          await fetch(messageObj.path, { method: messageObj.httpType, body: JSON.stringify(messageObj.data), headers: { 'Content-Type': 'application/json' } })
//           .then(response => response.json())
//           .then(data => {
//             console.log('Data insert to pwa-backend:', data);
//           })
//           .catch(error => {
//             console.error('Error insert to pwa-backend:', error);
//             logToFileByDate(error, `Error insert to pwa-backend: - Path: ${messageObj.path}`);
//           });
//       });


//     },

//     async 'tasksExternal.update'(messageObj) {
//       console.log('In tasksExternal.update, received messageObj:', messageObj);
//             queueAction(async () => {
//         console.log("METEOR BACKEND -> PWA(DSE) BACKEND:update...");
//          await fetch(messageObj.path, { method: messageObj.httpType, body: JSON.stringify(messageObj.data), headers: { 'Content-Type': 'application/json' } })
//         .then(response => response.json())
//         .then(data => {
//           console.log('Data UPDATE in pwa-backend:', data);
//         })
//         .catch(error => {
//           console.error('Error UPDATE in pwa-backend:', error);
//           logToFileByDate(error, `Error UPDATE in pwa-backend: - Path: ${messageObj.path}`);
//         });

//       });

//     },
//     async 'tasksExternal.remove'(messageObj) {
//       console.log('In tasksExternal.remove, received messageObj:', messageObj);
//             queueAction(async () => {
//         console.log("METEOR BACKEND -> PWA(DSE) BACKEND:delete...");
//          await       fetch(messageObj.path, { method: messageObj.httpType, body: JSON.stringify(messageObj.data), headers: { 'Content-Type': 'application/json' } })
//         .then(response => response.json())
//         .then(data => {
//           console.log('Data DELETE in pwa-backend:', data);
//         })
//         .catch(error => {
//           console.error('Error DELETE in pwa-backend:', error);
//           logToFileByDate(error, `Error DELETE in pwa-backend: ${messageObj.path}`);
//         });

//       });

//     },
//     async 'tasksExternal.read'(messageObj) {
//       console.log('In tasksExternal.read, received messageObj:', messageObj);

//       return fetch(messageObj.path, {
//         method: 'GET',
//         headers: { 'Content-Type': 'application/json' }
//       })
//         .then(response => {
//           if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//           }
//           return response.json(); // Pass the parsed JSON to the next .then()
//         })
//         .then(data => {
//           console.log('Data fetched successfully:', data);
//           return data; // This becomes the final result of the Method
//         })
//         .catch(error => {

//           logToFileByDate(error, `tasksExternal.read - Path: ${messageObj.path}`);
//           console.error('Error fetching data from pwa-backend:', error);
//         });
//     }
//   })


// });
