// // imports/api/deviceMessages.js
import { Mongo } from 'meteor/mongo';
export const DeviceMessages = new Mongo.Collection('device_messages');

if (Meteor.isServer) {
  // Clear old messages on startup so it doesn't grow indefinitely
  Meteor.startup(async () => {
    await DeviceMessages.removeAsync({}); 
  });

  // Devices subscribe to this to receive their specific payloads
  Meteor.publish('device.messages', function (deviceUuid) {
    if (!deviceUuid) return this.ready();
    
    // Only send messages meant for this specific device UUID
    return  DeviceMessages.find({ deviceUuid });
  });
}