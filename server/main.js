import { Meteor } from 'meteor/meteor';
import { DeviceConnections } from '../imports/api/deviceConnections';
 import { CollectionUp } from '../imports/api/collectionUp';
import '../imports/api/collectionUpPublications';

import dotenv from 'dotenv';
import '../imports/api/offline';
import { Mongo, MongoInternals } from 'meteor/mongo';
import { logToFileByDate } from './util';
import { DeviceMessages } from '/imports/api/deviceMessages';
// const remoteUrl = "mongodb://192.168.75.8:27017/meteor";
// let remoteDriver = new MongoInternals.RemoteCollectionDriver(remoteUrl);
// export const CollectionUpRemote = new Mongo.Collection("collectionUp_remote", {
//   _driver: remoteDriver
// })
import dns from 'dns';

Meteor.startup(async () => {
  // Allow your standalone dashboard domain to access your DDP endpoints
  // WebApp.rawConnectHandlers.use((req, res, next) => {
  //   // Replace with your actual standalone React app's domain in production
  //   const allowedOrigin = 'http://localhost:5173'; 
    
  //   res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  //   res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  //   res.setHeader('Access-Control-Allow-Credentials', 'true');
  //   return next();
  // });
// // 1. Optimize lookups using database indexes
  DeviceConnections.rawCollection().createIndex({ deviceUuid: 1 });
  DeviceConnections.rawCollection().createIndex({ connectionId: 1 });
// // 2. Clear out lingering "online" statuses if the server previously crashed/restarted
  await DeviceConnections.updateAsync(
    { status: 'online' }, 
    { $set: { status: 'offline', lastSeen: new Date() } }, 
    { multi: true }
  );

  // 1. Fetch the cursor for the data you want to track
  const cursor = CollectionUp.find({});


  const pushToDSEBackend = async (payload,deviceId) => {
      
      // Try spreading the data array if the Meteor method expects multiple arguments

    console.log('Pushing data to DSE backend:', payload);
    let payloadWithoutDeviceId={...payload}
    delete payloadWithoutDeviceId.value.deviceId

      await Meteor.applyAsync('pushToDSEBackend', [{...payloadWithoutDeviceId,deviceId:deviceId}]);

      // if (!Meteor.status().connected) {
      //   // Spreading data here ensures jam:offline queues each object properly if that's what it expects
      //   queueMethod('pushToDSEBackend', ...payload);
      // }
  }
  // 2. Observe the changes
const handle = cursor.observe({
    // observe passes the full document object
    added(document) {
       console.log(`Document ${document._id} was added.`);
       pushToDSEBackend({
          type: 'insert',
          value: document
       },document.deviceId);
    },
    // observe passes (newDocument, oldDocument)
    changed(newDocument, oldDocument) {
      console.log(`Document ${newDocument._id} was updated.`);
      pushToDSEBackend({
        type: 'update',
        value: newDocument
      },newDocument.deviceId);
    },
    // observe passes the full document right before it's deleted
    removed(oldDocument) {
      console.log(`Document ${oldDocument._id} was removed.`);
      pushToDSEBackend({
        type: 'delete',
        value: oldDocument, // This will now be the full object!
      },oldDocument.deviceId);
    }
  });




});

async function sendToDevice(deviceUuid, payload) {
  console.log(`[Transport] Pushing via WebSocket to: ${deviceUuid}`);
  
  // Insert the message into the reactive queue
  const messageId = await DeviceMessages.insertAsync({
    deviceUuid,
    payload,
    createdAt: new Date()
  });

  // Optional: Clean up the message after a few seconds so the DB stays light
  Meteor.setTimeout(async () => {
    await DeviceMessages.removeAsync(messageId);
  }, 5000); 
}
  Meteor.methods({
    //Method for Cordova devices to announce themselves
    async 'devices.registerHeartbeat'(deviceUuid) {
   // check(deviceUuid, String);

    const connectionId = this.connection.id;
    const clientAddress = this.connection.clientAddress;

    await DeviceConnections.upsertAsync(
      { deviceUuid: deviceUuid },
      {
        $set: {
          connectionId: connectionId,
          ipAddress: clientAddress,
          status: 'online',
          lastSeen: new Date()
        }
      }
    );

    // Save UUID directly onto this active connection session object
    this.connection.deviceUuid = deviceUuid;
  },
// async 'devices.register'(deviceId) {
//   console.log('Registering device with ID:', deviceId);
//     this.connection.deviceId = deviceId;
//     return true;
//   },
    /**************************METEOR BACKEND -> DSE Back  ***************************/
    async 'pushToDSEBackend'(data) {
    
      console.log('Meteor backend performing pushToDSEBackend')
      console.log('Data received in pushToDSEBackend:', data);

      
       try {
        const response = await fetch('http://localhost:3003/api/sync-service/push-upward', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({...data}),
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const responseData = await response.json();
        console.log('Response from DSE backend:', responseData);
        console.log('====================')
       


      } catch (error) {
        console.error('Error pushing data to DSE backend:', error);
      }
    },

    async 'deviceConnections.updateRooms'(deviceId, roomsArray) {
    // simpleDDP unpacks the array [deviceId, updatedRooms] into these 2 arguments
    console.log('Updating rooms for device:', deviceId, 'with rooms:', roomsArray); 
    // Now this structural argument validation will pass perfectly!
    if (typeof deviceId !== 'string' || !Array.isArray(roomsArray)) {
      throw new Meteor.Error('invalid-arguments', 'Invalid payload structures submitted.');
    }

    return DeviceConnections.updateAsync(
      { _id: deviceId },
      { 
        $set: { 
          rooms: roomsArray,
          updatedAt: new Date()
        } 
      }
    );
  },
  async 'rooms.broadcastToDevices'(roomName, recordData) {
    console.log(`Broadcasting to devices in ${roomName} with record:`, recordData);
    // 1. Validate inputs
    if (!roomName || typeof roomName !== 'string') {
      throw new Meteor.Error('invalid-argument', 'Room name must be a string.');
    }

    // 2. Query MongoDB
    // MongoDB automatically searches inside arrays if the field ('rooms') is an array.
    const targetDevices = await DeviceConnections.find({
      rooms: roomName,
      status: 'online' // Optional: Only send if the device is currently online
    }).fetch();


    if (targetDevices.length === 0) {
      console.log(`No online devices found for ${roomName}`);
      return { success: true, count: 0 };
    }

    console.log(`Found ${targetDevices.length} device(s) for ${roomName}. Dispatching...`);

    // 3. Iterate and send according to deviceUuid
    targetDevices.forEach((device) => {
      sendToDevice(device.deviceUuid, recordData);
    });

    return {
      success: true,
      count: targetDevices.length
    };
  }

  })

// 4. Global listener to intercept connection drops
Meteor.onConnection((connection) => {
  connection.onClose(async () => {
    // If this specific closed socket was attached to a known device UUID
    if (connection.deviceUuid) {
      await DeviceConnections.updateAsync(
        { deviceUuid: connection.deviceUuid, connectionId: connection.id },
        {
          $set: {
            status: 'offline',
            lastSeen: new Date()
          }
        }
      );
    }
  });
});

// // 5. Publish the live stream channel
Meteor.publish('admin.deviceStatuses', function() {
  // If you want to be extra safe and ensure Meteor tracks changes 
  // on every property modification, fetch explicitly:
  return DeviceConnections.find({}, {
    fields: {
      deviceUuid: 1,
      connectionId: 1,
      ipAddress: 1,
      status: 1,
      lastSeen: 1,
      rooms: 1
    }
  });
});