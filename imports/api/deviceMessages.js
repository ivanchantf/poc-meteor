// imports/api/deviceMessages.js
import { Mongo } from 'meteor/mongo';
export const DeviceMessages = new Mongo.Collection('device_messages');

if (Meteor.isServer) {
  Meteor.publish('device.messages', function (roomsArray) {
    if (!roomsArray || !Array.isArray(roomsArray)) return this.ready();
    
    // Returns the cursor. Meteor handles the async streaming under the hood.
    return DeviceMessages.find({ roomName: { $in: roomsArray } });
  });
}